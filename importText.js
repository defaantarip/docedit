// importText.js
// -----------------------------------------------------------------------------
// Deliberately minimal file import: supports .txt and .md only, and does NOT
// parse markdown syntax into rich formatting. Each non-empty line becomes a
// paragraph in the new document; the raw text is preserved and the user can
// then apply real formatting in the editor. This is a stated scope cut — see
// README.md and ARCHITECTURE.md. Full markdown parsing (headings, bold,
// lists) was left out to protect time for editing/sharing, which are the
// core-weighted features.
// -----------------------------------------------------------------------------

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textToBasicHtml(rawText) {
  const lines = rawText.split(/\r?\n/);
  const paragraphs = lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${escapeHtml(line)}</p>`);
  return paragraphs.length ? paragraphs.join('\n') : '<p></p>';
}

const SUPPORTED_EXTENSIONS = ['.txt', '.md'];

module.exports = { textToBasicHtml, escapeHtml, SUPPORTED_EXTENSIONS };
