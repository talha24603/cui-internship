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
    id: "student-view-internships",
    title: "Student views internship records",
    roleScope: ["STUDENT"],
    module: "internships",
    keywords: ["internships", "my internship", "list", "approved", "status"],
    content:
      "Students can view their internships and track approval/completion status from the student internship area.",
    steps: [
      "Open Student Dashboard and navigate to internships.",
      "Review current internship status such as pending, approved, completed, or rejected.",
      "Open the internship detail to access related reports, logs, and evaluation features.",
    ],
    blockers: [
      "If no internships appear, the student may not have created one yet.",
      "Unauthorized requests fail when access token is missing or expired.",
    ],
  },
  {
    id: "student-create-internship",
    title: "Student creates internship entry",
    roleScope: ["STUDENT"],
    module: "create-internship",
    keywords: [
      "create internship",
      "new internship",
      "submit internship",
      "student form",
      "start internship",
      "how to start internship",
      "how to create internship",
      "internship starting steps",
    ],
    content:
      "Students create internship records before submitting forms, logs, or final reports tied to that internship.",
    steps: [
      "Go to the create internship page in the student section.",
      "Fill required organization and internship details accurately.",
      "Submit the form and verify the new internship appears in your internship list.",
    ],
    blockers: [
      "Missing required fields will cause validation errors.",
      "Creating duplicate or conflicting internship data may be rejected by business rules.",
    ],
  },
  {
    id: "student-submit-weekly-logs",
    title: "Student submits weekly logs",
    roleScope: ["STUDENT"],
    module: "weekly-logs",
    keywords: ["weekly", "logs", "activities", "skills learned", "week no"],
    content:
      "Students submit weekly progress logs with activities, skills learned, and challenges for each internship week.",
    steps: [
      "Open weekly logs in the student dashboard.",
      "Select internship and provide week number, activities, skills learned, and challenges.",
      "Submit and confirm the log appears in your weekly log history.",
    ],
    blockers: [
      "Missing internshipId or week data can cause request validation failure.",
      "Duplicate week entries may be blocked depending on backend rules.",
    ],
  },
  {
    id: "weekly-logs-lifecycle-and-status",
    title: "How weekly logs work end-to-end",
    roleScope: ["STUDENT", "FACULTY", "ADMIN"],
    module: "weekly-logs-lifecycle",
    keywords: [
      "how weekly logs work",
      "weekly log status",
      "pending weeks",
      "week number validation",
      "approved internship weekly logs",
      "weekly logs lifecycle",
    ],
    content:
      "Weekly logs are tied to an approved or completed internship, validated against internship dates, and tracked with submitted and pending week status.",
    steps: [
      "Student opens weekly logs after internship start and submits one log per valid week with activities, skills learned, and challenges.",
      "System validates internship approval, start/end dates, current timing, valid week range, and prevents duplicate logs for the same week.",
      "Faculty/admin can review logs in week order while student can see submitted weeks, pending weeks, and current progress status.",
    ],
    blockers: [
      "Students without an approved/completed internship cannot submit logs.",
      "Internship dates must be set and internship must have started before log submission is allowed.",
      "Invalid week number or duplicate week submission returns an error.",
    ],
  },
  {
    id: "student-appex-a-flow",
    title: "Student AppEx-A submission flow",
    roleScope: ["STUDENT"],
    module: "appex-a",
    keywords: [
      "appex a",
      "appexa",
      "app ex a",
      "appendix a",
      "approval form",
      "organization details",
      "internship approval",
    ],
    content:
      "AppEx-A captures internship approval details and is typically required before full internship progression.",
    steps: [
      "Navigate to the AppEx-A form in the student area.",
      "Fill organization, contact, internship mode, and date fields correctly.",
      "Submit and track status updates for approval or rejection.",
    ],
    blockers: [
      "Incorrect dates or missing organization info can invalidate submission.",
      "Status may remain pending until reviewed by authorized faculty/admin.",
    ],
  },
  {
    id: "student-appex-b-flow",
    title: "Student AppEx-B submission flow",
    roleScope: ["STUDENT"],
    module: "appex-b",
    keywords: [
      "appex b",
      "appexb",
      "app ex b",
      "appendix b",
      "internship assignment",
      "submit appex b",
      "working of appexb",
      "how appexb works",
      "appexb working",
    ],
    content:
      "AppEx-B stores internship assignment details and can be created or updated by the student using an upsert flow.",
    steps: [
      "Open student AppEx-B and fill required fields including profile/contact information and agreement acceptance.",
      "Optionally include facultyId and siteId; both are role-validated before save.",
      "Submit AppEx-B and use verification module to track faculty/student confirmation state.",
    ],
    blockers: [
      "Only STUDENT role can submit AppEx-B.",
      "Invalid email format, non-boolean agreementAccepted, or missing required fields trigger validation errors.",
      "facultyId must point to FACULTY and siteId must point to SITE_SUPERVISOR when provided.",
    ],
  },
  {
    id: "student-complaints",
    title: "Student complaint submission and tracking",
    roleScope: ["STUDENT"],
    module: "complaints",
    keywords: ["complaint", "issue", "report issue", "status open", "resolved"],
    content:
      "Students can submit complaints by category and monitor complaint status changes such as open or resolved.",
    steps: [
      "Open student complaints section.",
      "Create complaint with clear subject, body, and category.",
      "Track updates from reviewers and check resolution notes if provided.",
    ],
    blockers: [
      "Very short or unclear complaint text can reduce response quality.",
      "Users can only access complaints they are permitted to view.",
    ],
  },
  {
    id: "student-company-request",
    title: "Student requests adding a company",
    roleScope: ["STUDENT"],
    module: "company-request",
    keywords: ["add company", "company request", "pending company", "approval company"],
    content:
      "Students can request new companies if a desired internship company is missing from the system.",
    steps: [
      "Go to request-to-add-company in student section.",
      "Provide company name, contact, and reason for request.",
      "Submit and track request status in company request status page.",
    ],
    blockers: [
      "Requests with incomplete company info may be rejected.",
      "Status remains pending until admin review completes.",
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
    id: "final-report-submission-and-ai-review",
    title: "How final report submission and AI review work",
    roleScope: ["STUDENT", "FACULTY", "ADMIN"],
    module: "final-report-lifecycle",
    keywords: [
      "how final report works",
      "final report upload",
      "pdf report submission",
      "ai report review",
      "cloudinary report",
      "final report lifecycle",
    ],
    content:
      "Final report flow uploads a student PDF report, stores or updates the latest final report, and can trigger AI review using extracted report text or provided summary.",
    steps: [
      "Student submits multipart form data with internshipId, PDF file, and optional summary from the final report module.",
      "System validates student ownership, checks PDF format, uploads the file, and updates the latest final report record if one already exists.",
      "After upload, text extraction and AI assessment can run to store suggested marks and summary for faculty/admin review support.",
    ],
    blockers: [
      "Only students can submit final reports and site supervisors are blocked from report access.",
      "Cloudinary configuration must exist and internshipId must belong to the logged-in student.",
      "If PDF text extraction fails and no summary is provided, submission is rejected for AI processing readiness.",
    ],
  },
  {
    id: "faculty-view-internships",
    title: "Faculty views assigned internships",
    roleScope: ["FACULTY", "ADMIN"],
    module: "faculty-internships",
    keywords: ["faculty internships", "assigned students", "internship list", "supervisor"],
    content:
      "Faculty can access internships assigned to them and use this area to review logs, forms, and evaluations.",
    steps: [
      "Open faculty dashboard and navigate to internships.",
      "Select a student internship you supervise.",
      "Use related tabs for logs, forms, and evaluation actions.",
    ],
    blockers: [
      "Faculty not assigned to an internship cannot perform restricted actions for that record.",
      "Role mismatch or invalid token returns access errors.",
    ],
  },
  {
    id: "faculty-review-weekly-logs",
    title: "Faculty reviews student weekly logs",
    roleScope: ["FACULTY", "ADMIN"],
    module: "faculty-weekly-logs",
    keywords: ["review weekly logs", "faculty logs", "student progress", "weekly feedback"],
    content:
      "Faculty can review weekly logs submitted by supervised students to monitor internship progress and issues.",
    steps: [
      "Go to faculty weekly logs section.",
      "Filter by internship or student.",
      "Review activities, skills, and challenges week by week.",
    ],
    blockers: [
      "Faculty cannot view logs for internships outside their assignment unless admin.",
      "Missing internship linkage can prevent log visibility.",
    ],
  },
  {
    id: "faculty-appex-a-approval",
    title: "Faculty approves AppEx-A",
    roleScope: ["FACULTY", "ADMIN"],
    module: "appex-a-approval",
    keywords: [
      "approve appex a",
      "reject appex a",
      "appexa approval",
      "appendix a approval",
      "faculty approval",
    ],
    content:
      "Faculty reviews AppEx-A requests and can approve or reject based on submitted internship details.",
    steps: [
      "Open faculty AppEx-A approval section.",
      "Inspect student and internship details carefully.",
      "Submit approve/reject decision with clear comments when applicable.",
    ],
    blockers: [
      "Only authorized faculty/admin can finalize approval decisions.",
      "Incomplete student submission data may delay decision.",
    ],
  },
  {
    id: "appex-b-verification-workflow",
    title: "How AppEx-B verification works",
    roleScope: ["STUDENT", "FACULTY", "ADMIN"],
    module: "appex-b-verification",
    keywords: [
      "appex b verification",
      "verify appex b",
      "approve appex b",
      "request changes appex b",
      "both verified",
      "pending verification",
      "working of appexb",
      "how appexb works",
      "appexb process",
    ],
    content:
      "AppEx-B verification is dual-sided: faculty and student can approve or request changes, and system status is computed from both verification flags.",
    steps: [
      "Faculty or student submits action as approve/request_changes on their respective AppEx-B verification endpoint.",
      "System updates verification fields and recomputes status (PENDING_VERIFICATION, FACULTY_VERIFIED, STUDENT_VERIFIED, BOTH_VERIFIED, or CHANGES_REQUESTED).",
      "When BOTH_VERIFIED is reached, internship linkage and supervisor/date propagation can be applied from AppEx-B fields.",
    ],
    blockers: [
      "Faculty can verify only assignments mapped to their facultyId.",
      "Missing assignment/action input causes request validation failure.",
      "If assignment is missing, verification routes return not found.",
    ],
  },
  {
    id: "forgot-password-and-reset-flow",
    title: "Forgot password and reset password flow",
    roleScope: ["ALL"],
    module: "auth",
    keywords: [
      "forgot password",
      "forget password",
      "reset password",
      "password reset link",
      "cannot login password",
      "how to reset password",
    ],
    content:
      "Users can request a password reset link from the forgot-password page, then set a new password using the reset token URL.",
    steps: [
      "Open Forgot Password and submit your account email.",
      "Check email for reset link and open the reset-password page with token parameter.",
      "Enter new password (minimum 6 characters) and submit to complete reset.",
    ],
    blockers: [
      "Missing or expired token causes reset-password request to fail as invalid/expired token.",
      "If email is not registered, system still returns generic success response for security.",
      "Weak password below minimum length is rejected by validation.",
    ],
  },
  {
    id: "faculty-finalization",
    title: "Faculty finalization of internship result",
    roleScope: ["FACULTY", "ADMIN"],
    module: "finalization",
    keywords: ["finalize", "final result", "faculty finalization", "complete evaluation"],
    content:
      "Finalization allows faculty to lock final internship result after required marks are available.",
    steps: [
      "Open faculty finalization page for a selected internship.",
      "Verify faculty, site, and office marks are correct.",
      "Finalize only when grading data is complete and validated.",
    ],
    blockers: [
      "Finalization may fail if required marks are missing.",
      "Unauthorized faculty cannot finalize internships not assigned to them.",
    ],
  },
  {
    id: "site-evaluations",
    title: "Site supervisor submits evaluations",
    roleScope: ["SITE_SUPERVISOR", "ADMIN"],
    module: "site-evaluations",
    keywords: ["site evaluation", "mid evaluation", "final evaluation", "site supervisor marks"],
    content:
      "Site supervisors provide performance evaluations for interns through the site evaluations module.",
    steps: [
      "Open site dashboard and go to evaluations.",
      "Select the internship and evaluation type (mid/final as available).",
      "Enter marks and comments, then submit.",
    ],
    blockers: [
      "Site supervisor must be assigned to the internship.",
      "Out-of-range marks or missing fields cause validation errors.",
    ],
  },
  {
    id: "site-view-internships",
    title: "Site supervisor views assigned interns",
    roleScope: ["SITE_SUPERVISOR", "ADMIN"],
    module: "site-internships",
    keywords: ["site internships", "assigned interns", "company intern list"],
    content:
      "Site supervisors can view only internships assigned to them for evaluation and coordination.",
    steps: [
      "Open site internships section.",
      "Review assigned students and internship details.",
      "Proceed to evaluations or coordination tasks from selected internship.",
    ],
    blockers: [
      "Unassigned internships will not be accessible to site supervisors.",
      "Token/role issues can block dashboard API calls.",
    ],
  },
  {
    id: "admin-assign-supervisor",
    title: "Admin assigns faculty and site supervisors",
    roleScope: ["ADMIN"],
    module: "assign-supervisor",
    keywords: ["assign supervisor", "assign faculty", "assign site", "admin assignment"],
    content:
      "Admins assign faculty and site supervisors so students can proceed through supervised workflows.",
    steps: [
      "Open admin supervisor assignment module.",
      "Select internship/student and choose faculty plus site supervisor.",
      "Save assignment and verify it reflects in faculty/site dashboards.",
    ],
    blockers: [
      "Invalid user-role combinations can fail assignment.",
      "Assignments may require existing internship records in valid state.",
    ],
  },
  {
    id: "admin-office-evaluation",
    title: "Admin office evaluation marks",
    roleScope: ["ADMIN"],
    module: "office-evaluation",
    keywords: ["office marks", "admin evaluation", "final marks office", "20 marks"],
    content:
      "Admin/office can submit office evaluation marks that contribute to internship final result totals.",
    steps: [
      "Open office evaluation section in admin dashboard.",
      "Provide internshipId and office marks in valid range.",
      "Submit and verify final result total updates accordingly.",
    ],
    blockers: [
      "Invalid marks or missing internshipId causes rejection.",
      "Totals may remain incomplete until faculty/site components are available.",
    ],
  },
  {
    id: "evaluation-end-to-end-workflow",
    title: "How internship evaluation happens end-to-end",
    roleScope: ["STUDENT", "FACULTY", "SITE_SUPERVISOR", "ADMIN"],
    module: "evaluation-workflow",
    keywords: [
      "evaluation workflow",
      "how evaluation happens",
      "faculty marks",
      "site final",
      "office evaluation",
      "final result calculation",
      "finalization",
    ],
    content:
      "Internship evaluation combines faculty marks, site supervisor marks, and office marks into a total, then faculty can finalize the final result.",
    steps: [
      "Site supervisor submits site evaluations (site_mid/site_final) for assigned approved internships.",
      "Faculty submits evaluation summary marks and system computes total/pass-fail using available site and office marks.",
      "Admin submits office evaluation and faculty can finalize result when marks are complete and validated.",
    ],
    blockers: [
      "Role/assignment checks block users not mapped to the internship.",
      "Marks outside allowed ranges or invalid criteria format are rejected.",
      "Evaluation/finalization may be blocked when internship status is not eligible.",
    ],
  },
  {
    id: "admin-manage-announcements",
    title: "Admin manages public announcements",
    roleScope: ["ADMIN"],
    module: "announcements",
    keywords: ["announcement", "public update", "pin announcement", "home page"],
    content:
      "Admins can create, update, and pin announcements displayed on the public home page.",
    steps: [
      "Open admin announcements section.",
      "Create or update title, message, and optional link.",
      "Pin important announcements to prioritize visibility.",
    ],
    blockers: [
      "Invalid links or missing message content can fail validation.",
      "Announcement ordering depends on pinned state and creation time.",
    ],
  },
  {
    id: "announcements-lifecycle-and-permissions",
    title: "Announcements lifecycle and permissions",
    roleScope: ["ADMIN", "FACULTY", "STUDENT", "SITE_SUPERVISOR", "ALL"],
    module: "announcements-lifecycle",
    keywords: [
      "announcements",
      "publish announcement",
      "edit announcement",
      "delete announcement",
      "pinned announcements",
      "announcement permissions",
    ],
    content:
      "Announcements are managed by admin and listed with pinned items first; non-admin roles can read but cannot create/update/delete.",
    steps: [
      "Admin publishes announcement with required message and optional title/link/pinned fields.",
      "Admin can update existing announcement fields and validate URL when link is provided.",
      "Admin can delete announcements, while users fetch announcements ordered by pinned then newest first.",
    ],
    blockers: [
      "Only ADMIN can publish, edit, or delete announcements.",
      "Missing message or invalid URL input fails validation.",
      "Editing/deleting with invalid announcement id returns not found.",
    ],
  },
  {
    id: "admin-manage-complaints",
    title: "Admin handles complaints lifecycle",
    roleScope: ["ADMIN", "FACULTY"],
    module: "complaints",
    keywords: ["complaints admin", "resolve complaint", "in review", "dismiss"],
    content:
      "Authorized reviewers can update complaint statuses and add resolution notes for submitted issues.",
    steps: [
      "Open complaints module for your role.",
      "Filter complaints by status or category.",
      "Update status and add clear resolution comments.",
    ],
    blockers: [
      "Only authorized roles can handle complaint workflow updates.",
      "Missing resolution context reduces transparency for students.",
    ],
  },
  {
    id: "dashboard-routing-by-role",
    title: "Correct dashboard route by role",
    roleScope: ["ALL"],
    module: "dashboard",
    keywords: ["dashboard", "role route", "student dashboard", "faculty dashboard", "site dashboard", "admin dashboard"],
    content:
      "Users are routed to role-based dashboards. Using a wrong role route can trigger access or data errors.",
    steps: [
      "Confirm your account role after login.",
      "Use the dashboard assigned to your role.",
      "If redirected unexpectedly, logout and login again to refresh session state.",
    ],
    blockers: [
      "Wrong role route often leads to authorization failures.",
      "Stale client session can cause incorrect routing behavior.",
    ],
  },
  {
    id: "forbidden-403-troubleshooting",
    title: "How to troubleshoot 403 forbidden errors",
    roleScope: ["ALL"],
    module: "auth",
    keywords: ["403", "forbidden", "not allowed", "permission denied", "access denied"],
    content:
      "403 errors usually mean the user is authenticated but not authorized for requested internship or role-specific action.",
    steps: [
      "Check if your role is allowed for the target endpoint.",
      "Confirm internship assignment (student/faculty/site relation) where required.",
      "Retry from correct dashboard module and verify selected internshipId.",
    ],
    blockers: [
      "Role not in allowed role list causes forbidden response.",
      "Faculty/site users accessing non-assigned internships are rejected.",
    ],
  },
  {
    id: "bad-request-400-troubleshooting",
    title: "How to troubleshoot 400 validation errors",
    roleScope: ["ALL"],
    module: "validation",
    keywords: ["400", "bad request", "validation", "required field", "invalid input"],
    content:
      "400 responses indicate request data format or required fields are invalid or missing.",
    steps: [
      "Read the error message returned by API carefully.",
      "Verify required fields and value ranges in the form.",
      "Resubmit with corrected payload format and data types.",
    ],
    blockers: [
      "Missing internshipId is a common reason for failures.",
      "Non-integer or out-of-range marks are rejected in evaluation routes.",
    ],
  },
  {
    id: "not-found-404-troubleshooting",
    title: "How to troubleshoot 404 not found errors",
    roleScope: ["ALL"],
    module: "records",
    keywords: ["404", "not found", "internship not found", "missing record"],
    content:
      "404 usually means the target resource does not exist for provided id or is not available in current context.",
    steps: [
      "Recheck internshipId or complaintId copied from UI.",
      "Ensure record exists and belongs to expected user scope.",
      "If recently created, refresh list and try again.",
    ],
    blockers: [
      "Wrong ID values or stale UI links can point to missing records.",
      "Cross-user access attempts often appear as not found in restricted flows.",
    ],
  },
  {
    id: "ai-report-assessment-explained",
    title: "How AI report assessment works",
    roleScope: ["STUDENT", "FACULTY", "ADMIN"],
    module: "ai-assessment",
    keywords: ["ai assessment", "ai report review", "suggested marks", "confidence"],
    content:
      "Final report submission can trigger AI report assessment with suggested marks and confidence, stored for review support.",
    steps: [
      "Submit final report with valid PDF and optional summary.",
      "System extracts text and runs AI assessment when available.",
      "AI result is advisory and should be reviewed by faculty/admin workflows.",
    ],
    blockers: [
      "AI assessment may not generate if model key is missing or AI call fails.",
      "Insufficient report text can lower confidence in suggested marks.",
    ],
  },
  {
    id: "appex-a-end-to-end-lifecycle",
    title: "AppEx-A end-to-end lifecycle across roles",
    roleScope: ["STUDENT", "FACULTY", "ADMIN"],
    module: "appex-a-lifecycle",
    keywords: [
      "appex a flow",
      "appexa lifecycle",
      "how appex a works",
      "appendix a process",
      "student faculty admin appex",
    ],
    content:
      "AppEx-A starts with student submission, then faculty/admin review, and admin approval can propagate dates/status into internship records.",
    steps: [
      "Student creates AppEx-A via student AppEx-A form and status starts as pending.",
      "Faculty/Admin review pending AppEx-A and submit approved/rejected decision.",
      "When admin approves, internship dates and approval linkage can be updated from AppEx-A data.",
    ],
    blockers: [
      "Missing required fields or invalid date order rejects student submission.",
      "Already processed submissions cannot be re-processed in strict approval flows.",
      "Role mismatch blocks access to AppEx-A review endpoints.",
    ],
  },
  {
    id: "chatbot-context-and-sources",
    title: "How chatbot context and sources are selected",
    roleScope: ["ALL"],
    module: "chatbot-system",
    keywords: [
      "chatbot sources",
      "how chatbot answers",
      "chatbot context",
      "retrieval flow",
      "confidence meaning",
      "why wrong answer",
    ],
    content:
      "Chatbot replies are generated from retrieved knowledge items filtered by role, route, lexical+semantic ranking, and short conversation summary.",
    steps: [
      "User message is scored against knowledge entries using keyword/title/content matching and synonym expansion.",
      "Semantic retrieval may run for meaning-based ranking, then a hybrid score picks top context items.",
      "Final reply is produced in a fixed markdown structure with listed source modules and confidence.",
    ],
    blockers: [
      "Weak or ambiguous query tokens can pull neighboring modules with similar wording.",
      "Missing or outdated knowledge entries reduce answer specificity.",
      "Model/key outages can force deterministic fallback responses with limited detail.",
    ],
  },
  {
    id: "chatbot-performance-and-accuracy-tips",
    title: "Improve chatbot performance and answer quality",
    roleScope: ["ADMIN", "FACULTY", "STUDENT", "ALL"],
    module: "chatbot-ops",
    keywords: [
      "chatbot performance",
      "improve chatbot",
      "faster chatbot response",
      "more accurate answer",
      "better prompt",
      "knowledge base update",
    ],
    content:
      "Best results come from strong intent wording, enriched knowledge keywords, and retrieval rules that avoid expensive semantic calls for obvious matches.",
    steps: [
      "Use explicit module names in queries (for example: AppEx-A, evaluation summary, office marks).",
      "Expand keywords/aliases for common misspellings and route-specific terminology.",
      "Prefer lexical fast-path for high-confidence matches and run semantic retrieval mainly for ambiguous requests.",
    ],
    blockers: [
      "General one-line questions without module names can reduce ranking quality.",
      "Overlapping modules with similar terms require stronger disambiguation rules.",
      "Too few domain items in knowledge base limits evidence available to the generator.",
    ],
  },
  {
    id: "admin-appex-b-review-and-approval",
    title: "Admin review and approval for AppEx-B",
    roleScope: ["ADMIN"],
    module: "admin-appex-b",
    keywords: [
      "admin appex b",
      "appex b admin approval",
      "adminApprovalStatus",
      "approve reject appex b",
      "reset verification appex b",
    ],
    content:
      "Admin can list or fetch AppEx-B records, update extended assignment details, and set admin approval state to approved/rejected/pending.",
    steps: [
      "Open admin AppEx-B module and fetch all submissions or a specific record by id.",
      "Update assignment details such as company role, supervisors, duration, dates, and optional faculty/site IDs.",
      "Use adminApprovalAction (approve/reject/reset) to control adminApprovalStatus and track approval progression.",
    ],
    blockers: [
      "Only ADMIN role can access admin AppEx-B management routes.",
      "Invalid faculty/site role mapping is rejected by server validation.",
      "Significant detail updates can reset verification fields back to pending verification.",
    ],
  },
  {
    id: "company-registration-request-and-review",
    title: "Company registration request and admin review flow",
    roleScope: ["STUDENT", "ADMIN"],
    module: "company-registration",
    keywords: [
      "company registration",
      "request to add company",
      "company request status",
      "approve company request",
      "reject company request",
      "review company",
    ],
    content:
      "Students request new companies when missing from the system, and admin reviews requests to approve/reject; approved requests create company records.",
    steps: [
      "Student submits request-to-add-company with required company name/email and optional business details.",
      "System prevents duplicate existing company emails and duplicate pending requests for the same company email.",
      "Admin reviews pending requests and approves/rejects; approval updates request status and can create the company entity.",
    ],
    blockers: [
      "Only STUDENT can submit company requests and only ADMIN can review them.",
      "Invalid email format or missing required fields causes validation errors.",
      "Already reviewed requests cannot be re-reviewed as pending.",
    ],
  },
  {
    id: "session-refresh-guidance",
    title: "Session refresh and re-login guidance",
    roleScope: ["ALL"],
    module: "auth",
    keywords: ["refresh token", "session expired", "login again", "unauthorized"],
    content:
      "Client API calls can attempt refresh token flow on unauthorized response, but users may still need to re-login.",
    steps: [
      "If request fails with unauthorized, retry once to allow refresh flow.",
      "If still failing, logout and login again.",
      "Verify browser is allowing secure cookies used by refresh token.",
    ],
    blockers: [
      "Revoked or expired refresh tokens cannot restore session.",
      "Cross-site cookie restrictions can break refresh in some environments.",
    ],
  },
  {
    id: "student-faq-where-submit-final-report",
    title: "FAQ Student: Where do I submit my final report?",
    roleScope: ["STUDENT"],
    module: "faq-student",
    keywords: ["where submit final report", "final report page", "upload report location", "student faq"],
    content:
      "Students submit final reports from the student report submission flow tied to internship-report routes.",
    steps: [
      "Open Student Dashboard.",
      "Go to the report submission area for your internship.",
      "Upload PDF and submit with optional summary.",
    ],
    blockers: [
      "Only PDF format is accepted.",
      "You must provide valid internshipId linked to your account.",
    ],
  },
  {
    id: "student-faq-why-final-result-pending",
    title: "FAQ Student: Why is my final result still pending?",
    roleScope: ["STUDENT"],
    module: "faq-student",
    keywords: ["result pending", "final result not showing", "marks pending", "grade pending"],
    content:
      "Final result can stay pending until evaluation components are submitted and finalized by authorized roles.",
    steps: [
      "Check if faculty and site evaluations are completed.",
      "Verify office marks/finalization status if applicable.",
      "Wait for finalization and refresh the final-result page.",
    ],
    blockers: [
      "Missing evaluation components keep totals incomplete.",
      "Pending workflows upstream can delay final marks publication.",
    ],
  },
  {
    id: "student-faq-how-file-complaint",
    title: "FAQ Student: How can I file a complaint?",
    roleScope: ["STUDENT"],
    module: "faq-student",
    keywords: ["file complaint", "submit issue", "student complaint steps", "where complaint"],
    content:
      "Students can submit categorized complaints and monitor status updates in the complaints module.",
    steps: [
      "Open student complaints section.",
      "Create complaint with subject, category, and detailed description.",
      "Track status and resolution notes in complaint history.",
    ],
    blockers: [
      "Missing clear description can slow down resolution.",
      "Only authorized users can view specific complaint records.",
    ],
  },
  {
    id: "faculty-faq-how-add-marks",
    title: "FAQ Faculty: How do I add evaluation marks?",
    roleScope: ["FACULTY", "ADMIN"],
    module: "faq-faculty",
    keywords: ["add marks", "faculty marks", "submit evaluation summary", "where add faculty marks"],
    content:
      "Faculty adds evaluation summary marks through the faculty evaluation summary endpoint and UI.",
    steps: [
      "Open faculty evaluation summary module.",
      "Provide internshipId and integer marks between 0 and 40.",
      "Submit and review updated total/status.",
    ],
    blockers: [
      "Invalid marks range or non-integer value is rejected.",
      "Faculty must be assigned to internship unless user is admin.",
    ],
  },
  {
    id: "faculty-faq-why-403-on-internship",
    title: "FAQ Faculty: Why am I getting 403 for an internship?",
    roleScope: ["FACULTY"],
    module: "faq-faculty",
    keywords: ["faculty 403", "not assigned internship", "forbidden faculty", "permission denied faculty"],
    content:
      "A 403 for faculty commonly means the internship is not assigned to that faculty account for restricted operations.",
    steps: [
      "Confirm internship is assigned to your faculty ID.",
      "Ensure you are using faculty dashboard route and correct internshipId.",
      "Ask admin to verify assignment if mismatch persists.",
    ],
    blockers: [
      "Unassigned internships are blocked for faculty actions.",
      "Wrong role token/session can produce forbidden responses.",
    ],
  },
  {
    id: "faculty-faq-when-finalize-result",
    title: "FAQ Faculty: When should I finalize result?",
    roleScope: ["FACULTY", "ADMIN"],
    module: "faq-faculty",
    keywords: ["when finalize", "finalization timing", "lock final result", "faculty finalize"],
    content:
      "Faculty should finalize results only after validating all required marks and internship evaluation components.",
    steps: [
      "Verify faculty, site, and office marks are present as needed.",
      "Check total and pass/fail status consistency.",
      "Finalize only after confirming no pending mark updates remain.",
    ],
    blockers: [
      "Finalization may fail with incomplete marks.",
      "Unauthorized faculty cannot finalize non-assigned internships.",
    ],
  },
  {
    id: "site-faq-how-submit-evaluation",
    title: "FAQ Site Supervisor: How do I submit evaluations?",
    roleScope: ["SITE_SUPERVISOR", "ADMIN"],
    module: "faq-site",
    keywords: ["site submit evaluation", "site marks", "mid final evaluation", "site supervisor faq"],
    content:
      "Site supervisors submit internship evaluations from the site evaluation area for assigned students.",
    steps: [
      "Open site dashboard evaluations module.",
      "Select assigned internship and evaluation type.",
      "Enter marks/comments and submit.",
    ],
    blockers: [
      "Supervisor must be assigned to internship.",
      "Missing required fields or out-of-range marks causes validation error.",
    ],
  },
  {
    id: "site-faq-why-cannot-open-report",
    title: "FAQ Site Supervisor: Why can’t I access final report endpoint?",
    roleScope: ["SITE_SUPERVISOR"],
    module: "faq-site",
    keywords: ["site cannot access report", "report endpoint denied", "site supervisor report 403"],
    content:
      "Site supervisors are intentionally restricted from the student final report route by role policy.",
    steps: [
      "Use site evaluation and assigned internship modules instead.",
      "Coordinate with faculty/admin for workflows requiring report-level decisions.",
    ],
    blockers: [
      "Role restriction is enforced at API level for internship-report access.",
    ],
  },
  {
    id: "admin-faq-how-assign-supervisors",
    title: "FAQ Admin: How do I assign supervisors?",
    roleScope: ["ADMIN"],
    module: "faq-admin",
    keywords: ["assign supervisors", "assign faculty site", "admin internship assignment", "how assign"],
    content:
      "Admins assign faculty and site supervisors to internships so role-based workflows can proceed.",
    steps: [
      "Open admin assignment module.",
      "Select internship/student and choose faculty and site supervisor.",
      "Save and verify assignment reflects in dashboards.",
    ],
    blockers: [
      "Invalid role mapping can fail assignment.",
      "Internship record must exist before assignment.",
    ],
  },
  {
    id: "admin-faq-how-add-office-marks",
    title: "FAQ Admin: How do I add office marks?",
    roleScope: ["ADMIN"],
    module: "faq-admin",
    keywords: ["add office marks", "office evaluation admin", "admin marks 20", "office score"],
    content:
      "Admins can add office evaluation marks that contribute to total final result computation.",
    steps: [
      "Open admin office evaluation section.",
      "Provide internshipId and office marks in allowed range.",
      "Submit and confirm total marks update.",
    ],
    blockers: [
      "Invalid or missing marks are rejected.",
      "Totals remain partial if other mark components are missing.",
    ],
  },
  {
    id: "admin-faq-manage-announcements",
    title: "FAQ Admin: How do announcements work?",
    roleScope: ["ADMIN"],
    module: "faq-admin",
    keywords: ["manage announcements", "pin update", "public announcement faq", "home announcements"],
    content:
      "Admins create and pin announcements visible on the portal home page for all users.",
    steps: [
      "Go to admin announcements module.",
      "Create/update message and optional link.",
      "Pin critical announcements for top visibility.",
    ],
    blockers: [
      "Missing message body can fail validation.",
      "Invalid links may be rejected by UI or API checks.",
    ],
  },
  {
    id: "all-faq-login-session-expired",
    title: "FAQ All Roles: Session expired and login issues",
    roleScope: ["ALL"],
    module: "faq-common",
    keywords: ["session expired", "login issue", "unauthorized 401", "token expired", "cannot login"],
    content:
      "If session expires, users should re-authenticate and ensure authorization headers and cookies are working correctly.",
    steps: [
      "Logout and login again.",
      "Retry action from correct role dashboard.",
      "If API is custom-called, include Authorization bearer token.",
    ],
    blockers: [
      "Expired/revoked tokens fail refresh flow.",
      "Missing auth header on protected APIs causes 401.",
    ],
  },
  {
    id: "all-faq-which-dashboard-to-use",
    title: "FAQ All Roles: Which dashboard should I use?",
    roleScope: ["ALL"],
    module: "faq-common",
    keywords: ["which dashboard", "correct dashboard", "role page", "student or faculty page"],
    content:
      "Use the dashboard that matches your account role to avoid permission and data-access issues.",
    steps: [
      "Confirm role at login/session.",
      "Use role-specific route: student, faculty, admin, or site.",
      "If wrong page opens, refresh session by re-login.",
    ],
    blockers: [
      "Opening another role’s page can trigger access errors.",
      "Stale local session data may route incorrectly.",
    ],
  },
  {
    id: "all-faq-why-get-400-403-404",
    title: "FAQ All Roles: Why do I get 400, 403, or 404?",
    roleScope: ["ALL"],
    module: "faq-common",
    keywords: ["why 400", "why 403", "why 404", "api error meaning", "request errors"],
    content:
      "400 means invalid request data, 403 means permission denied, and 404 means the target record was not found.",
    steps: [
      "For 400: check required fields and data formats.",
      "For 403: verify role permissions and internship assignment.",
      "For 404: verify the target id exists and is correct.",
    ],
    blockers: [
      "Using stale ids or wrong internship scope commonly causes failures.",
      "Role mismatch despite valid login still causes 403.",
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
  {
    id: "student-first-time-onboarding-checklist",
    title: "Student first-time onboarding checklist",
    roleScope: ["STUDENT"],
    module: "student-onboarding",
    keywords: ["start guide", "new student", "first time login", "how to start portal", "onboarding checklist"],
    content:
      "First-time students should follow a fixed sequence: verify account, login, create internship, submit forms, then continue logs and report workflows.",
    steps: [
      "Verify email and login from the student portal.",
      "Create internship record with correct company and dates.",
      "Complete AppEx-A and AppEx-B, then monitor approval and verification statuses.",
      "Submit weekly logs and final report, then track final result.",
    ],
    blockers: [
      "Skipping internship creation blocks downstream form and log flows.",
      "Unverified email can prevent successful login in strict auth setups.",
    ],
  },
  {
    id: "student-status-meaning-guide",
    title: "Student status meanings and next actions",
    roleScope: ["STUDENT"],
    module: "student-status-guide",
    keywords: ["status meaning", "pending meaning", "approved rejected status", "both verified", "what to do next"],
    content:
      "Student workflow statuses indicate where the process is blocked or complete and what action is expected next.",
    steps: [
      "Pending means waiting for reviewer action; monitor updates and keep data complete.",
      "Rejected or changes requested means update fields/comments and resubmit.",
      "Approved or both verified means proceed to next stage such as logs, report, or evaluation follow-up.",
    ],
    blockers: [
      "Students often misread pending as a failure; it is usually a waiting state.",
      "Ignoring reviewer comments can cause repeated rejections.",
    ],
  },
  {
    id: "student-deadline-and-timing-guidance",
    title: "Student deadline and timing guidance",
    roleScope: ["STUDENT"],
    module: "student-deadlines",
    keywords: ["deadline", "due date", "late submission", "when submit weekly log", "submission time"],
    content:
      "Students should submit forms and logs according to internship timeline and reviewer expectations to avoid delays.",
    steps: [
      "Submit AppEx and internship setup details as early as possible after internship confirmation.",
      "Submit weekly logs in sequence with valid week numbers based on internship dates.",
      "Submit final report before departmental cutoff and verify successful upload confirmation.",
    ],
    blockers: [
      "Invalid date range or out-of-sequence week numbers can trigger validation errors.",
      "Waiting until end dates can leave no buffer for review or correction.",
    ],
  },
  {
    id: "student-edit-and-resubmit-rules",
    title: "Student edit and resubmit rules",
    roleScope: ["STUDENT"],
    module: "student-resubmission",
    keywords: ["edit submission", "resubmit form", "update internship", "change after submit", "locked record"],
    content:
      "Some student records can be updated, but approval/finalization states may lock or constrain later edits.",
    steps: [
      "If rejected or changes requested, edit requested fields and resubmit from the same module.",
      "For approved records, check whether workflow allows update or requires coordinator intervention.",
      "After finalization-level actions, avoid assumptions and request admin/faculty guidance before changes.",
    ],
    blockers: [
      "Trying to overwrite finalized data can fail silently or return errors depending on route policy.",
      "Students may need reviewer comments to know exactly which fields to fix.",
    ],
  },
  {
    id: "student-upload-requirements-and-failures",
    title: "Student upload requirements and common failures",
    roleScope: ["STUDENT"],
    module: "student-upload-help",
    keywords: ["upload failed", "pdf required", "file type", "file too large", "report upload error"],
    content:
      "Upload flows depend on valid file type and complete internship linkage; final reports commonly require PDF.",
    steps: [
      "Use the allowed file type for the target module, especially PDF for final report submission.",
      "Confirm internshipId and module form fields are present before uploading.",
      "If upload fails, retry with a clean filename and stable connection, then recheck status in dashboard.",
    ],
    blockers: [
      "Wrong file type or missing internship linkage causes immediate request rejection.",
      "Network interruption during upload can leave the user unsure unless status is rechecked.",
    ],
  },
  {
    id: "student-notifications-and-feedback-check",
    title: "Student notification and reviewer feedback check",
    roleScope: ["STUDENT"],
    module: "student-feedback",
    keywords: ["where to see feedback", "review comments", "approval update", "status notification", "who reviewed"],
    content:
      "Students should regularly check module statuses and reviewer comments to quickly resolve pending or rejected submissions.",
    steps: [
      "Open the related module list and inspect latest status and remarks.",
      "When rejected or changes requested, apply exactly the requested corrections.",
      "If no update appears for long, contact assigned faculty or admin coordinator with internship details.",
    ],
    blockers: [
      "Not checking reviewer remarks leads to repeated incorrect resubmissions.",
      "Missing assignment mapping can delay who sees the submission for review.",
    ],
  },
  {
    id: "student-create-internship-troubleshooting",
    title: "Student create internship troubleshooting",
    roleScope: ["STUDENT"],
    module: "create-internship",
    keywords: ["cannot create internship", "internship form error", "duplicate internship", "invalid dates internship"],
    content:
      "Internship creation issues usually come from missing required fields, conflicting records, or invalid date/company details.",
    steps: [
      "Recheck required fields such as company details, role information, and internship dates.",
      "Ensure dates are logically ordered and consistent with actual internship period.",
      "If duplicate or conflict error appears, review existing internship entries before retrying.",
    ],
    blockers: [
      "Conflicting existing internship records can block fresh creation attempts.",
      "Invalid company data or date format can fail server-side validation.",
    ],
  },
  {
    id: "student-weekly-log-quality-tips",
    title: "Student weekly log quality tips",
    roleScope: ["STUDENT"],
    module: "weekly-logs",
    keywords: ["weekly log tips", "good weekly log", "activities skills challenges", "weekly log rejected"],
    content:
      "High-quality weekly logs include concrete activities, skills gained, and realistic challenges rather than one-line generic text.",
    steps: [
      "Write specific tasks completed in that week and mention tools or technologies used.",
      "Describe measurable learning outcomes in skills learned.",
      "List actual challenges and how they were handled or what support is needed.",
    ],
    blockers: [
      "Very short generic text can reduce review quality and may trigger correction requests.",
      "Submitting wrong week sequence can be rejected even with good content.",
    ],
  },
  {
    id: "student-final-report-quality-and-grading",
    title: "Student final report quality and grading guidance",
    roleScope: ["STUDENT"],
    module: "final-report-guidance",
    keywords: ["improve final report", "report quality", "how marks are decided", "ai suggested marks", "report grading"],
    content:
      "Final report quality improves when content is structured, specific, and aligned with internship work outcomes; AI suggestions support review but do not replace official grading.",
    steps: [
      "Include clear internship objectives, work performed, outcomes, and reflection.",
      "Keep report readable and complete so text extraction and review both work reliably.",
      "Treat AI suggestions as guidance only and follow faculty/admin grading decisions.",
    ],
    blockers: [
      "Poorly structured or sparse report text can weaken AI and human review confidence.",
      "Students may wrongly assume AI output is final grade without finalization workflow.",
    ],
  },
  {
    id: "student-dispute-and-recheck-process",
    title: "Student dispute and recheck process for marks",
    roleScope: ["STUDENT"],
    module: "student-dispute",
    keywords: ["dispute marks", "recheck result", "wrong grade", "appeal evaluation", "challenge marks"],
    content:
      "If students disagree with outcomes, they should raise a formal concern with evidence and request review through the proper channel.",
    steps: [
      "Collect relevant evidence such as submission timestamps, report copy, and evaluation context.",
      "Submit concern through complaint or designated coordinator workflow with clear issue summary.",
      "Track complaint/review status and respond promptly if clarification is requested.",
    ],
    blockers: [
      "Vague complaints without evidence delay resolution.",
      "Using informal channels only may not create an actionable review trail.",
    ],
  },
  {
    id: "forgot-password-email-not-received",
    title: "Forgot password: reset email not received",
    roleScope: ["ALL"],
    module: "auth",
    keywords: ["forgot password no email", "reset link not received", "password reset not coming", "check spam reset"],
    content:
      "If reset email is not visible, users should validate email entry, check spam/junk, and request a fresh reset link.",
    steps: [
      "Confirm you entered the same email used for account registration.",
      "Check spam/junk/promotions folders and wait briefly for delivery delay.",
      "Request a new reset link and use the latest email link to avoid expired token issues.",
    ],
    blockers: [
      "Using older reset links can fail due to expiration.",
      "Mailbox filtering rules can hide automated password reset emails.",
    ],
  },
];
