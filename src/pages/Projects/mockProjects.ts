export type ProjectStatus = "New" | "Active" | "On Hold" | "Completed";
export type ProjectPriority = "High" | "Medium" | "Low";

export interface ProjectTask {
  id: number;
  title: string;
  assignee: string;
  dueDate: string; // YYYY-MM-DD
  done: boolean;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  hoursSpent: number;
  hoursBudget: number;
  tasks: ProjectTask[];
}

// The logged-in user, used by "My Tasks" and "My Calendar".
export const CURRENT_USER = "Kaleem Smith";

export const PROJECT_STATUSES: ProjectStatus[] = ["New", "Active", "On Hold", "Completed"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Dates are relative to today so the demo always looks current.
function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateKey(d);
}

function task(id: number, title: string, assignee: string, due: number, done: boolean): ProjectTask {
  return { id, title, assignee, dueDate: day(due), done };
}

export const mockProjects: Project[] = [
  {
    id: 2196,
    name: "Halo Implementation",
    description: "Roll out the Halo service desk platform across all departments.",
    owner: "Kaleem Smith",
    status: "On Hold",
    priority: "High",
    startDate: day(-20),
    targetDate: day(10),
    hoursSpent: 1124,
    hoursBudget: 1680,
    tasks: [
      task(3127, "Requirements Gathering and Analysis", "Kaleem Smith", -16, true),
      task(3128, "System Design and Planning", "Kaleem Smith", -12, true),
      task(3129, "System Configuration and Customization", "Olivia Chen", -6, true),
      task(3130, "Integration and Data Migration", "Kaleem Smith", -2, true),
      task(3131, "User Training and Pilot Testing", "Kaleem Smith", 4, false),
      task(3132, "Deployment and Implementation Review", "Anjali Prasad", 9, false),
    ],
  },
  {
    id: 2195,
    name: "Network Connectivity",
    description: "Upgrade branch office network hardware and connectivity.",
    owner: "Kaleem Smith",
    status: "New",
    priority: "Medium",
    startDate: day(-20),
    targetDate: day(-5),
    hoursSpent: 52.93,
    hoursBudget: 160,
    tasks: [
      task(3121, "Network Hardware Assessment", "Kaleem Smith", -17, true),
      task(3122, "Hardware Procurement and Verification", "Olivia Chen", -13, true),
      task(3123, "Adapter Configuration and Preparation", "Kaleem Smith", -9, false),
      task(3124, "Rollout Planning and Coordination", "Anjali Prasad", -7, false),
      task(3125, "Onsite Deployment and Testing", "Kaleem Smith", -5, false),
      task(3126, "Post-Rollout Validation and Reporting", "Kaleem Smith", 2, false),
    ],
  },
  {
    id: 2150,
    name: "Server Decommission",
    description: "Retire the legacy on-premise application server.",
    owner: "Olivia Chen",
    status: "New",
    priority: "Low",
    startDate: day(-3),
    targetDate: day(7),
    hoursSpent: 67.5,
    hoursBudget: 400,
    tasks: [
      task(2151, "Remove Software Licences", "Olivia Chen", -1, true),
      task(2153, "Terminate Contracts", "Olivia Chen", 1, false),
      task(2154, "Create Backups", "Kaleem Smith", 2, false),
      task(2155, "Wipe Data", "Olivia Chen", 4, false),
      task(2156, "Unplug Server", "Olivia Chen", 5, false),
      task(2157, "Destroy Server", "Anjali Prasad", 7, false),
    ],
  },
  {
    id: 2140,
    name: "Service Portal",
    description: "Development of the internal service management portal.",
    owner: "Monalisa Panda",
    status: "Active",
    priority: "High",
    startDate: day(-30),
    targetDate: day(35),
    hoursSpent: 45,
    hoursBudget: 300,
    tasks: [
      task(2141, "Portal Wireframes", "Monalisa Panda", -22, true),
      task(2142, "Auth Integration", "Kaleem Smith", -8, true),
      task(2143, "Ticket Submission Flow", "Monalisa Panda", 6, false),
      task(2144, "Knowledge Base Search", "Anjali Prasad", 14, false),
      task(2145, "UAT and Sign-off", "Monalisa Panda", 30, false),
    ],
  },
  {
    id: 2130,
    name: "Incident Management",
    description: "Build incident tracking and management functionality.",
    owner: "Mohammad Taha Ali",
    status: "Active",
    priority: "High",
    startDate: day(-40),
    targetDate: day(14),
    hoursSpent: 38,
    hoursBudget: 120,
    tasks: [
      task(2131, "Incident Data Model", "Mohammad Taha Ali", -30, true),
      task(2132, "SLA Timers", "Mohammad Taha Ali", -10, true),
      task(2133, "Escalation Rules", "Kaleem Smith", -3, false),
      task(2134, "Reporting Dashboard", "Mohammad Taha Ali", 10, false),
    ],
  },
  {
    id: 2120,
    name: "User Management",
    description: "Implement user and organisation management features.",
    owner: "Anjali Prasad",
    status: "Completed",
    priority: "Medium",
    startDate: day(-70),
    targetDate: day(-25),
    hoursSpent: 28,
    hoursBudget: 40,
    tasks: [
      task(2121, "Roles and Permissions", "Anjali Prasad", -55, true),
      task(2122, "Organisation Hierarchy", "Anjali Prasad", -40, true),
      task(2123, "Bulk User Import", "Anjali Prasad", -27, true),
    ],
  },
];
