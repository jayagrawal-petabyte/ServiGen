export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface LifecycleStage {
  label: string;
  timestamp?: string;
  isActive: boolean;
  isCompleted: boolean;
}

export interface MajorIncident {
  id: string;
  title: string;
  priority: Priority;
  product: string;
  resolutionTarget: string;
  responseTarget: string;
  lifecycleStages: LifecycleStage[];
  assignee: string;
}

export type FeedEntryType =
  | 'new_ticket'
  | 'user_update'
  | 'email_sent'
  | 'triaged'
  | 'attachment_downloaded'
  | 'status_change'
  | 'comment_added';

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

export interface SidebarListItem {
  id: string;
  label: string;
  count?: number;
  isSelected?: boolean;
  iconKey?: string;
}

export interface SidebarGroup {
  groupLabel: string;
  items: SidebarListItem[];
}
