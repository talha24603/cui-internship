export type HelpRole = "STUDENT" | "FACULTY" | "ADMIN" | "SITE_SUPERVISOR" | "ALL";

export type HelpKnowledgeItem = {
  id: string;
  title: string;
  roleScope: HelpRole[];
  module: string;
  keywords: string[];
  content: string;
  steps: string[];
  blockers: string[];
};

export const HELP_KNOWLEDGE_BASE: HelpKnowledgeItem[] = [
  {
    id: "student-submit-final-report",
    title: "Submit final internship report",
    roleScope: ["STUDENT"],
    module: "internship-report",
    keywords: ["report", "final", "pdf", "upload", "submit", "summary"],
    content:
      "Students can submit one final report PDF for an internship. If a final report exists, submitting again updates it.",
    steps: [
      "Open the student dashboard and go to the final report submission area.",
      "Select your internship and choose a PDF file.",
      "Optionally add a short summary to improve AI evaluation context.",
      "Submit and wait for confirmation that report submission succeeded.",
    ],
    blockers: [
      "Only PDF files are accepted.",
      "internshipId is required and must belong to the logged in student.",
      "If text extraction fails and no summary is provided, the request is rejected.",
    ],
  },
  {
    id: "student-view-final-result",
    title: "View final internship result",
    roleScope: ["STUDENT"],
    module: "final-result",
    keywords: ["final result", "marks", "grade", "status", "total"],
    content:
      "Students can view internship final result details including total marks and status once available.",
    steps: [
      "Open Student Dashboard and navigate to Final Result.",
      "Check internship status, faculty/site information, grade or status, and total marks.",
      "If values show Pending, wait for faculty and office updates.",
    ],
    blockers: [
      "Result remains pending until evaluations are available and finalized.",
      "Authentication is required to access student final result APIs.",
    ],
  },
  {
    id: "faculty-evaluation-summary",
    title: "Faculty submits evaluation summary marks",
    roleScope: ["FACULTY", "ADMIN"],
    module: "evaluation-summary",
    keywords: ["faculty", "evaluation", "summary", "marks", "40", "internshipId"],
    content:
      "Faculty can submit or update their evaluation marks for assigned internships. Admin can also access.",
    steps: [
      "Provide internshipId and faculty marks.",
      "Ensure marks are an integer between 0 and 40.",
      "Submit the form and verify total marks and pass/fail status.",
    ],
    blockers: [
      "Only FACULTY and ADMIN are allowed to add evaluation summary marks.",
      "Faculty must be assigned to that internship unless user is ADMIN.",
      "Invalid marks format or out-of-range values are rejected.",
    ],
  },
  {
    id: "evaluation-summary-access",
    title: "Who can view evaluation summary",
    roleScope: ["ALL"],
    module: "evaluation-summary",
    keywords: ["who can view", "evaluation summary", "permissions", "403", "access"],
    content:
      "Evaluation summary viewing is role and assignment based. Access depends on relation to the internship.",
    steps: [
      "Provide internshipId when requesting evaluation summary.",
      "Access is allowed for admin, internship student, assigned faculty, or assigned site supervisor.",
      "If unauthorized, request access through relevant coordinator or admin.",
    ],
    blockers: [
      "Users not related to internship get forbidden response.",
      "Missing user headers or token returns unauthorized response.",
    ],
  },
  {
    id: "site-supervisor-restriction-report",
    title: "Site supervisor report restriction",
    roleScope: ["SITE_SUPERVISOR"],
    module: "internship-report",
    keywords: ["site supervisor", "internship report", "cannot access", "403"],
    content:
      "Site supervisors are blocked from accessing student final internship report endpoint.",
    steps: [
      "Use evaluation-related endpoints and assigned dashboards for site supervisor actions.",
      "For report review workflows, coordinate through faculty or admin pathways.",
    ],
    blockers: [
      "The report route explicitly denies SITE_SUPERVISOR role.",
    ],
  },
  {
    id: "auth-troubleshooting",
    title: "Authentication troubleshooting",
    roleScope: ["ALL"],
    module: "auth",
    keywords: ["401", "token", "authorization", "login", "session", "expired"],
    content:
      "Most API errors come from missing/expired bearer tokens or role mismatch with protected routes.",
    steps: [
      "Log in again if session expired.",
      "Ensure API call includes Authorization Bearer token.",
      "Use the correct dashboard and endpoint for your role.",
      "Retry after token refresh if your client supports refresh flow.",
    ],
    blockers: [
      "Missing bearer token causes unauthorized response for protected APIs.",
      "Invalid or expired token causes unauthorized response.",
      "Correct token but wrong role causes forbidden response.",
    ],
  },
];
