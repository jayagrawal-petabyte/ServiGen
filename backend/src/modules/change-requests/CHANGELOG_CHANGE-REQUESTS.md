- Added change-requests.model.js with in-memory mock data implementing the full schema (id, agent, summary, changeType, status, ciTag, relatedService, startDate, endDate) and three accessor functions: getChangeRequests, getChangeRequestById, getActiveChangeRequests
- Added change-requests.service.js as the intermediary layer between the controller and the model, exposing getAllChangeRequests, getChangeRequestDetails, and getActiveChangeRequestsData
- Added change-requests.controller.js handling three endpoints with standard { success, data } response shape and proper 404 handling for missing records
- Added change-requests.routes.js exposing GET /, GET /active, and GET /:id endpoints (SCR-009 & SCR-026)

Temporary workaround I did: mock data used in an in-memory array in lieu of the shared Supabase/Prisma database layer (pending Devansh's shared config setup). CI tag linkage references CMDB tags directly by string value for now.

**Note: The given changelog or the sibling files may not reflect recent repository structure changes or file referencing updates. Please verify directly with the Project Manager/Lead or check the current file tree for the same.**
