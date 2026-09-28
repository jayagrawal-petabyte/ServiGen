- Added intent.model.js with optimised keyword-based classification using intentRules array (.find + .some), thus replacing the if-else chain
- Added intent.service.js with input validation and routing decision logic (category vs Human Escalation based on confidence threshold)
- Added intent.controller.js to handle POST /analyze requests
- Added intent.routes.js exposing POST /analyze endpoint

Temporary workaround I did: keyword matching used in lieu of Bedrock Titan
integration (pending). Routing decision placeholder for Farjan's
AI Core integration.

**Note: The given changelog or the sibling files may not reflect recent repository structure changes or file referencing updates. Please verify directly with the Project Manager/Lead or check the current file tree for the same.**