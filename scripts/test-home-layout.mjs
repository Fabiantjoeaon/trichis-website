import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedNumber, projectRows } from '../src/lib/home-layout.js';

const projects = [
  { slug: 'first', featured: true, featuredOrder: 2 },
  { slug: 'second', featured: true, featuredOrder: 1 },
  { slug: 'other', featured: false },
];

test('editor rows preserve order, repeats, and non-featured project selections', () => {
  const rows = projectRows([{ projectSlug: 'other', width: 40, alignment: 'right' },
    { projectSlug: 'first' }, { projectSlug: 'other' }], projects);
  assert.deepEqual(rows.map((r) => r.project.slug), ['other', 'first', 'other']);
  assert.equal(rows[0].width, 40);
  assert.equal(rows[0].alignment, 'right');
});

test('unpublished or deleted selections are omitted without substituting featured work', () => {
  assert.deepEqual(projectRows([{ projectSlug: 'deleted' }], projects), []);
});

test('unconfigured rows fall back to featured order without mutating project data', () => {
  assert.deepEqual(projectRows([], projects).map((r) => r.project.slug), ['second', 'first']);
  assert.equal(projects[0].slug, 'first');
  assert.deepEqual(projectRows(undefined, []), []);
});

test('CMS numeric settings are bounded and missing values use a fallback', () => {
  for (const value of [undefined, null, '', 'invalid', Infinity]) assert.equal(boundedNumber(value, 66, 20, 100), 66);
  assert.equal(boundedNumber(-10, 66, 20, 100), 20);
  assert.equal(boundedNumber('120', 66, 20, 100), 100);
  assert.equal(boundedNumber('40', 66, 20, 100), 40);
  assert.equal(boundedNumber(0, 10, -180, 180), 0);
});
