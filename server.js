// server.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const repo = require('./repository');
const { textToBasicHtml, SUPPORTED_EXTENSIONS } = require('./importText');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- multer setup for file upload -----------------------------------------
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB — plenty for .txt/.md demo files
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Unsupported file type "${ext}". Only .txt and .md are supported.`));
    }
    cb(null, true);
  }
});

// ---- "auth" middleware ------------------------------------------------------
function requireUser(req, res, next) {
  const userId = req.header('x-user-id');
  if (!userId) {
    return res.status(401).json({ error: 'Missing x-user-id header. Log in first.' });
  }
  const user = repo.findUser(userId);
  if (!user) {
    return res.status(401).json({ error: 'Unknown user id.' });
  }
  req.user = user;
  next();
}

// ---- routes ------------------------------------------------------------

app.get('/api/users', (req, res) => {
  res.json(repo.listUsers());
});

app.get('/api/documents', requireUser, (req, res) => {
  const { owned, shared } = repo.listDocumentsForUser(req.user.id);
  res.json({ owned, shared });
});

app.post('/api/documents', requireUser, (req, res) => {
  const { title, content } = req.body || {};
  if (content !== undefined && typeof content !== 'string') {
    return res.status(400).json({ error: 'content must be a string' });
  }
  const doc = repo.createDocument({ ownerId: req.user.id, title, content });
  res.status(201).json(doc);
});

app.get('/api/documents/:id', requireUser, (req, res) => {
  const { doc, permission } = repo.getAccessibleDocument(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found or access denied.' });
  res.json({ ...doc, permission });
});

app.put('/api/documents/:id', requireUser, (req, res) => {
  const { doc, permission } = repo.getAccessibleDocument(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found or access denied.' });
  if (permission === 'view') {
    return res.status(403).json({ error: 'You have view-only access to this document.' });
  }
  const { title, content } = req.body || {};
  if (title !== undefined && typeof title !== 'string') {
    return res.status(400).json({ error: 'title must be a string' });
  }
  if (content !== undefined && typeof content !== 'string') {
    return res.status(400).json({ error: 'content must be a string' });
  }
  const updated = repo.updateDocument(doc.id, { title, content });
  res.json(updated);
});

app.delete('/api/documents/:id', requireUser, (req, res) => {
  const { doc, permission } = repo.getAccessibleDocument(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found or access denied.' });
  if (permission !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can delete this document.' });
  }
  repo.deleteDocument(doc.id);
  res.status(204).end();
});


app.delete('/api/documents/:id/shares/:userId', requireUser, (req, res) => {
  const { doc, permission } = repo.getAccessibleDocument(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found or access denied.' });

  // Two allowed cases: (1) the owner revoking anyone's access, or
  // (2) a shared user removing their own access ("leave this document").
  const isSelfRemoving = req.params.userId === req.user.id;
  if (permission !== 'owner' && !isSelfRemoving) {
    return res.status(403).json({ error: 'Only the owner can modify sharing for other users.' });
  }
  repo.revokeShare(doc.id, req.params.userId);
  res.status(204).end();
});


// ---- sharing -----------------------------------------------------------

app.get('/api/documents/:id/shares', requireUser, (req, res) => {
  const { doc, permission } = repo.getAccessibleDocument(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found or access denied.' });
  if (permission !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can view share settings.' });
  }
  const shares = repo.listSharesForDocument(doc.id).map(s => ({
    ...s,
    user: repo.findUser(s.userId)
  }));
  res.json(shares);
});

app.post('/api/documents/:id/shares', requireUser, (req, res) => {
  const { doc, permission } = repo.getAccessibleDocument(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found or access denied.' });
  if (permission !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can share this document.' });
  }
  const { targetUserId, permission: sharePermission } = req.body || {};
  if (!targetUserId || !repo.findUser(targetUserId)) {
    return res.status(400).json({ error: 'targetUserId must reference an existing user.' });
  }
  if (targetUserId === doc.ownerId) {
    return res.status(400).json({ error: 'Cannot share a document with its own owner.' });
  }
  if (!['view', 'edit'].includes(sharePermission)) {
    return res.status(400).json({ error: 'permission must be "view" or "edit".' });
  }
  const share = repo.shareDocument(doc.id, targetUserId, sharePermission);
  res.status(201).json(share);
});

app.delete('/api/documents/:id/shares/:userId', requireUser, (req, res) => {
  const { doc, permission } = repo.getAccessibleDocument(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: 'Document not found or access denied.' });
  if (permission !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can modify sharing.' });
  }
  repo.revokeShare(doc.id, req.params.userId);
  res.status(204).end();
});

// ---- file upload -> new document ----------------------------------------

app.post('/api/upload', requireUser, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided.' });
    }
    let rawText;
    try {
      rawText = fs.readFileSync(req.file.path, 'utf-8');
    } catch (readErr) {
      return res.status(500).json({ error: 'Failed to read uploaded file.' });
    } finally {
      // Clean up the temp upload; content is copied into the document store.
      fs.unlink(req.file.path, () => {});
    }
    const html = textToBasicHtml(rawText);
    const title = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const doc = repo.createDocument({ ownerId: req.user.id, title, content: html });
    res.status(201).json(doc);
  });
});

// ---- fallback + error handling ------------------------------------------

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handler (e.g. multer errors thrown outside the callback,
// unexpected JSON parse errors, etc.)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`docedit server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
