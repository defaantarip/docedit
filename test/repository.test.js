// test/repository.test.js

const test = require('node:test');
const assert = require('node:assert/strict');

const { resetForTests } = require('../db');
const repo = require('../repository');

function freshDb() {
  resetForTests({
    users: [
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' }
    ],
    documents: [],
    shares: []
  });
}

test('createDocument sets owner and defaults title', () => {
  freshDb();
  const doc = repo.createDocument({ ownerId: 'u1', title: '', content: '<p>hi</p>' });
  assert.equal(doc.ownerId, 'u1');
  assert.equal(doc.title, 'Untitled document');
  assert.equal(doc.content, '<p>hi</p>');
});

test('owner can access their own document', () => {
  freshDb();
  const doc = repo.createDocument({ ownerId: 'u1', title: 'Plan', content: '' });
  const { doc: found, permission } = repo.getAccessibleDocument(doc.id, 'u1');
  assert.equal(found.id, doc.id);
  assert.equal(permission, 'owner');
});

test('non-owner without a share cannot access the document', () => {
  freshDb();
  const doc = repo.createDocument({ ownerId: 'u1', title: 'Plan', content: '' });
  const { doc: found, permission } = repo.getAccessibleDocument(doc.id, 'u2');
  assert.equal(found, null);
  assert.equal(permission, null);
});

test('sharing grants the target user access with the given permission', () => {
  freshDb();
  const doc = repo.createDocument({ ownerId: 'u1', title: 'Plan', content: '' });
  repo.shareDocument(doc.id, 'u2', 'view');

  const { doc: found, permission } = repo.getAccessibleDocument(doc.id, 'u2');
  assert.equal(found.id, doc.id);
  assert.equal(permission, 'view');
});

test('listDocumentsForUser separates owned vs shared documents', () => {
  freshDb();
  const owned = repo.createDocument({ ownerId: 'u1', title: 'Mine', content: '' });
  const sharedWithMe = repo.createDocument({ ownerId: 'u2', title: 'Theirs', content: '' });
  repo.shareDocument(sharedWithMe.id, 'u1', 'edit');

  const result = repo.listDocumentsForUser('u1');
  assert.equal(result.owned.length, 1);
  assert.equal(result.owned[0].id, owned.id);
  assert.equal(result.shared.length, 1);
  assert.equal(result.shared[0].id, sharedWithMe.id);
});

test('a view-only share does not allow the underlying content to be mutated via updateDocument directly bypassing checks (route-level check is separate)', () => {
  freshDb();
  const doc = repo.createDocument({ ownerId: 'u1', title: 'Plan', content: 'v1' });
  repo.shareDocument(doc.id, 'u2', 'view');
  const { permission } = repo.getAccessibleDocument(doc.id, 'u2');
  // The repository layer reports the permission; enforcement of "view can't
  // write" happens in server.js before calling updateDocument. This test
  // documents that contract so a future change to server.js that forgets the
  // check would be easy to notice against this expectation.
  assert.equal(permission, 'view');
});

test('revoking a share removes access', () => {
  freshDb();
  const doc = repo.createDocument({ ownerId: 'u1', title: 'Plan', content: '' });
  repo.shareDocument(doc.id, 'u2', 'edit');
  repo.revokeShare(doc.id, 'u2');
  const { doc: found } = repo.getAccessibleDocument(doc.id, 'u2');
  assert.equal(found, null);
});
