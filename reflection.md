# Half-Page Reflection

## Salon Queue Management System --- Vibe Coding Lab

For this Vibe Coding Lab, I developed **LateCuts**, a salon queue
management system designed around the real workflow of customers,
barbers, and reception staff. I used AI-assisted coding, but I learned
that the agent works best when I provide clear project documents,
specific acceptance criteria, and constraints instead of broad requests.
The project uses a React and TypeScript frontend, a Node.js backend,
Supabase PostgreSQL for persistent data, and Vercel and Render for
hosting. The interface supports English and Gujarati and uses a premium
dark design with muted gold accents.

### One Thing the Agent Got Wrong --- and How I Fixed It

During production verification, the customer Join Queue screen showed an
error saying the service menu could not load. At first, the backend
health endpoint I tried returned "Endpoint not found," which made the
diagnosis confusing. I checked the backend code and used the correct
`/api/health` route. The health response showed that the server and
database were connected. I then opened the services API directly and
confirmed that it returned all six expected services with the correct
prices and durations.

This evidence showed that the database and services endpoint were
working; the problem was the connection between the deployed frontend
and backend. The current Vercel production domain was not included in
Render's CORS allowlist. I updated the prompt to require checking the
**actual deployed browser origin**, the exact API route, and the backend
allowlist before suggesting a fix. After adding the current production
origin to the existing CORS configuration and allowing Render to
restart, the service menu loaded successfully.

### What I Learned

I learned not to accept an AI diagnosis without testing it against
observable evidence. A successful build is not the same as a working
production application. Clear prompts, project documentation, safe
environment configuration, and step-by-step testing helped me turn an
initial deployment error into a verified fix. I also learned to
distinguish changes to a token's display format from changes to stored
database records, so the later `LX` to `LC` branding update could
preserve existing queue data.
