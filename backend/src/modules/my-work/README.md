# My Work Module

Express routes and business logic for the agent personal ticket queue and SLA tracking, based on specifications **SCR-004**, **SCR-008**, and **SCR-016** of the Halo AI Business Workflow.

Mount this router at `/api/my-work`.

---

## Authentication Context
Endpoints read the acting agent ID from the `x-user-id` HTTP header (or `?agentId=` query parameter). In local/dev mode, it defaults to `'agent-001'`.

---

## Endpoints

### 1. `GET /`
List personal tickets assigned to the acting agent.
* **Query Parameters:**
  * `status` (optional): Filter by queue — `Active`, `Pending`, `Actioned`, `On Hold`.
  * `priority` (optional): `Critical`, `High`, `Medium`, `Low`.
  * `ticketType` (optional): `Incident`, `Service Request`, etc.
* **Response `200`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "INC-1001",
        "summary": "VPN connection dropping intermittently for remote users",
        "priority": "High",
        "status": "Active",
        "ticketType": "Incident",
        "organisation": "Acme Corp",
        "site": "London HQ",
        "assignedAgentId": "agent-001",
        "slaTimeLeft": 180,
        "slaFormatted": "3h 0m",
        "timeRecord": 45,
        "holdReason": null,
        "createdAt": "2026-09-25T08:30:00.000Z",
        "updatedAt": "2026-09-25T09:15:00.000Z"
      }
    ]
  }
  ```

### 2. `GET /on-hold`
Dedicated queue for tickets currently placed on hold (SCR-008, SCR-016).
* **Query Parameters:**
  * `ticketType` (optional): Filter on-hold tickets by category/type.
  * `priority` (optional): Filter on-hold tickets by priority level.
* **Response `200`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "INC-1004",
        "summary": "Office 365 licensing renewal for sales department",
        "priority": "Medium",
        "status": "On Hold",
        "ticketType": "Incident",
        "organisation": "Soylent Corp",
        "site": "London HQ",
        "assignedAgentId": "agent-001",
        "slaTimeLeft": 420,
        "slaFormatted": "7h 0m",
        "timeRecord": 15,
        "holdReason": "Awaiting vendor quote"
      }
    ]
  }
  ```

### 3. `GET /:ticketId`
Retrieve full details for a single ticket.
* **Response `200`:** Ticket object.
* **Response `404`:** Ticket not found.

### 4. `PATCH /:ticketId/status`
Transition a ticket to another queue state.
* **Request Body:**
  ```json
  {
    "status": "On Hold",
    "holdReason": "Awaiting customer log files"
  }
  ```
* **Allowed Statuses:** `Active`, `Pending`, `Actioned`, `On Hold`.

### 5. `POST /:ticketId/time`
Record time spent working on a ticket.
* **Request Body:**
  ```json
  {
    "minutesSpent": 30
  }
  ```
* **Response `200`:** Returns updated ticket with accumulated `timeRecord`.

---

## Data Layer Architecture
The model accessor functions in `my-work.model.js` are intentionally isolated and asynchronous, allowing them to be replaced seamlessly with Prisma/Supabase queries once the shared database layer is introduced.
