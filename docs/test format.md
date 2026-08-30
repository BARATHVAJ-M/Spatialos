SpatialOS Full System QA & Testing Plan
This document is a comprehensive, generic test plan designed to validate the end-to-end functionality of the entire SpatialOS product suite. This test plan is suitable for verifying every page, button, backend service, database operation, and API endpoint.

1. Syntax & Codebase Integrity
1.1 Backend Compilation
 Run npm run build inside the backend directory.
 Verify the NestJS compiler finishes with 0 errors.
 Ensure all DTOs (Data Transfer Objects) correctly map to Prisma models.
 Ensure no orphaned node processes are occupying port 3001 (preventing EADDRINUSE crashes).
1.2 Frontend Compilation
 Run npm run build inside the dashboard directory.
 Verify the Next.js (Turbopack) compiler finishes successfully.
 Check for React hydration errors or missing prop types in UI components.
 Verify TailwindCSS classes compile without missing directive warnings.
2. API & Database Validation
2.1 Backend Bootup & Seeding
 Start the backend with npm run start:dev.
 Verify PrismaService outputs "Successfully connected to spatialos_db!".
 Verify SeedService runs successfully and guarantees the existence of the Default Organization and Notice Board Service Definition.
2.2 Endpoints (CRUD)
Run HTTP requests (via Invoke-RestMethod or Postman) against http://localhost:3001/v1/admin/ to verify responses:

Endpoint	Method	Expected Result
/places	GET	200 OK - Returns hierarchy of physical spaces.
/experiences	GET	200 OK - Returns experiences with mapped Places.
/experiences/:id	GET	200 OK - Returns deeply nested payload (spatialNodes, serviceInstances).
/experiences/:id/nodes	PUT	200 OK - Overwrites SpatialNode table data successfully.
/experiences/:id/services	PUT	200 OK - Overwrites ServiceInstance table data successfully.
/services/definitions	GET	200 OK - Returns array of available AR micro-apps (Notice Board, etc.).
/content	GET	200 OK - Returns global asset library records.
3. Frontend UI/UX Testing
3.1 Network & Security
 Verify apiFetch dynamically handles standard requests using credentials: true.
 Ensure the backend main.ts CORS policy allows requests from http://localhost:3000 via origin: true.
3.2 Places Management Page
 Action: Add a new place (e.g., "Library").
 Expectation: Instantly reflects in the UI, and the POST request succeeds.
 Action: Edit place name.
 Expectation: PUT request fires, database updates.
 Action: Delete a place.
 Expectation: Place is removed from the dashboard, DELETE cascade functions in DB.
3.3 Experiences Management Page
 Action: Create a new Experience linked to a Place.
 Expectation: Redirects to the new Experience Details page safely.
 Action: Navigate back to Overview.
 Expectation: The experience shows up with "Draft" status.
3.4 Experience Details: Spatial Canvas & Services
 Action: Click "Add Node" -> "Notice Board".
 Expectation: Spatial Canvas renders the node visually in the center. React NaN crash does not occur because data is mapped correctly (x and z).
 Action: Click "Quick Attach" / "Save Notice Board".
 Expectation: No "Failed to fetch" errors. apiFetch successfully transmits JSON body to PUT /experiences/:id/nodes and /services.
 Action: Upload an Image/Video in the Notice Board config.
 Expectation: The image URL is saved to the backend inside content.mediaItems.
3.5 Experience Details: Content Tab
 Action: Open the "Content" tab.
 Expectation: The frontend maps the serviceInstances and visually extracts your uploaded Notice Board images into the "Scene Media Assets" grid.
 Action: Click "Preview Asset".
 Expectation: Lightbox displays the image/video successfully.
3.6 Cross-Navigation
 Ensure transitioning from Places -> Experiences -> Content does not trigger stale cache crashes.
 Verify buttons have active states, hover effects, and loaders during async API calls.
4. Verification Check
IMPORTANT

If any test fails, review the NestJS console log for [DATABASE ERROR] or the browser Network tab for CORS or 400 Bad Request messages. Do not proceed to production builds until all checkboxes above pass.

Understanding