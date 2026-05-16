export type TimelineItemState = "completed" | "pending" | "blocked" | "rejected";

export type TimelineItem = {
  id: string;
  title: string;
  subtitle?: string;
  state: TimelineItemState;
  href: string;
  kind: "milestone" | "weekly";
  weekNo?: number;
};
