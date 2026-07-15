// repository.js
// -----------------------------------------------------------------------------
// All access-control and CRUD logic lives here, separate from HTTP routing, so
// it can be unit tested without spinning up an Express server (see
// test/repository.test.js).
// -----------------------------------------------------------------------------
const crypto = require('crypto');
const { getData, persist } = require('./db');

function findUser(userId) {
  return getData().users.find(u => u.id === userId) || null;
}

function listUsers() {
  return getData().users;
}

// Returns { owned: [...], shared: [...] } documents visible to a user.
function listDocumentsForUser(userId) {
  const { documents, shares } = getData();
  const owned = documents.filter(d => d.ownerId === userId);
  const sharedDocIds = new Set(
    shares.filter(s => s.userId === userId).map(s => s.documentId)
  );
  const shared = documents.filter(d => sharedDocIds.has(d.id) && d.ownerId !== userId);
  return { owned, shared };
}

// Returns the document if the user may access it (owner or has a share),
// otherwise null. Also returns the effective permission ('owner' | 'edit' | 'view').
function getAccessibleDocument(docId, userId) {
  const { documents, shares } = getData();
  const doc = documents.find(d => d.id === docId);
  if (!doc) return { doc: null, permission: null };

  if (doc.ownerId === userId) {
    return { doc, permission: 'owner' };
  }
  const share = shares.find(s => s.documentId === docId && s.userId === userId);
  if (share) {
    return { doc, permission: share.permission }; // 'edit' or 'view'
  }
  return { doc: null, permission: null };
}

function createDocument({ ownerId, title, content }) {
  const data = getData();
  const doc = {
    id: crypto.randomUUID(),
    ownerId,
    title: title && title.trim() ? title.trim() : 'Untitled document',
    content: content || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.documents.push(doc);
  persist();
  return doc;
}

// Returns null if not found/not permitted; the update is only applied if the
// caller already confirmed permission via getAccessibleDocument.
function updateDocument(docId, updates) {
  const data = getData();
  const doc = data.documents.find(d => d.id === docId);
  if (!doc) return null;
  if (typeof updates.title === 'string' && updates.title.trim()) {
    doc.title = updates.title.trim();
  }
  if (typeof updates.content === 'string') {
    doc.content = updates.content;
  }
  doc.updatedAt = new Date().toISOString();
  persist();
  return doc;
}

function deleteDocument(docId) {
  const data = getData();
  const before = data.documents.length;
  data.documents = data.documents.filter(d => d.id !== docId);
  data.shares = data.shares.filter(s => s.documentId !== docId);
  persist();
  return data.documents.length < before;
}

function listSharesForDocument(docId) {
  return getData().shares.filter(s => s.documentId === docId);
}

// Grants or updates a share. Returns the share record.
function shareDocument(docId, targetUserId, permission) {
  const data = getData();
  let share = data.shares.find(s => s.documentId === docId && s.userId === targetUserId);
  if (share) {
    share.permission = permission;
  } else {
    share = { id: crypto.randomUUID(), documentId: docId, userId: targetUserId, permission };
    data.shares.push(share);
  }
  persist();
  return share;
}

function revokeShare(docId, targetUserId) {
  const data = getData();
  const before = data.shares.length;
  data.shares = data.shares.filter(
    s => !(s.documentId === docId && s.userId === targetUserId)
  );
  persist();
  return data.shares.length < before;
}

module.exports = {
  findUser,
  listUsers,
  listDocumentsForUser,
  getAccessibleDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  listSharesForDocument,
  shareDocument,
  revokeShare
};
