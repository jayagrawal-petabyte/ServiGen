// Import from here in components, mock data, and screens.

// Priority levels — only these 4 strings are valid values
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

// Shape of a single lifecycle stage in the pipeline (Started → Escalated → Diagnosed → Mitigated)
export interface LifecycleStage {
  label: string;
  timestamp?: string;
  isActive: boolean;
  isCompleted: boolean;
}

// Shape of a single incident card (maps to the API response when integrated)
export interface MajorIncident {
  id: string;
  title: string;
  priority: Priority;
  product: string;
  resolutionTarget: string;
  responseTarget: string;
  lifecycleStages: LifecycleStage[];
  /** Assigned agent name */
  assignee: string;
}

// Feed entry event types — only these strings are valid values
export type FeedEntryType =
  | 'new_ticket'
  | 'user_update'
  | 'email_sent'
  | 'triaged'
  | 'attachment_downloaded'
  | 'status_change'
  | 'comment_added';

// Shape of a single row in the Activity Feed panel
export interface ActivityFeedEntry {
  id: string;
  avatarLabel: string;
  actorName: string;
  actorOrg?: string;
  ticketRef: string;
  actionLabel: string;
  message?: string;
  timeAgo: string;
  type: FeedEntryType;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

/** A single item in a sidebar group */
export interface SidebarListItem {
  id: string;
  label: string;
  count?: number;
  isSelected?: boolean;
  iconKey?: string;
}

/** A labelled group of sidebar items (e.g. "ACTIVE", "ACTIONED", "VIEWS") */
export interface SidebarGroup {
  groupLabel: string;
  items: SidebarListItem[];
}
