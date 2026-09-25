export interface Project {
  id: number;
  name: string;
  description: string;
  status: "Active" | "Completed" | "On Hold";
  priority: "High" | "Medium" | "Low";
  owner: string;
  timeline: string;
  timeSpent: string;
  completedSubtasks: number;
  totalSubtasks: number;
}

export const mockProjects: Project[] = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Redesign and improve the company website.",
    status: "Active",
    priority: "High",
    owner: "Monalisa Panda",
    timeline: "Sep 10 - Oct 15",
    timeSpent: "32 hours",
    completedSubtasks: 7,
    totalSubtasks: 10,
  },
  {
    id: 2,
    name: "Service Portal",
    description: "Development of the internal service management portal.",
    status: "Active",
    priority: "High",
    owner: "Development Team",
    timeline: "Sep 15 - Nov 20",
    timeSpent: "45 hours",
    completedSubtasks: 8,
    totalSubtasks: 15,
  },
  {
    id: 3,
    name: "User Management",
    description: "Implement user and organisation management features.",
    status: "Completed",
    priority: "Medium",
    owner: "Anjali Prasad",
    timeline: "Aug 01 - Sep 10",
    timeSpent: "28 hours",
    completedSubtasks: 12,
    totalSubtasks: 12,
  },
  {
    id: 4,
    name: "Incident Management",
    description: "Build incident tracking and management functionality.",
    status: "Active",
    priority: "High",
    owner: "Mohammad Taha Ali",
    timeline: "Sep 05 - Oct 30",
    timeSpent: "38 hours",
    completedSubtasks: 6,
    totalSubtasks: 12,
  },
  {
    id: 5,
    name: "Service Catalogue",
    description: "Create and configure the service catalogue.",
    status: "On Hold",
    priority: "Low",
    owner: "Voona Sarayu",
    timeline: "Sep 01 - Nov 15",
    timeSpent: "16 hours",
    completedSubtasks: 3,
    totalSubtasks: 10,
  },
];