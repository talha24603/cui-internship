import Groq from "groq-sdk";
import { HELP_KNOWLEDGE_BASE, type HelpKnowledgeItem, type HelpRole } from "@/utils/chat/helpKnowledge";
import type { RetrievedHelpItem } from "@/utils/chat/retrieval";
import prisma from "@/utils/prisma";

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
const knowledgeEmbeddingCache = new Map<string, number[]>();
let warmupPromise: Promise<void> | null = null;
let pgvectorSyncPromise: Promise<void> | null = null;
const SEMANTIC_DEBUG = (process.env.SEMANTIC_DEBUG || "true").toLowerCase() !== "false";

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
  | {
      provider: "groq";
      client: Groq;
    }
  | {
      provider: "openrouter";
      apiKey: string;
    }
  | {
      provider: "ollama";
    };

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

function buildEmbeddingText(item: HelpKnowledgeItem) {
  return [
    item.title,
    `Module: ${item.module}`,
    `Roles: ${item.roleScope.join(", ")}`,
    `Keywords: ${item.keywords.join(", ")}`,
    `Content: ${item.content}`,
    `Steps: ${item.steps.join(" ")}`,
    `Blockers: ${item.blockers.join(" ")}`,
  ].join("\n");
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
  for (const value of v) {
    sum += value * value;
  }
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

function escapeSqlLiteral(value: string) {
  return value.replace(/'/g, "''");
}

function toVectorLiteral(vector: number[]) {
  const values = vector
    .map((value) => (Number.isFinite(value) ? value : 0))
    .join(",");
  return `[${values}]`;
}

function toSqlTextArray(values: string[]) {
  const escaped = values.map((value) => `'${escapeSqlLiteral(value)}'`).join(",");
  return `ARRAY[${escaped}]::text[]`;
}

function normalizeEmbedding(value: string | number[] | undefined): number[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function warmKnowledgeEmbeddings(client: Groq) {
  const missing = HELP_KNOWLEDGE_BASE.filter((item) => !knowledgeEmbeddingCache.has(item.id));
  if (missing.length === 0) return;
  debugLog("Warming Groq embeddings for knowledge base", { missingCount: missing.length });

  const inputs = missing.map((item) => buildEmbeddingText(item));
  const response = await client.embeddings.create({
    model: GROQ_EMBEDDING_MODEL,
    input: inputs,
  });

  response.data.forEach((entry, index) => {
    const item = missing[index];
    const embedding = normalizeEmbedding(entry.embedding);
    if (item && embedding) {
      knowledgeEmbeddingCache.set(item.id, embedding);
    }
  });
  debugLog("Groq embedding warmup complete", { cacheSize: knowledgeEmbeddingCache.size });
}

async function ensureKnowledgeEmbeddings(client: Groq) {
  if (!warmupPromise) {
    warmupPromise = warmKnowledgeEmbeddings(client).finally(() => {
      warmupPromise = null;
    });
  }
  await warmupPromise;
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
    const payload = (await response.json()) as {
      data?: Array<{ embedding?: unknown }>;
    };
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

async function warmKnowledgeEmbeddingsWithOpenRouter(apiKey: string) {
  const missing = HELP_KNOWLEDGE_BASE.filter((item) => !knowledgeEmbeddingCache.has(item.id));
  if (missing.length > 0) {
    debugLog("Warming OpenRouter embeddings for knowledge base", { missingCount: missing.length });
  }
  for (const item of missing) {
    const embedding = await getOpenRouterEmbedding(buildEmbeddingText(item), apiKey);
    if (embedding) {
      knowledgeEmbeddingCache.set(item.id, embedding);
    }
  }
  if (missing.length > 0) {
    debugLog("OpenRouter embedding warmup complete", { cacheSize: knowledgeEmbeddingCache.size });
  }
}

async function ensureKnowledgeEmbeddingsWithOpenRouter(apiKey: string) {
  if (!warmupPromise) {
    warmupPromise = warmKnowledgeEmbeddingsWithOpenRouter(apiKey).finally(() => {
      warmupPromise = null;
    });
  }
  await warmupPromise;
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

async function warmKnowledgeEmbeddingsWithOllama() {
  const missing = HELP_KNOWLEDGE_BASE.filter((item) => !knowledgeEmbeddingCache.has(item.id));
  if (missing.length > 0) {
    debugLog("Warming Ollama embeddings for knowledge base", { missingCount: missing.length });
  }
  for (const item of missing) {
    const embedding = await getOllamaEmbedding(buildEmbeddingText(item));
    if (embedding) {
      knowledgeEmbeddingCache.set(item.id, embedding);
    }
  }
  if (missing.length > 0) {
    debugLog("Ollama embedding warmup complete", { cacheSize: knowledgeEmbeddingCache.size });
  }
}

async function ensureKnowledgeEmbeddingsWithOllama() {
  if (!warmupPromise) {
    warmupPromise = warmKnowledgeEmbeddingsWithOllama().finally(() => {
      warmupPromise = null;
    });
  }
  await warmupPromise;
}

async function syncKnowledgeIntoPgvector() {
  if (!USE_PGVECTOR || !PGVECTOR_AUTO_SYNC || knowledgeEmbeddingCache.size === 0) return;
  try {
    debugLog("Attempting pgvector sync", {
      autoSync: PGVECTOR_AUTO_SYNC,
      cacheSize: knowledgeEmbeddingCache.size,
    });
    const tableCheck = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'help_chunks') AS exists",
    );
    if (!tableCheck[0]?.exists) {
      debugLog("pgvector sync skipped: help_chunks table not found");
      return;
    }

    const existingRows = await prisma.$queryRawUnsafe<Array<{ docId: string }>>(
      'SELECT doc_id AS "docId" FROM help_chunks',
    );
    const existingDocIds = new Set(existingRows.map((row) => row.docId));
    const missing = HELP_KNOWLEDGE_BASE.filter((item) => !existingDocIds.has(item.id));
    if (missing.length === 0) {
      debugLog("pgvector sync skipped: no missing docs");
      return;
    }

    for (const item of missing) {
      const embedding = knowledgeEmbeddingCache.get(item.id);
      if (!embedding) continue;

      const rolesSql = toSqlTextArray(item.roleScope);
      const contentText = buildEmbeddingText(item);
      const vectorLiteral = toVectorLiteral(embedding);
      const docId = escapeSqlLiteral(item.id);
      const title = escapeSqlLiteral(item.title);
      const module = escapeSqlLiteral(item.module);
      const content = escapeSqlLiteral(item.content);
      const chunkText = escapeSqlLiteral(contentText);

      await prisma.$executeRawUnsafe(`
        INSERT INTO help_docs (id, title, module, role_scope, content)
        VALUES ('${docId}', '${title}', '${module}', ${rolesSql}, '${content}')
        ON CONFLICT (id) DO UPDATE
          SET title = EXCLUDED.title,
              module = EXCLUDED.module,
              role_scope = EXCLUDED.role_scope,
              content = EXCLUDED.content
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO help_chunks (id, doc_id, chunk_index, chunk_text, role_scope, module, embedding)
        VALUES ('${docId}-0', '${docId}', 0, '${chunkText}', ${rolesSql}, '${module}', '${vectorLiteral}'::vector)
        ON CONFLICT (doc_id, chunk_index) DO UPDATE
          SET chunk_text = EXCLUDED.chunk_text,
              role_scope = EXCLUDED.role_scope,
              module = EXCLUDED.module,
              embedding = EXCLUDED.embedding
      `);
    }
    debugLog("pgvector sync complete", { insertedOrUpdated: missing.length });
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
  if (!USE_PGVECTOR) {
    debugLog("pgvector retrieval disabled by USE_PGVECTOR=false");
    return [];
  }
  try {
    const vectorLiteral = toVectorLiteral(queryVector);
    const safeRole = /^[A-Z_]+$/.test(role) ? role : "ALL";
    const rows = await prisma.$queryRawUnsafe<Array<{ docId: string; similarity: number }>>(`
      SELECT c.doc_id AS "docId",
             (1 - (c.embedding <=> '${vectorLiteral}'::vector))::float8 AS similarity
      FROM help_chunks c
      WHERE c.embedding IS NOT NULL
        AND (c.role_scope @> ARRAY['${safeRole}']::text[] OR c.role_scope @> ARRAY['ALL']::text[])
      ORDER BY c.embedding <=> '${vectorLiteral}'::vector
      LIMIT ${Math.max(topK, 1)}
    `);

    if (rows.length === 0) {
      debugLog("pgvector retrieval returned no rows", { role: safeRole, topK });
      return [];
    }
    const byId = new Map(HELP_KNOWLEDGE_BASE.map((item) => [item.id, item]));
    const ranked = rows
      .map((row) => {
        const source = byId.get(row.docId);
        if (!source) return null;
        return {
          ...source,
          score: Math.max(0, Number(row.similarity) + routeBoost(source.module, currentRoute)),
        };
      })
      .filter((item): item is RetrievedHelpItem => Boolean(item))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    debugLog("pgvector retrieval success", {
      role: safeRole,
      topK,
      returned: ranked.length,
      topIds: ranked.slice(0, 3).map((r) => r.id),
    });
    return ranked;
  } catch (error) {
    console.warn("pgvector retrieval failed; using in-memory semantic retrieval:", error);
    return [];
  }
}

export async function retrieveSemanticHelpContext(
  input: SemanticRetrievalInput,
): Promise<RetrievedHelpItem[]> {
  debugLog("Semantic retrieval requested", {
    role: input.role,
    topK: input.topK ?? 4,
    route: input.currentRoute || "unknown",
  });
  const embeddingClient = getEmbeddingClient();
  if (!embeddingClient) return [];
  const { provider } = embeddingClient;

  let queryVector: number[] | null = null;
  if (provider === "groq") {
    const { client } = embeddingClient;
    try {
      await ensureKnowledgeEmbeddings(client);
      const queryEmbedding = await client.embeddings.create({
        model: GROQ_EMBEDDING_MODEL,
        input: input.query,
      });
      queryVector = normalizeEmbedding(queryEmbedding.data[0]?.embedding);
      debugLog("Groq query embedding ready", { dimensions: queryVector?.length ?? 0 });
    } catch (error) {
      console.warn("Groq semantic retrieval failed, falling back to lexical retrieval:", error);
      return [];
    }
  } else if (provider === "openrouter") {
    const { apiKey } = embeddingClient;
    try {
      await ensureKnowledgeEmbeddingsWithOpenRouter(apiKey);
      queryVector = await getOpenRouterEmbedding(input.query, apiKey);
      debugLog("OpenRouter query embedding ready", { dimensions: queryVector?.length ?? 0 });
    } catch (error) {
      console.warn("OpenRouter semantic retrieval failed, falling back to lexical retrieval:", error);
      return [];
    }
  } else {
    try {
      await ensureKnowledgeEmbeddingsWithOllama();
      queryVector = await getOllamaEmbedding(input.query);
      debugLog("Ollama query embedding ready", { dimensions: queryVector?.length ?? 0 });
    } catch (error) {
      console.warn("Ollama semantic retrieval failed, falling back to lexical retrieval:", error);
      return [];
    }
  }

  if (!queryVector) return [];
  await ensurePgvectorSynced();

  const role = input.role.toUpperCase();
  const topK = Math.max(1, Math.min(input.topK ?? 4, 8));
  const fromPgvector = await retrieveFromPgvector(queryVector, role, topK, input.currentRoute);
  if (fromPgvector.length > 0) {
    debugLog("Semantic retrieval path: pgvector");
    return fromPgvector;
  }

  // Fallback semantic path: in-memory vectors (useful for local/dev even if DB is unavailable).
  if (knowledgeEmbeddingCache.size === 0) {
    debugLog("Semantic retrieval fallback failed: in-memory cache empty");
    return [];
  }

  try {
    const inMemory = HELP_KNOWLEDGE_BASE.filter((item) => roleMatches(item.roleScope, role))
      .map((item) => {
        const itemVector = knowledgeEmbeddingCache.get(item.id);
        if (!itemVector) return null;
        const semanticScore = cosineSimilarity(queryVector, itemVector);
        const score = Math.max(0, semanticScore + routeBoost(item.module, input.currentRoute));
        return {
          ...item,
          score,
        };
      })
      .filter((item): item is RetrievedHelpItem => Boolean(item))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    debugLog("Semantic retrieval path: in-memory cache", {
      returned: inMemory.length,
      topIds: inMemory.slice(0, 3).map((r) => r.id),
    });
    return inMemory;
  } catch (error) {
    console.warn("Semantic retrieval failed, falling back to lexical retrieval:", error);
    return [];
  }
}
