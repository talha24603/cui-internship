import { HELP_KNOWLEDGE_BASE, type HelpKnowledgeItem, type HelpRole } from "@/utils/chat/helpKnowledge";
import { retrieveSemanticHelpContext } from "@/utils/chat/semanticRetrieval";

type RetrievalInput = {
  query: string;
  role: string;
  currentRoute?: string;
  topK?: number;
};

export type RetrievedHelpItem = HelpKnowledgeItem & {
  score: number;
};

export type RetrievalDecision =
  | {
      kind: "match";
      items: RetrievedHelpItem[];
    }
  | {
      kind: "ambiguous";
      items: RetrievedHelpItem[];
      normalizedQuery: string;
      queryTokens: string[];
      reason: "low_confidence" | "close_scores" | "anchor_mismatch";
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

const SYNONYM_MAP: Record<string, string[]> = {
  marks: ["mark", "grade", "score", "scoring", "points"],
  grade: ["marks", "score", "result", "status"],
  score: ["marks", "grade", "points"],
  report: ["reports", "submission", "upload", "pdf", "document"],
  upload: ["submit", "submission", "report", "file"],
  submit: ["submission", "upload", "send", "file"],
  final: ["complete", "completed", "end", "last"],
  result: ["grade", "marks", "status", "outcome"],
  evaluation: [
    "assess",
    "assessment",
    "review",
    "marks",
    "scoring",
    "finalization",
    "site",
    "faculty",
    "office",
  ],
  summary: ["overview", "details", "evaluation"],
  internship: ["intern", "placement", "training"],
  supervisor: ["faculty", "site", "mentor"],
  faculty: ["teacher", "supervisor", "instructor"],
  site: ["company", "industry", "workplace"],
  office: ["admin", "department", "coordinator"],
  complaint: ["issue", "problem", "concern", "ticket"],
  deadline: ["due", "date", "lastdate", "time"],
  late: ["deadline", "overdue", "delay", "missed", "submission"],
  overdue: ["late", "deadline", "missed", "pending"],
  recheck: ["review", "re-evaluation", "dispute", "appeal", "marks"],
  dispute: ["recheck", "appeal", "complaint", "marks", "grade"],
  appeal: ["dispute", "recheck", "complaint", "review", "marks"],
  onboarding: ["start", "firsttime", "guide", "new", "student"],
  firsttime: ["onboarding", "start", "new", "begin"],
  start: ["begin", "create", "onboarding", "internship"],
  reset: ["password", "forgot", "link", "email", "token"],
  forgot: ["reset", "password", "email", "link", "auth"],
  forget: ["forgot", "reset", "password", "email"],
  spam: ["junk", "mail", "email", "reset", "inbox"],
  junk: ["spam", "mail", "email", "inbox"],
  mail: ["email", "inbox", "reset", "link"],
  inbox: ["email", "mail", "spam", "junk"],
  rejected: ["reject", "changes", "resubmit", "status"],
  resubmit: ["submit", "retry", "rejected", "changes"],
  edit: ["update", "modify", "resubmit", "change"],
  revise: ["edit", "update", "resubmit", "changes"],
  pending: ["status", "waiting", "approval", "verification"],
  auth: ["login", "token", "session", "unauthorized"],
  login: ["signin", "auth", "session", "token"],
  unauthorized: ["401", "auth", "login", "token"],
  forbidden: ["403", "permission", "denied", "access"],
  "not found": ["404", "missing", "record"],
  appex: ["annex", "annexure", "appendix", "form"],
  appexa: ["appex", "appendix", "appendix a", "app ex a", "approval form"],
  appendix: ["appex", "appexa", "appendix a", "annex"],
  approval: ["approve", "approved", "rejected", "status", "form"],
  appexb: ["appex", "appendix", "appendix b", "app ex b", "assignment", "verification"],
  assignment: ["allocation", "supervisor", "appexb", "verification"],
  verification: ["verify", "approval", "status", "confirm", "appexb"],
  announcement: ["announcements", "publish", "pinned", "notice", "update"],
  announcements: ["announcement", "publish", "edit", "delete", "pinned"],
  company: ["organization", "registration", "request", "approval", "review"],
  registration: ["register", "company", "request", "signup", "onboarding"],
};

function normalizeQuery(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/app[\s-]*ex[\s-]*a/gi, "appexa")
    .replace(/app[\s-]*ex[\s-]*b/gi, "appexb")
    .replace(/appendix[\s-]*a/gi, "appexa")
    .replace(/appendix[\s-]*b/gi, "appexb")
    .replace(/annex[\s-]*a?/gi, "appexa");
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

const GENERIC_QUERY_TOKENS = new Set([
  "status",
  "approval",
  "approve",
  "approved",
  "report",
  "reports",
  "form",
  "process",
  "workflow",
  "details",
  "system",
  "portal",
  "help",
  "info",
  "information",
  "guide",
  "verification",
  "company",
  "evaluation",
]);

function expandQueryTokens(queryTokens: string[]) {
  const expanded = new Set<string>(queryTokens);
  for (const token of queryTokens) {
    const synonyms = SYNONYM_MAP[token];
    if (!synonyms) continue;
    for (const synonym of synonyms) {
      for (const synonymToken of tokenize(synonym)) {
        expanded.add(synonymToken);
      }
    }
  }
  return [...expanded];
}

function roleMatches(itemRoles: HelpRole[], role: string) {
  return itemRoles.includes("ALL") || itemRoles.includes(role as HelpRole);
}

function routeBoost(module: string, currentRoute?: string) {
  if (!currentRoute) return 0;
  const route = currentRoute.toLowerCase();
  return route.includes(module.toLowerCase()) ? 3 : 0;
}

type IndexedKnowledgeItem = HelpKnowledgeItem & {
  keywordTokens: string[];
  titleTokens: string[];
  allTokens: Set<string>;
};

const INDEXED_HELP_KNOWLEDGE: IndexedKnowledgeItem[] = HELP_KNOWLEDGE_BASE.map((item) => {
  const keywordTokens = tokenize(item.keywords.join(" "));
  const titleTokens = tokenize(item.title);
  const contentTokens = tokenize(item.content);
  return {
    ...item,
    keywordTokens,
    titleTokens,
    allTokens: new Set([...keywordTokens, ...titleTokens, ...contentTokens]),
  };
});

function scoreItem(
  queryTokens: string[],
  originalTokens: Set<string>,
  item: IndexedKnowledgeItem,
  currentRoute?: string,
) {
  if (queryTokens.length === 0) return 0;

  let score = 0;
  for (const queryToken of queryTokens) {
    // Expanded synonym hits get lower weight than direct query term hits.
    const directWeight = originalTokens.has(queryToken) ? 1 : 0.6;
    if (item.keywordTokens.includes(queryToken)) score += 5 * directWeight;
    else if (item.titleTokens.includes(queryToken)) score += 4 * directWeight;
    else if (item.allTokens.has(queryToken)) score += 2 * directWeight;
  }

  score += routeBoost(item.module, currentRoute);
  return score;
}

export function retrieveLexicalHelpContext(input: RetrievalInput): RetrievedHelpItem[] {
  const role = input.role.toUpperCase();
  const normalizedQuery = normalizeQuery(input.query);
  const originalQueryTokens = tokenize(normalizedQuery);
  const queryTokens = expandQueryTokens(originalQueryTokens);
  const originalTokenSet = new Set(originalQueryTokens);
  const topK = Math.max(1, Math.min(input.topK ?? 4, 8));

  const scored = INDEXED_HELP_KNOWLEDGE.filter((item) => roleMatches(item.roleScope, role))
    .map((item) => ({
      ...item,
      score: scoreItem(queryTokens, originalTokenSet, item, input.currentRoute),
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

function normalizeScores(items: RetrievedHelpItem[]) {
  if (items.length === 0) return new Map<string, number>();
  const maxScore = Math.max(...items.map((item) => item.score), 1);
  const normalized = new Map<string, number>();
  for (const item of items) {
    normalized.set(item.id, item.score / maxScore);
  }
  return normalized;
}

function hasStrongLexicalConfidence(lexical: RetrievedHelpItem[]) {
  if (lexical.length === 0) return false;
  const [top, second] = lexical;
  const topScore = top?.score ?? 0;
  const secondScore = second?.score ?? 0;
  const gap = topScore - secondScore;
  return topScore >= 9 && gap >= 2;
}

function extractAnchorTokens(queryTokens: string[]) {
  return queryTokens.filter((token) => !GENERIC_QUERY_TOKENS.has(token));
}

function hasAnchorMismatch(item: RetrievedHelpItem | undefined, anchorTokens: string[]) {
  if (!item || anchorTokens.length === 0) return false;
  const searchableTokens = tokenize(`${item.title} ${item.module} ${item.keywords.join(" ")} ${item.content}`);
  return !anchorTokens.some(
    (token) => searchableTokens.includes(token),
  );
}

function isAmbiguousResult(
  items: RetrievedHelpItem[],
  queryTokens: string[],
  normalizedQuery: string,
): RetrievalDecision | null {
  if (items.length === 0) {
    return {
      kind: "ambiguous",
      items: [],
      normalizedQuery,
      queryTokens,
      reason: "low_confidence",
    };
  }

  const [top, second] = items;
  const shortQuery = queryTokens.length <= 4;
  const anchorTokens = extractAnchorTokens(queryTokens);
  const scoreGap = (top?.score ?? 0) - (second?.score ?? 0);
  const topScore = top?.score ?? 0;

  if (shortQuery && hasAnchorMismatch(top, anchorTokens)) {
    return {
      kind: "ambiguous",
      items,
      normalizedQuery,
      queryTokens,
      reason: "anchor_mismatch",
    };
  }

  const looksLexical = topScore > 1;
  const hasLowConfidence = looksLexical ? topScore < 6 : topScore < 0.55;
  const hasCloseScores = second
    ? looksLexical
      ? scoreGap < 2
      : scoreGap < 0.08
    : false;

  if (shortQuery && hasLowConfidence) {
    return {
      kind: "ambiguous",
      items,
      normalizedQuery,
      queryTokens,
      reason: "low_confidence",
    };
  }

  if (shortQuery && hasCloseScores) {
    return {
      kind: "ambiguous",
      items,
      normalizedQuery,
      queryTokens,
      reason: "close_scores",
    };
  }

  return null;
}

export async function retrieveHelpContext(input: RetrievalInput): Promise<RetrievalDecision> {
  const topK = Math.max(1, Math.min(input.topK ?? 4, 8));
  const normalizedQuery = normalizeQuery(input.query);
  const queryTokens = tokenize(normalizedQuery);
  const lexical = retrieveLexicalHelpContext({ ...input, query: normalizedQuery, topK: Math.max(topK * 2, 6) });
  if (hasStrongLexicalConfidence(lexical)) {
    // Fast path: skip expensive semantic retrieval when lexical intent is already clear.
    const matched = lexical.slice(0, topK);
    return { kind: "match", items: matched };
  }
  const semantic = await retrieveSemanticHelpContext({
    ...input,
    query: normalizedQuery,
    topK: Math.max(topK * 2, 6),
  });

  if (semantic.length === 0) {
    const fallback = lexical.slice(0, topK);
    const ambiguous = isAmbiguousResult(fallback, queryTokens, normalizedQuery);
    return ambiguous ?? { kind: "match", items: fallback };
  }

  const lexicalNorm = normalizeScores(lexical);
  const semanticNorm = normalizeScores(semantic);
  const byId = new Map<string, RetrievedHelpItem>();

  for (const item of [...lexical, ...semantic]) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }

  const hybrid = [...byId.values()]
    .map((item) => {
      const semanticScore = semanticNorm.get(item.id) ?? 0;
      const lexicalScore = lexicalNorm.get(item.id) ?? 0;
      return {
        ...item,
        // Weighted hybrid score: semantic meaning prioritized over lexical exact matching.
        score: semanticScore * 0.7 + lexicalScore * 0.3,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  const matched = hybrid.length > 0 ? hybrid : lexical.slice(0, topK);
  const ambiguous = isAmbiguousResult(matched, queryTokens, normalizedQuery);
  return ambiguous ?? { kind: "match", items: matched };
}
