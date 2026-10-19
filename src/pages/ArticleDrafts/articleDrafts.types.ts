export type ArticleDraftStatus =
  | 'Draft'
  | 'Awaiting Approval'
  | 'Published'
  | 'Rejected';

export type ArticleDraftSlaStatus =
  | 'safe'
  | 'warning'
  | 'overdue';

export interface ArticleDraft {
  id: string;
  slaTimeLeft: string;
  slaStatus: ArticleDraftSlaStatus;
  summaryTitle: string;
  summarySubtitle: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  priorityColor?: string;
  status: ArticleDraftStatus | string;
  type: string;
  date: string;
  author: string;
  team: string;
  agent: string;
  body: string;
}

export type CreateArticleDraftDto = Omit<ArticleDraft, 'id'>;
export type UpdateArticleDraftDto = Partial<Omit<ArticleDraft, 'id'>>;

export interface BackendKnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category?: string;
  priority?: string;
  status: string;
  approvalStatus?: string;
  slaDueAt?: string | null;
  author?: string;
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;
}
