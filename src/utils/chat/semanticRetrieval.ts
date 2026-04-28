import Groq from "groq-sdk";
import { HELP_KNOWLEDGE_BASE, type HelpKnowledgeItem, type HelpRole } from "@/utils/chat/helpKnowledge";
import type { RetrievedHelpItem } from "@/utils/chat/retrieval";
import prisma from "@/utils/prisma";
import {
  buildEmbeddingInputFromChunk,
  chunkHelpKnowledgeBase,
  type SemanticHelpChunk,
} from "@/utils/chat/chunking";

type SemanticRetrievalInput = {
  query: string;
  role: string;
  currentRoute?: string;
  topK?: number;
};

const EMBEDDING_PROVIDER = (process.env.EMBEDDING_PROVIDER || "groq").toLowerCase();
const GROQ_EMBEDDING_MODEL = process.env.GROK_EMBEDDING_MODEL || "nomic-embed-text-v1.5";
const OPENROUTER_EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL || "nomic-ai/nomic-embed-text-v1.5";
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const USE_PGVECTOR = (process.env.USE_PGVECTOR || "true").toLowerCase() !== "false";
const PGVECTOR_AUTO_SYNC = (process.env.PGVECTOR_AUTO_SYNC || "true").toLowerCase() !== "false";
const SEMANTIC_DEBUG = (process.env.SEMANTIC_DEBUG || "true").toLowerCase() !== "false";

const KNOWLEDGE_CHUNKS = chunkHelpKnowledgeBase(HELP_KNOWLEDGE_BASE);
const chunkEmbeddingCache = new Map<string, number[]>();
const itemById = new Map(HELP_KNOWLEDGE_BASE.map((item) => [item.id, item]));
let warmupPromise: Promise<void> | null = null;
let pgvectorSyncPromise: Promise<void> | null = null;

function debugLog(message: string, meta?: Record<string, unknown>) {
  if (!SEMANTIC_DEBUG) return;
  if (meta) {
    console.log(`[semantic] ${message}`, meta);
    return;
  }
  console.log(`[semantic] ${message}`);
}

function getGroqClient() {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  return apiKey;
}

type EmbeddingClient =
  | { provider: "groq"; client: Groq }
  | { provider: "openrouter"; apiKey: string }
  | { provider: "ollama" };

function getEmbeddingClient(): EmbeddingClient | null {
  if (EMBEDDING_PROVIDER === "openrouter") {
    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
      debugLog("OpenRouter embedding provider unavailable: missing OPENROUTER_API_KEY");
      return null;
    }
    debugLog("Using OpenRouter embedding provider", {
      model: OPENROUTER_EMBEDDING_MODEL,
      baseUrl: OPENROUTER_BASE_URL,
    });
    return { provider: "openrouter", apiKey };
  }
  if (EMBEDDING_PROVIDER === "ollama") {
    debugLog("Using Ollama embedding provider", {
      model: OLLAMA_EMBEDDING_MODEL,
      baseUrl: OLLAMA_BASE_URL,
    });
    return { provider: "ollama" };
  }
  const client = getGroqClient();
  if (!client) {
    debugLog("Groq embedding provider unavailable: missing GROK_API_KEY");
    return null;
  }
  debugLog("Using Groq embedding provider", { model: GROQ_EMBEDDING_MODEL });
  return { provider: "groq", client };
}

function roleMatches(itemRoles: HelpRole[], role: string) {
  return itemRoles.includes("ALL") || itemRoles.includes(role as HelpRole);
}

function dotProduct(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += (a[i] || 0) * (b[i] || 0);
  }
  return sum;
}

function magnitude(v: number[]) {
  let sum = 0;
  for (const value of v) sum += value * value;
  return Math.sqrt(sum);
}

function cosineSimilarity(a: number[], b: number[]) {
  const denom = magnitude(a) * magnitude(b);
  if (!denom) return 0;
  return dotProduct(a, b) / denom;
}

function routeBoost(module: string, currentRoute?: string) {
  if (!currentRoute) return 0;
  return currentRoute.toLowerCase().includes(module.toLowerCase()) ? 0.08 : 0;
}

function normalizeEmbedding(value: string | number[] | undefined): number[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) return parsed;
    return null;
  } catch {
    return null;
  }
}

function escapeSqlLiteral(value: string) {
  return value.replace(/'/g, "''");
}

function toVectorLiteral(vector: number[]) {
  return `[${vector.map((n) => (Number.isFinite(n) ? n : 0)).join(",")}]`;
}

function toSqlTextArray(values: string[]) {
  const escaped = values.map((value) => `'${escapeSqlLiteral(value)}'`).join(",");
  return `ARRAY[${escaped}]::text[]`;
}

function inferModuleFromRoute(currentRoute?: string) {
  if (!currentRoute) return null;
  const route = currentRoute.toLowerCase();
  const tokens = route.split(/[^a-z0-9]+/g).filter(Boolean);
  if (tokens.length === 0) return null;
  const knownModules = new Set(KNOWLEDGE_CHUNKS.map((chunk) => chunk.module.toLowerCase()));
  const found = tokens.find((token) => knownModules.has(token));
  return found || null;
}

function toRetrievedItemsFromChunkScores(scoresByItem: Map<string, number>) {
  return [...scoresByItem.entries()]
    .map(([itemId, score]) => {
      const item = itemById.get(itemId);
      if (!item) return null;
      return { ...item, score };
    })
    .filter((item): item is RetrievedHelpItem => Boolean(item))
    .sort((a, b) => b.score - a.score);
}

async function getOpenRouterEmbedding(input: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_EMBEDDING_MODEL,
        input,
      }),
    });
    if (!response.ok) {
      debugLog("OpenRouter embedding request failed", { status: response.status });
      return null;
    }
    const payload = (await response.json()) as { data?: Array<{ embedding?: unknown }> };
    const embedding = payload.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) return null;
    if (!embedding.every((value) => typeof value === "number")) return null;
    debugLog("OpenRouter embedding generated", { dimensions: embedding.length });
    return embedding as number[];
  } catch {
    debugLog("OpenRouter embedding request failed");
    return null;
  }
}

async function getOllamaEmbedding(input: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_EMBEDDING_MODEL,
        prompt: input,
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { embedding?: unknown };
    if (!Array.isArray(payload.embedding)) return null;
    if (!payload.embedding.every((value) => typeof value === "number")) return null;
    debugLog("Ollama embedding generated", { dimensions: payload.embedding.length });
    return payload.embedding as number[];
  } catch {
    debugLog("Ollama embedding request failed");
    return null;
  }
}

async function embedSingleText(input: string, providerClient: EmbeddingClient): Promise<number[] | null> {
  if (providerClient.provider === "groq") {
    const response = await providerClient.client.embeddings.create({
      model: GROQ_EMBEDDING_MODEL,
      input,
    });
    return normalizeEmbedding(response.data[0]?.embedding);
  }
  if (providerClient.provider === "openrouter") {
    return getOpenRouterEmbedding(input, providerClient.apiKey);
  }
  return getOllamaEmbedding(input);
}

async function warmChunkEmbeddings(providerClient: EmbeddingClient) {
  const missing = KNOWLEDGE_CHUNKS.filter((chunk) => !chunkEmbeddingCache.has(chunk.id));
  if (missing.length === 0) return;
  debugLog("Warming semantic chunk embeddings", { missingCount: missing.length, provider: providerClient.provider });

  if (providerClient.provider === "groq") {
    const response = await providerClient.client.embeddings.create({
      model: GROQ_EMBEDDING_MODEL,
      input: missing.map((chunk) => buildEmbeddingInputFromChunk(chunk)),
    });
    response.data.forEach((entry, index) => {
      const chunk = missing[index];
      const embedding = normalizeEmbedding(entry.embedding);
      if (chunk && embedding) chunkEmbeddingCache.set(chunk.id, embedding);
    });
  } else {
    for (const chunk of missing) {
      const embedding = await embedSingleText(buildEmbeddingInputFromChunk(chunk), providerClient);
      if (embedding) chunkEmbeddingCache.set(chunk.id, embedding);
    }
  }
  debugLog("Semantic chunk warmup complete", { cacheSize: chunkEmbeddingCache.size });
}

async function ensureChunkEmbeddings(providerClient: EmbeddingClient) {
  if (!warmupPromise) {
    warmupPromise = warmChunkEmbeddings(providerClient).finally(() => {
      warmupPromise = null;
    });
  }
  await warmupPromise;
}

async function ensurePgvectorSchema() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE help_chunks
    ADD COLUMN IF NOT EXISTS item_id text,
    ADD COLUMN IF NOT EXISTS chunk_title text,
    ADD COLUMN IF NOT EXISTS keywords text[]
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE help_chunks
    SET item_id = COALESCE(item_id, doc_id),
        keywords = COALESCE(keywords, ARRAY[]::text[])
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS help_chunks_item_chunk_idx
    ON help_chunks (item_id, chunk_index)
  `);
}

async function syncKnowledgeIntoPgvector() {
  if (!USE_PGVECTOR || !PGVECTOR_AUTO_SYNC || chunkEmbeddingCache.size === 0) return;
  try {
    await ensurePgvectorSchema();
    const tableCheck = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'help_chunks') AS exists",
    );
    if (!tableCheck[0]?.exists) return;

    const existingRows = await prisma.$queryRawUnsafe<Array<{ chunkId: string }>>(
      'SELECT id AS "chunkId" FROM help_chunks',
    );
    const existing = new Set(existingRows.map((row) => row.chunkId));
    const missingChunks = KNOWLEDGE_CHUNKS.filter((chunk) => !existing.has(chunk.id));
    if (missingChunks.length === 0) return;

    for (const chunk of missingChunks) {
      const parent = itemById.get(chunk.itemId);
      const embedding = chunkEmbeddingCache.get(chunk.id);
      if (!parent || !embedding) continue;
      const rolesSql = toSqlTextArray(chunk.roleScope);
      const keywordsSql = toSqlTextArray(chunk.keywords);
      const vectorLiteral = toVectorLiteral(embedding);
      const safeDocId = escapeSqlLiteral(parent.id);
      const safeChunkId = escapeSqlLiteral(chunk.id);
      const safeTitle = escapeSqlLiteral(parent.title);
      const safeModule = escapeSqlLiteral(parent.module);
      const safeContent = escapeSqlLiteral(parent.content);
      const safeChunkText = escapeSqlLiteral(chunk.content);
      const safeChunkTitle = chunk.chunkTitle ? `'${escapeSqlLiteral(chunk.chunkTitle)}'` : "NULL";

      await prisma.$executeRawUnsafe(`
        INSERT INTO help_docs (id, title, module, role_scope, content)
        VALUES ('${safeDocId}', '${safeTitle}', '${safeModule}', ${rolesSql}, '${safeContent}')
        ON CONFLICT (id) DO UPDATE
          SET title = EXCLUDED.title,
              module = EXCLUDED.module,
              role_scope = EXCLUDED.role_scope,
              content = EXCLUDED.content
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO help_chunks (id, doc_id, item_id, chunk_index, chunk_title, chunk_text, role_scope, module, keywords, embedding)
        VALUES ('${safeChunkId}', '${safeDocId}', '${safeDocId}', ${chunk.chunkIndex}, ${safeChunkTitle}, '${safeChunkText}', ${rolesSql}, '${safeModule}', ${keywordsSql}, '${vectorLiteral}'::vector)
        ON CONFLICT (id) DO UPDATE
          SET chunk_text = EXCLUDED.chunk_text,
              chunk_title = EXCLUDED.chunk_title,
              role_scope = EXCLUDED.role_scope,
              module = EXCLUDED.module,
              keywords = EXCLUDED.keywords,
              embedding = EXCLUDED.embedding
      `);
    }
    debugLog("pgvector chunk sync complete", { insertedOrUpdated: missingChunks.length });
  } catch (error) {
    console.warn("pgvector sync failed; continuing with in-memory semantic retrieval:", error);
  }
}

async function ensurePgvectorSynced() {
  if (!USE_PGVECTOR || !PGVECTOR_AUTO_SYNC) return;
  if (!pgvectorSyncPromise) {
    pgvectorSyncPromise = syncKnowledgeIntoPgvector().finally(() => {
      pgvectorSyncPromise = null;
    });
  }
  await pgvectorSyncPromise;
}

async function retrieveFromPgvector(
  queryVector: number[],
  role: string,
  topK: number,
  currentRoute?: string,
): Promise<RetrievedHelpItem[]> {
  if (!USE_PGVECTOR) return [];
  try {
    const vectorLiteral = toVectorLiteral(queryVector);
    const safeRole = /^[A-Z_]+$/.test(role) ? role : "ALL";
    const moduleHint = inferModuleFromRoute(currentRoute);
    const moduleFilter = moduleHint ? `AND c.module = '${escapeSqlLiteral(moduleHint)}'` : "";

    const rows = await prisma.$queryRawUnsafe<Array<{ itemId: string; similarity: number; module: string }>>(`
      SELECT COALESCE(c.item_id, c.doc_id) AS "itemId",
             c.module AS "module",
             MAX((1 - (c.embedding <=> '${vectorLiteral}'::vector))::float8) AS similarity
      FROM help_chunks c
      WHERE c.embedding IS NOT NULL
        AND (c.role_scope @> ARRAY['${safeRole}']::text[] OR c.role_scope @> ARRAY['ALL']::text[])
        ${moduleFilter}
      GROUP BY COALESCE(c.item_id, c.doc_id), c.module
      ORDER BY MAX(c.embedding <=> '${vectorLiteral}'::vector) ASC
      LIMIT ${Math.max(topK * 2, 4)}
    `);

    if (rows.length === 0) return [];
    const scoresByItem = new Map<string, number>();
    for (const row of rows) {
      const base = Math.max(0, Number(row.similarity));
      const boosted = Math.max(0, base + routeBoost(row.module, currentRoute));
      const prev = scoresByItem.get(row.itemId);
      if (prev === undefined || boosted > prev) scoresByItem.set(row.itemId, boosted);
    }
    return toRetrievedItemsFromChunkScores(scoresByItem).slice(0, topK);
  } catch (error) {
    console.warn("pgvector retrieval failed; using in-memory semantic retrieval:", error);
    return [];
  }
}

function retrieveFromInMemoryChunks(
  queryVector: number[],
  role: string,
  topK: number,
  currentRoute?: string,
) {
  const scoresByItem = new Map<string, number>();
  for (const chunk of KNOWLEDGE_CHUNKS) {
    if (!roleMatches(chunk.roleScope, role)) continue;
    const chunkVector = chunkEmbeddingCache.get(chunk.id);
    if (!chunkVector) continue;
    const semanticScore = cosineSimilarity(queryVector, chunkVector);
    const score = Math.max(0, semanticScore + routeBoost(chunk.module, currentRoute));
    const previous = scoresByItem.get(chunk.itemId);
    if (previous === undefined || score > previous) {
      scoresByItem.set(chunk.itemId, score);
    }
  }
  return toRetrievedItemsFromChunkScores(scoresByItem).slice(0, topK);
}

export async function retrieveSemanticHelpContext(
  input: SemanticRetrievalInput,
): Promise<RetrievedHelpItem[]> {
  debugLog("Semantic retrieval requested", {
    role: input.role,
    topK: input.topK ?? 4,
    route: input.currentRoute || "unknown",
  });

  const providerClient = getEmbeddingClient();
  if (!providerClient) return [];

  let queryVector: number[] | null = null;
  try {
    await ensureChunkEmbeddings(providerClient);
    queryVector = await embedSingleText(input.query, providerClient);
  } catch (error) {
    console.warn("Semantic embedding generation failed, falling back to lexical retrieval:", error);
    return [];
  }

  if (!queryVector) return [];

  await ensurePgvectorSynced();
  const role = input.role.toUpperCase();
  const topK = Math.max(1, Math.min(input.topK ?? 4, 8));
  const fromPgvector = await retrieveFromPgvector(queryVector, role, topK, input.currentRoute);
  if (fromPgvector.length > 0) {
    debugLog("Semantic retrieval path: pgvector", {
      returned: fromPgvector.length,
      topIds: fromPgvector.slice(0, 3).map((item) => item.id),
    });
    return fromPgvector;
  }

  const fromMemory = retrieveFromInMemoryChunks(queryVector, role, topK, input.currentRoute);
  if (fromMemory.length > 0) {
    debugLog("Semantic retrieval path: in-memory chunks", {
      returned: fromMemory.length,
      topIds: fromMemory.slice(0, 3).map((item) => item.id),
    });
  }
  return fromMemory;
}
