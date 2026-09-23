# ServiGen - Frontend Workspace

Welcome to the frontend repository for ServiGen. 
This structure is based on the task allocations for our team.

## Folder Structure

\\\
src/
├── assets/                 # Global assets (images, icons, etc.)
├── components/
│   └── shared/             # Shared UI components (Navbar, Button, Card, etc.) - Lead: Durgesh
├── layouts/                # Common layouts (Sidebar, Header wrappers)
├── pages/                  # Page modules assigned to each team member
│   ├── Approvals/          # Aditya Kumar Singh (My Approvals)
│   ├── ArticleDrafts/      # Aditya Kumar Singh (Article Drafts)
│   ├── Auth/               # Anjali Prasad (Authentication + Application Shell)
│   ├── Calendar/           # Monalisa Panda (Calendar)
│   ├── ChangeRequests/     # Vooka Sai Siddharth (Change Requests)
│   ├── CMDB/               # Vooka Sai Siddharth (CMDB Configuration Items)
│   ├── CustomLists/        # Kritika Thakur (Custom Lists)
│   ├── Dashboard/          # Mohammad Taha Ali (Home Dashboard)
│   ├── Incidents/          # Mohammad Taha Ali (Incidents & Analytics)
│   ├── MajorIncidents/     # Inesh Agarwal (Major Incidents + Activity Feed)
│   ├── MyWork/             # Keerthana M (My Work-Tickets)
│   ├── OnHoldTickets/      # Kritika Thakur (On-Hold Tickets)
│   ├── Projects/           # Monalisa Panda (Projects)
│   ├── ServicesCatalogue/  # Voona Sarayu (Services Catalogue)
│   └── TeamIncidents/      # Nikhila Chinta (Team Incident Views)
├── services/               # API Integration layers - Lead: Nainesh
├── store/                  # State management
└── utils/                  # Helper functions
\\\

## Workflow
1. Pull the latest from the frontend branch.
2. Build your dedicated pages within your assigned folder in src/pages/.
3. Use shared components from src/components/shared/ instead of building duplicates.
4. Raise PRs for reviews from Nainesh & Durgesh.
