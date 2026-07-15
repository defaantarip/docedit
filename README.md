# docedit

A lightweight collaborative document editor (Google-Docs-inspired), built as a scoped take-home exercise.

**Live demo:** `<ADD YOUR DEPLOYED URL HERE>`

## What this is

- Create, rename, edit, and reopen rich-text documents (bold/italic/underline, headings, bulleted/numbered lists)
- Upload a `.txt` or `.md` file to create a new document from it
- Share a document with another seeded user, with `view` or `edit` permission
- Everything persists to disk and survives a server restart / page refresh

## What this is NOT

- **No real-time / simultaneous co-editing.** Two people editing the same document at once will overwrite each other on save (last write wins). This was a deliberate scope cut — see `ARCHITECTURE.md`.
- **No real authentication.** You pick one of three seeded accounts (Alice, Bob, Carol) from a login screen. There are no passwords.
- **File import is plain-text only.** Uploading a `.md` file does **not** parse Markdown syntax into formatting — each line becomes a plain paragraph, which you can then format by hand in the editor. `.docx` is not supported.

## Tech stack

- **Backend:** Node.js + Express
- **Storage:** a single JSON file (`data/db.json`), read into memory and rewritten on every change. Chosen over SQLite/Postgres specifically so `npm install` never has to compile a native module — see `ARCHITECTURE.md` for the trade-offs.
- **Frontend:** plain HTML/CSS/JS (no build step), rich text via [Quill](https://quilljs.com/) loaded from a CDN
- **Tests:** Node's built-in test runner (`node:test`) — no extra test framework dependency

## Running locally

Requires Node.js 18+.

```bash
git clone <this repo>
cd docedit
npm install
npm start
```

Then open **https://docedit-x80b.onrender.com**.

You'll land on a login screen — click "Continue as Alice / Bob / Carol" to pick a seeded account. Use two different browser windows (or one normal + one incognito) logged in as two different users to try the sharing flow end-to-end.

### Running the tests

```bash
npm test
```

This runs unit tests against the access-control and file-import logic (`test/repository.test.js`, `test/importText.test.js`).

## Seeded accounts

| Name  | How to use               |
|-------|---------------------------|
| Alice | Pick from the login screen |
| Bob   | Pick from the login screen |
| Carol | Pick from the login screen |

No credentials needed — this is a simulated login for review convenience.

## Trying the sharing flow

1. Log in as Alice (in one browser window), create a document, type something.
2. Click **Share**, choose Bob, choose "Can view" or "Can edit", click "Grant access".
3. Open a second window (or incognito), log in as Bob.
4. The document appears under "Shared with me" on Bob's dashboard, with a badge showing his permission level.
5. If Bob has "Can edit", he can type and it saves. If "Can view", the editor is disabled for him.

## Project structure

```
docedit/
├── server.js          # Express app + all routes
├── db.js              # JSON file storage layer
├── repository.js       # Access-control + CRUD logic (unit tested)
├── importText.js       # .txt/.md → basic HTML conversion
├── public/              # Static frontend (no build step)
│   ├── login.html
│   ├── index.html       # dashboard
│   ├── editor.html
│   ├── api.js            # shared fetch helper
│   └── style.css
├── test/
│   ├── repository.test.js
│   └── importText.test.js
└── data/db.json          # created on first run
```

## Known limitations / what I'd build next

See the "What I'd build next" section of `SUBMISSION.md` for the prioritized list.

## Deployment note

This app is a single Node process serving both the API and the static frontend, with file-based storage — it deploys well to any plain Node host (Render, Railway, Fly.io, a small VPS). If deployed to a platform with an ephemeral filesystem (e.g. free-tier Render without a persistent disk), `data/db.json` will reset on redeploy/restart — acceptable for a review demo, called out here for transparency.
