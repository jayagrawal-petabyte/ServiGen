export interface TeamIncident {
  id: string;
  sla: string;
  summary: string;
  category: string;
  agent: string;
  priority: string;
  status: string;
  type: string;
  team: "1st Line Support" | "2nd Line Support" | "Infrastructure";
  isStarred?: boolean;
  dateLogged: string;
}

export const INITIAL_ALL_TEAM_INCIDENTS: TeamIncident[] = [];
