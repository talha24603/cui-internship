import type { HelpKnowledgeItem, HelpRole } from "@/utils/chat/helpKnowledge";

export type SemanticHelpChunk = {
  id: string;
  itemId: string;
  chunkIndex: number;
  chunkTitle: string | null;
  content: string;
  module: string;
  roleScope: HelpRole[];
  keywords: string[];
};

type Section = {
  title: string | null;
  content: string;
};

const MAX_TOKENS_PER_CHUNK = 500;
const OVERLAP_TOKENS = 75;

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function splitParagraphs(content: string) {
  return content
    .split(/\n{2,}/g)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);
}

function splitContentIntoSemanticSections(content: string): Section[] {
  const normalized = content.replace(/\r/g, "");
  if (!normalized.trim()) return [];

  const lines = normalized.split("\n");
  const sections: Section[] = [];
  let currentTitle: string | null = null;
  let currentBuffer: string[] = [];

  const flush = () => {
    const body = normalizeWhitespace(currentBuffer.join(" ").trim());
    if (body) sections.push({ title: currentTitle, content: body });
    currentBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBuffer.length > 0) currentBuffer.push("\n");
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6}\s+.+)$/);
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);

    if (headingMatch) {
      flush();
      currentTitle = headingMatch[1].replace(/^#{1,6}\s+/, "").trim() || null;
      continue;
    }

    if (numberedMatch || bulletMatch) {
      flush();
      currentTitle = currentTitle;
      currentBuffer.push(trimmed);
      flush();
      continue;
    }

    currentBuffer.push(trimmed);
  }

  flush();

  if (sections.length === 0) {
    return splitParagraphs(normalized).map((paragraph) => ({
      title: null,
      content: paragraph,
    }));
  }
  return sections;
}

function toTokens(text: string) {
  return text
    .split(/\s+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function splitByTokenLimit(section: Section): Section[] {
  const tokens = toTokens(section.content);
  if (tokens.length <= MAX_TOKENS_PER_CHUNK) return [section];

  const result: Section[] = [];
  let start = 0;
  while (start < tokens.length) {
    const end = Math.min(tokens.length, start + MAX_TOKENS_PER_CHUNK);
    const slice = tokens.slice(start, end).join(" ").trim();
    if (slice) {
      result.push({
        title: section.title,
        content: slice,
      });
    }
    if (end >= tokens.length) break;
    start = Math.max(0, end - OVERLAP_TOKENS);
  }
  return result;
}

function createSectionsFromItem(item: HelpKnowledgeItem): Section[] {
  const sections: Section[] = [];

  for (const section of splitContentIntoSemanticSections(item.content)) {
    sections.push(section);
  }

  if (item.steps.length > 0) {
    for (let index = 0; index < item.steps.length; index += 1) {
      const step = normalizeWhitespace(item.steps[index] || "");
      if (!step) continue;
      sections.push({
        title: `Step ${index + 1}`,
        content: step,
      });
    }
  }

  if (item.blockers.length > 0) {
    for (let index = 0; index < item.blockers.length; index += 1) {
      const blocker = normalizeWhitespace(item.blockers[index] || "");
      if (!blocker) continue;
      sections.push({
        title: `Blocker ${index + 1}`,
        content: blocker,
      });
    }
  }

  if (sections.length === 0) {
    sections.push({
      title: null,
      content: `${item.title}.`,
    });
  }

  return sections.flatMap((section) => splitByTokenLimit(section));
}

export function chunkHelpKnowledgeItem(item: HelpKnowledgeItem): SemanticHelpChunk[] {
  const sections = createSectionsFromItem(item);
  return sections.map((section, index) => ({
    id: `${item.id}-${index}`,
    itemId: item.id,
    chunkIndex: index,
    chunkTitle: section.title,
    content: section.content,
    module: item.module,
    roleScope: item.roleScope,
    keywords: item.keywords,
  }));
}

export function chunkHelpKnowledgeBase(items: HelpKnowledgeItem[]) {
  return items.flatMap((item) => chunkHelpKnowledgeItem(item));
}

export function buildEmbeddingInputFromChunk(chunk: SemanticHelpChunk) {
  if (chunk.chunkTitle) {
    return `${chunk.chunkTitle}\n${chunk.content}`.trim();
  }
  return chunk.content;
}
