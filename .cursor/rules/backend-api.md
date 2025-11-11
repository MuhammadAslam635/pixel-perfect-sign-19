---
description: Backend API calling
globs:
alwaysApply: yes
---
- When accessing the backend from React, route the request through the shared `api.ts` utility instead of issuing raw fetch calls.
- Wrap backend interactions in React Query hooks; for any page directory that consumes the backend, create a `hooks.ts` file within that page folder that defines the relevant react query hooks.