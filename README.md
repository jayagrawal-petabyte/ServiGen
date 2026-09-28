# ServiGen - Frontend Workspace

Welcome to the frontend repository for ServiGen. 
This structure is based on the task allocations for our team.


## Folder Structure

```text
src/
├── assets/                         # Global assets (images, icons, etc.)
│
├── components/
│   └── shared/                     # Shared UI components (Navbar, Button, Card, etc.)
│                                   # Lead: Durgesh
│
├── layouts/                        # Common layouts (Sidebar, Header wrappers)
│
├── pages/                          # Page modules assigned to each team member
│   ├── Approvals/                  # Aditya Kumar Singh - My Approvals
│   ├── ArticleDrafts/              # Aditya Kumar Singh - Article Drafts
│   ├── Auth/                       # Anjali Prasad - Authentication + Application Shell
│   ├── Calendar/                   # Monalisa Panda - Calendar
│   ├── ChangeRequests/             # Vooka Sai Siddharth - Change Requests
│   ├── CMDB/                       # Vooka Sai Siddharth - CMDB Configuration Items
│   ├── CustomLists/                # Kritika Thakur - Custom Lists
│   ├── Dashboard/                  # Mohammad Taha Ali - Home Dashboard
│   ├── Incidents/                  # Mohammad Taha Ali - Incidents & Analytics
│   ├── MajorIncidents/             # Inesh Agarwal - Major Incidents + Activity Feed
│   ├── MyWork/                     # Keerthana M - My Work - Tickets
│   ├── OnHoldTickets/              # Kritika Thakur - On-Hold Tickets
│   ├── Projects/                   # Monalisa Panda - Projects
│   ├── ServicesCatalogue/          # Voona Sarayu - Services Catalogue
│   └── TeamIncidents/              # Nikhila Chinta - Team Incident Views
│
├── services/                       # API integration layers
│                                   # Lead: Nainesh
│
├── store/                          # State management
│
└── utils/                          # Helper functions

```

```markdown
### Workflow

1. **Pull the latest changes**
   - Pull the latest code from the `Frontend` branch before starting work.

2. **Work only in your assigned module**
   - Build your pages/components inside your assigned folder under `src/pages/`.

3. **Use shared components**
   - Reuse components from `src/components/shared/`.
   - Do not create duplicate versions of common components such as Navbar, Button, Card, etc.

4. **Keep your work within the Frontend branch**
   - All frontend development is restricted to the `Frontend` branch during the current development phase.

5. **Code review**
   - Once the PR workflow is enabled, raise PRs for review by cybersecurity team
   
```

## Current Git Workflow

> **Current phase:** Until the first deployment, all frontend work is pushed directly to the `Frontend` branch.

- Pull the latest changes before starting work.
- Work only within your assigned module.
- Push changes only to the `Frontend` branch.
- Do not modify or push to any other branch.
- Use shared components wherever applicable.

### Post-Deployment Workflow

After the first deployment:

1. Create a separate feature branch.
2. Implement your assigned task.
3. Push your feature branch.
4. Raise a PR to the `Frontend` branch.
5. Get the PR reviewed by **Nainesh and Durgesh**.
6. Merge only after approval.

