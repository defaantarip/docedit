# SUBMISSION.md

Quick-reference checklist for reviewers, mirroring the assignment's deliverables list exactly. Fill in the bracketed items before submitting.

## Deliverables checklist

| Item | Status | Notes |
|---|---|---|
| Source code | ✅ Included | This repository |
| `README.md` with local setup/run instructions | ✅ Included | See `README.md` |
| Architecture note | ✅ Included | See `ARCHITECTURE.md` |
| AI workflow note | ✅ Included | See `AI_WORKFLOW.md` — **personalize before submitting** |
| `SUBMISSION.md` | ✅ Included | This file |
| Live product URL | ⬜ **`<ADD DEPLOYED URL>`** | Deploy per the note in `README.md` |
| Walkthrough video URL (text file) | ⬜ **`<ADD LINK — see VIDEO_URL.txt>`** | 3–5 min, unlisted Loom/YouTube |
| Screenshots / demo GIF | ⬜ Optional | Only needed if setup requires extra steps beyond `npm install && npm start` — it doesn't, so likely skippable |
| Seeded users / test accounts | ✅ Included | Alice, Bob, Carol — pick from the login screen, no password |

## Feature checklist (from the assignment's "Tasks" section)

| Feature | Status | Notes |
|---|---|---|
| Create a new document | ✅ Working | Dashboard → "+ New document" |
| Rename a document | ✅ Working | Title field in the editor, autosaves |
| Edit content in-browser | ✅ Working | Quill rich-text editor |
| Save and reopen | ✅ Working | Autosaves ~600ms after you stop typing; persists across refresh/restart |
| Bold / Italic / Underline | ✅ Working | Toolbar |
| Headings / text size | ✅ Working | H1–H3 + normal, via toolbar dropdown |
| Bulleted / numbered lists | ✅ Working | Toolbar |
| File upload → new document | ✅ Working | `.txt` and `.md` only; imported as plain paragraphs (markdown syntax not parsed — stated in UI/README) |
| Document owner | ✅ Working | Set at creation |
| Grant another user access | ✅ Working | Share modal, `view` or `edit` permission |
| Visible owned vs. shared distinction | ✅ Working | Dashboard splits into two sections; shared docs show a permission badge |
| Persistence across refresh | ✅ Working | JSON file store on disk |
| Formatting preserved | ✅ Working | Content stored as HTML |
| Shared access demonstrable | ✅ Working | See "Trying the sharing flow" in `README.md` |
| Setup/run instructions | ✅ Included | `README.md` |
| Working deployment | ⬜ **https://docedit-x80b.onrender.com** | |
| Validation and error handling | ✅ Working | Server returns 400/401/403/404 with messages; frontend surfaces them in an error banner |
| At least one automated test | ✅ Included, exceeded | 11 tests across `test/repository.test.js` and `test/importText.test.js`, run with `npm test` |
| Architecture note | ✅ Included | `ARCHITECTURE.md` |
| Delete document (owner) + leave shared document | ✅ Working | × button on dashboard with confirmation modal; owner-delete cascades to all shares |

## What is incomplete / explicitly out of scope

- No real-time simultaneous co-editing (last write wins on save)
- No real authentication (simulated login via seeded users)
- No `.docx` upload support (only `.txt` / `.md`)
- Markdown syntax is not parsed into formatting on import (imported as plain paragraphs)

Full reasoning for each of these is in `ARCHITECTURE.md`.

## What I'd build next with another 2–4 hours

See the corresponding section at the end of `ARCHITECTURE.md` — kept in one place to avoid duplication/drift between documents.

