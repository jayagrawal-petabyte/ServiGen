# Dashboard Module

Express routes and business logic for the agent dashboard, covering personalized overviews, live KPI metrics, mood check-in, and incident breakdowns, based on specifications **SCR-002**, **SCR-014**, and **SCR-015** of the Halo AI Business Workflow.

Mount this router at `/api/dashboard`.

---

## SCR Coverage

| SCR | Description | Endpoints |
|-----|-------------|-----------|
| SCR-002 | Personalized Dashboard Overview | `GET /summary` |
| SCR-014 | Home Dashboard (Live) — KPIs + Mood | `GET /kpis`, `GET /mood`, `POST /mood` |
| SCR-015 | Home Dashboard: Scrolled View | `GET /incidents-by-team`, `GET /incidents-by-category`, `GET /new-tickets` |

---

## Authentication Context

Endpoints read the acting agent ID from the `x-user-id` HTTP header (or `?agentId=` query parameter). In local/dev mode, it defaults to `'agent-001'`.

---

## Endpoints

### 1. `GET /summary`
Returns a personalized overview for the acting agent. Ticket counts are derived live from the my-work data layer. Approvals, assignments and tasks are scoped per agent. **(SCR-002)**

- **Headers:** `x-user-id: agent-001` (optional — defaults to `agent-001`)
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": {
      "tickets": {
        "active": 2,
        "pending": 1,
        "actioned": 1,
        "onHold": 2,
        "total": 6
      },
      "approvals": { "pending": 3 },
      "assignments": { "total": 4 },
      "tasks": { "total": 2 }
    }
  }
  ```

---

### 2. `GET /kpis`
Returns live KPI metrics for the service dashboard. **(SCR-014)**

- **Response `200`:**
  ```json
  {
    "success": true,
    "data": {
      "openIncidents": 42,
      "slaBreaches": 7,
      "avgResolutionTimeMinutes": 185,
      "avgResolutionTimeFormatted": "3h 5m",
      "lastUpdatedAt": "2026-10-03T02:00:00.000Z"
    }
  }
  ```

---

### 3. `GET /mood`
Returns the current mood check-in for the acting agent. **(SCR-014)**

- **Headers:** `x-user-id: agent-001`
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": {
      "agentId": "agent-001",
      "mood": "Good",
      "submittedAt": "2026-10-03T08:00:00.000Z"
    }
  }
  ```
- **Response `200` (no entry yet):** `"data": null`

---

### 4. `POST /mood`
Submit or update a mood check-in for the acting agent. **(SCR-014)**

- **Headers:** `x-user-id: agent-001`
- **Request Body:**
  ```json
  { "mood": "Great" }
  ```
- **Allowed Values:** `Great`, `Good`, `Neutral`, `Struggling`, `Overwhelmed`
- **Response `200`:** Updated mood entry object.
- **Response `400`:** Invalid or missing mood value.

---

### 5. `GET /incidents-by-team`
Returns the number of open incidents and SLA breaches per support team. **(SCR-015)**

- **Response `200`:**
  ```json
  {
    "success": true,
    "data": [
      { "team": "1st Line Support", "openIncidents": 24, "slaBreach": 3 },
      { "team": "2nd Line Support", "openIncidents": 12, "slaBreach": 3 },
      { "team": "Major Incidents",  "openIncidents": 6,  "slaBreach": 1 }
    ]
  }
  ```

---

### 6. `GET /incidents-by-category`
Returns incidents grouped by their category. **(SCR-015)**

- **Response `200`:**
  ```json
  {
    "success": true,
    "data": [
      { "category": "Network",              "count": 15 },
      { "category": "Hardware",             "count": 10 },
      { "category": "Software",             "count": 9  },
      { "category": "Access & Identity",    "count": 5  },
      { "category": "Email & Collaboration","count": 3  }
    ]
  }
  ```

---

### 7. `GET /new-tickets`
Returns the latest new tickets for the dashboard panel, sorted by `createdAt` descending. **(SCR-015)**

- **Query Parameters:**
  - `limit` (optional): Number of tickets to return. Default `10`, max `50`.
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "INC-2001",
        "summary": "Printer not responding on 3rd floor",
        "priority": "Low",
        "ticketType": "Incident",
        "organisation": "Acme Corp",
        "createdAt": "2026-10-03T07:55:00.000Z"
      }
    ]
  }
  ```

---

## Data Layer Architecture

The model accessor functions in `dashboard.model.js` are intentionally isolated and asynchronous, allowing them to be replaced seamlessly with Prisma/Supabase queries once the shared database layer is introduced.

Ticket counts in `GET /summary` are derived directly from the `my-work` model — there is no duplicated ticket state in the dashboard model. This ensures a single source of truth across both modules.
