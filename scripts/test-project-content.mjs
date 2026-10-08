import test from 'node:test';
import assert from 'node:assert/strict';
import { convertMultiParagraphToNineFormat } from '../src/lib/cms.js';

test('WYSIWYG paragraph alignment survives splitting without losing inline markup', () => {
  const [block] = convertMultiParagraphToNineFormat('<p style="text-align: center"><strong>Ons verhaal</strong> met <a href="/contact">een link</a>.</p>');
  assert.equal(block.textAlign, 'center');
  assert.equal(block.tag, 'p');
  assert.match(block.text, /<strong>Ons verhaal<\/strong>/);
  assert.match(block.text, /href="\/contact"/);
  assert.equal(block.html, true);
});

test('a quote retains its paragraph and attribution and supports a scroll entrance', () => {
  const blocks = convertMultiParagraphToNineFormat('<blockquote style="text-align: center"><p>Een goed verhaal.</p><cite>Naam van de klant</cite></blockquote>');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].tag, 'blockquote');
  assert.equal(blocks[0].textAlign, 'center');
  assert.match(blocks[0].text, /<cite>Naam van de klant<\/cite>/);
  assert.equal(blocks[0].static, false);
});

test('ordinary paragraphs and lists keep their existing formatting', () => {
  const blocks = convertMultiParagraphToNineFormat('<p>Eerste alinea.</p><ul><li>Eerste punt</li><li>Tweede punt</li></ul>');
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].textAlign, undefined);
  assert.equal(blocks[1].static, true);
  assert.equal(blocks[1].tag, 'ul');
});
