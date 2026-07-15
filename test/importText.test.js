// test/importText.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { textToBasicHtml, escapeHtml } = require('../importText');

test('textToBasicHtml wraps non-empty lines in paragraphs and skips blank lines', () => {
  const html = textToBasicHtml('Hello world\n\nSecond line');
  assert.equal(html, '<p>Hello world</p>\n<p>Second line</p>');
});

test('textToBasicHtml escapes HTML special characters', () => {
  const html = textToBasicHtml('<script>alert(1)</script>');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('escapeHtml handles quotes and ampersands', () => {
  assert.equal(escapeHtml(`Tom & Jerry's "show"`), 'Tom &amp; Jerry&#39;s &quot;show&quot;');
});

test('textToBasicHtml returns an empty paragraph for empty input', () => {
  assert.equal(textToBasicHtml('   \n  \n'), '<p></p>');
});
