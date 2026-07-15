# Architecture Note

## Priorities, in order

1. **A fully working edit → save → reload loop.** This is the core of the product; nothing else matters if this is flaky.
2. **Sharing with real access control**, not just a cosmetic "shared" label — permissions are checked server-side on every read/write, not just hidden in the UI.
3. **A working, honestly-scoped file upload**, rather than a broad one that half-works.
4. Polish, extra formatting options, and anything "nice to have" came last and were cut first when time ran short.

## Stack choices and why

- **Storage: a single JSON file, not SQLite/Postgres.** For this scope (a handful of demo documents, single server process, no concurrent-write requirements beyond what a small app needs), a JSON file avoids two real risks under a time-boxed exercise: (a) native module compilation (e.g. `better-sqlite3`) failing on a reviewer's machine, and (b) migration/schema tooling that adds setup steps for no real benefit here. The trade-off is real: no transactions, no query language, everything loaded into memory, and no protection against two processes writing at once. That's an explicit and acceptable trade-off at this scale — the README says so.
- **Frontend: plain HTML/JS, no framework or bundler.** A build step (Vite/webpack/CRA) adds a category of failure (build config, missing deps, dev-server ports) that isn't worth the risk here, and a small multi-page app doesn't need React's data-binding to stay readable. Quill is loaded from a CDN so there's no editor library to install or configure.
- **Backend: Express.** The most boring, well-understood choice available; boring is a feature under time pressure.
- **Auth: simulated.** A seeded-user picker with an `x-user-id` header stands in for real auth. Building real signup/login/sessions was judged lower value than spending that time on the editing/sharing/upload logic the brief weights explicitly.

## Data model

```
users:      { id, name }
documents:  { id, ownerId, title, content (HTML string), createdAt, updatedAt }
shares:     { id, documentId, userId, permission: 'view' | 'edit' }
```

Access rule, enforced in `repository.getAccessibleDocument` and re-checked on every route:
- Owner → full access (`permission: 'owner'`)
- User with a `shares` row for that document → `view` or `edit` as recorded
- Otherwise → `404` (not `403`) so a non-owner can't even confirm a document ID exists

## What was cut, and why

| Cut | Reason |
|---|---|
| Real-time / simultaneous co-editing (live cursors, CRDTs/OT) | By far the largest single feature in "Google Docs." The brief asks for editing + sharing + persistence, not live collaboration. Building a correct CRDT-based sync layer is a multi-day problem on its own; attempting a shallow version (e.g. naive polling) would have looked worse than not attempting it and saying so. |
| Real authentication | Adds real complexity (password hashing, sessions, CSRF) with no signal for this exercise's evaluation criteria. Simulated login keeps the reviewer's setup to zero credentials. |
| `.docx` upload support | Requires a parsing library and more edge-case handling than `.txt`/`.md`; time was better spent making sharing and access control solid. |
| Markdown → HTML formatting on import | Parsing markdown syntax (headings, bold, lists) into Quill-compatible HTML is doable but non-trivial to get exactly right; instead the file's raw lines become plain paragraphs, and the user re-applies formatting in the editor. Stated clearly in the UI and README rather than silently under-delivering. |
| Version history / undo beyond the browser's native undo | Not mentioned in the brief; adding it would have taken time from core requirements. |

## What I'd build next with 2-4 more hours

1. Wire up the delete-document UI (backend already supports it).
2. Debounced conflict warning: if the document's `updatedAt` changed on the server since the editor last loaded it, warn the user before overwriting (cheap improvement given the "last write wins" limitation).
3. Real Markdown parsing on import using a small library (e.g. `marked`), converting to Quill-compatible HTML.
4. A "recently shared with you" notification or activity indicator, since right now a shared document just quietly appears in the list.
5. Basic rate limiting / request size limits hardening beyond the current 1MB upload cap and 2MB JSON body cap.
