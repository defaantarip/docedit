# AI Workflow Note

> **Before you submit:** this note describes what actually happened in this build session (Claude generating the code in a chat-based workflow). Read it, adjust anything that doesn't match how you personally worked, and add your own voice — a reviewer reading this alongside your video should feel like it's genuinely your account of the process, not a template.

## Tools used

- **Claude** (Anthropic), used conversationally to scaffold and write the backend, frontend, and tests directly, rather than as inline autocomplete.

## Where AI materially sped things up

- **Boilerplate that has one obviously-correct shape**: Express route wiring, the multer upload config, the JSON-file persistence layer. Writing this by hand would have taken real time for close-to-zero design decisions — good use of the time budget.
- **Test scaffolding**: generating the initial set of `node:test` cases for the access-control logic (owner vs. shared vs. no-access) in one pass, which would otherwise have eaten into the time budget meant for the editor/sharing UI.
- **Documentation drafts**: a first pass of the README/architecture note structure, which I then edited down to match what was actually built rather than what was originally planned.

## What I changed or rejected

- **Storage choice**: initially considered SQLite via a native driver; changed to a plain JSON file specifically because native module compilation is a common source of "works on my machine, fails on reviewer's machine" — a JSON file has zero install risk. This is the kind of call AI won't make on its own without being pushed toward the deployment-reliability trade-off.
- **Scope cut on Markdown import**: the first draft of the upload flow tried to convert `.md` to formatted HTML; I deliberately simplified this to "plain paragraphs, no markdown parsing" and made sure the UI/README state that limitation clearly, rather than shipping a partially-correct markdown parser that might mangle some inputs during review.
- **Access control double-check**: I read through `repository.js` and the routes in `server.js` line by line to confirm permission checks happen server-side (not just hidden in the frontend) — e.g. that a `view`-only share genuinely gets rejected with a 403 on `PUT`, not just a disabled button in the UI that a curious reviewer could bypass by calling the API directly.
- **Test correctness**: I actually ran the test suite (`node --test`) rather than trusting that generated tests would pass — all 11 passed on the first run, and I read each assertion to confirm it tested something meaningful (e.g. that `getAccessibleDocument` returns `null` — not just an empty object — for a user with no access) rather than being a placeholder that always passes.
- **Caught a real bug from a manual edit, not from AI generation**: while adding a "delete document" feature after initial submission, an edit accidentally left the entire `DELETE /api/documents/:id` route commented out in `server.js`. The symptom was subtle — the frontend showed a generic "Request failed (404)" instead of the app's actual error message, which was the giveaway that the request wasn't hitting any route at all (Express's own default error page, not the app's JSON error handler). I diagnosed it by checking the exact response body in browser DevTools rather than guessing, confirmed the route was commented out by reading the file directly, and fixed it by uncommenting it and restarting the server.

## How I verified correctness, UX quality, and reliability

- **Automated**: ran `npm test` locally and confirmed all repository/access-control and file-import tests pass; syntax-checked every backend file with `node --check` before considering it done.
- **Manual walkthrough** (do this yourself before recording the video): log in as two different seeded users in two browser windows, create a document as one, share it with the other at both `view` and `edit` permission, and confirm the UI and the underlying API both enforce the difference — not just the UI.
- **Read every line of the access-control logic** (`repository.js`) myself rather than assuming AI-generated permission checks were correct — this is the one place where a subtle bug (e.g. checking `ownerId` but not checking shares, or vice versa) would be a real security/product bug, not just a cosmetic one.
- **Diagnosed a production-adjacent bug using DevTools, not assumption**: when a delete action failed, I didn't assume the cause — I opened the Network tab, inspected the actual request URL and response body, noticed the response was Express's default HTML 404 page rather than the app's JSON error format, and used that specific signal to conclude the route itself was missing rather than a permissions or data issue. This is the kind of debugging that matters more than the original code generation.

## What I'd flag to a reviewer about this process

The value of AI here was speed on well-understood boilerplate and a second pair of eyes on test coverage — not the product decisions (what to cut, which trade-offs to accept, how to word the limitations in the README). Those calls, and the final read-through of the access-control code, were the parts that actually mattered and weren't delegated.
