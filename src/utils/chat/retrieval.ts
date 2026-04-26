import { HELP_KNOWLEDGE_BASE, type HelpKnowledgeItem, type HelpRole } from "@/utils/chat/helpKnowledge";

type RetrievalInput = {
  query: string;
  role: string;
  currentRoute?: string;
  topK?: number;
};

export type RetrievedHelpItem = HelpKnowledgeItem & {
  score: number;
};

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "to",
  "for",
  "and",
  "or",
  "in",
  "on",
  "of",
  "me",
  "i",
  "my",
  "can",
  "you",
  "how",
  "what",
  "why",
]);

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function roleMatches(itemRoles: HelpRole[], role: string) {
  return itemRoles.includes("ALL") || itemRoles.includes(role as HelpRole);
}

function routeBoost(module: string, currentRoute?: string) {
  if (!currentRoute) return 0;
  const route = currentRoute.toLowerCase();
  return route.includes(module.toLowerCase()) ? 3 : 0;
}

function scoreItem(queryTokens: string[], item: HelpKnowledgeItem, currentRoute?: string) {
  if (queryTokens.length === 0) return 0;

  const keywordTokens = tokenize(item.keywords.join(" "));
  const titleTokens = tokenize(item.title);
  const contentTokens = tokenize(item.content);
  const allTokens = new Set([...keywordTokens, ...titleTokens, ...contentTokens]);

  let score = 0;
  for (const queryToken of queryTokens) {
    if (keywordTokens.includes(queryToken)) score += 5;
    else if (titleTokens.includes(queryToken)) score += 4;
    else if (allTokens.has(queryToken)) score += 2;
  }

  score += routeBoost(item.module, currentRoute);
  return score;
}

export function retrieveHelpContext(input: RetrievalInput): RetrievedHelpItem[] {
  const role = input.role.toUpperCase();
  const queryTokens = tokenize(input.query);
  const topK = Math.max(1, Math.min(input.topK ?? 4, 8));

  const scored = HELP_KNOWLEDGE_BASE.filter((item) => roleMatches(item.roleScope, role))
    .map((item) => ({
      ...item,
      score: scoreItem(queryTokens, item, input.currentRoute),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (scored.length > 0) return scored;

  // Fallback: return generic support docs when query has weak lexical match.
  return HELP_KNOWLEDGE_BASE.filter(
    (item) => roleMatches(item.roleScope, role) && (item.module === "auth" || item.roleScope.includes("ALL")),
  )
    .map((item) => ({ ...item, score: 1 }))
    .slice(0, topK);
}
