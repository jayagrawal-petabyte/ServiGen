import { ApiError, api, getStoredUser } from "../../services/apiClient";
import {
  type Project,
  type ProjectPriority,
  type ProjectStatus,
  type ProjectTask,
  toDateKey,
} from "./types";

const PROJECTS_PATH = "/api/projects";


function _dk(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toDateKey(d);
}

const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Customer Portal Redesign",
    description: "Redesign the customer-facing portal for better UX.",
    owner: "Alex Agent",
    status: "Active",
    statusLabel: "Active",
    priority: "High",
    startDate: _dk(-30),
    targetDate: _dk(30),
    hoursSpent: 40,
    hoursBudget: 120,
    completionPercent: 35,
    tasks: [
      { id: "t1", title: "Wireframes", assignee: "Alice Approver", dueDate: _dk(-10), done: true },
      { id: "t2", title: "UI Components", assignee: "Alex Agent", dueDate: _dk(10), done: false },
      { id: "t3", title: "API Integration", assignee: "Sam User", dueDate: _dk(25), done: false },
    ],
  },
  {
    id: "2",
    name: "Incident Reporting System",
    description: "Build an automated incident reporting and tracking system.",
    owner: "Adam Admin",
    status: "Active",
    statusLabel: "Active",
    priority: "Medium",
    startDate: _dk(-15),
    targetDate: _dk(45),
    hoursSpent: 20,
    hoursBudget: 80,
    completionPercent: 20,
    tasks: [
      { id: "t4", title: "Requirements Gathering", assignee: "Adam Admin", dueDate: _dk(-5), done: true },
      { id: "t5", title: "Database Schema", assignee: "Sam User", dueDate: _dk(15), done: false },
    ],
  },
  {
    id: "3",
    name: "Mobile App Launch",
    description: "Launch the ServiGen mobile app on iOS and Android.",
    owner: "Sarah Support",
    status: "New",
    statusLabel: "New",
    priority: "High",
    startDate: _dk(0),
    targetDate: _dk(60),
    hoursSpent: 0,
    hoursBudget: 200,
    completionPercent: 0,
    tasks: [],
  },
  {
    id: "4",
    name: "Legacy System Migration",
    description: "Migrate data from the old ticketing system.",
    owner: "Alice Approver",
    status: "On Hold",
    statusLabel: "On Hold",
    priority: "Low",
    startDate: _dk(-60),
    targetDate: _dk(90),
    hoursSpent: 60,
    hoursBudget: 150,
    completionPercent: 40,
    tasks: [
      { id: "t6", title: "Data Audit", assignee: "Alice Approver", dueDate: _dk(-20), done: true },
      { id: "t7", title: "Migration Scripts", assignee: "Sam User", dueDate: _dk(-5), done: false },
    ],
  },
  {
    id: "5",
    name: "Analytics Dashboard",
    description: "Build a real-time analytics dashboard for managers.",
    owner: "Alex Agent",
    status: "Completed",
    statusLabel: "Completed",
    priority: "Medium",
    startDate: _dk(-90),
    targetDate: _dk(-10),
    hoursSpent: 100,
    hoursBudget: 100,
    completionPercent: 100,
    tasks: [
      { id: "t8", title: "Design Mockups", assignee: "Alex Agent", dueDate: _dk(-60), done: true },
      { id: "t9", title: "Build Charts", assignee: "Sarah Support", dueDate: _dk(-30), done: true },
      { id: "t10", title: "Deploy", assignee: "Adam Admin", dueDate: _dk(-10), done: true },
    ],
  },
];