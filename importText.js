// importText.js

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
