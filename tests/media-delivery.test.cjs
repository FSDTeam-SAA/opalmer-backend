const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { withFileDelivery } = require('../src/utils/mediaDelivery');

test('file responses provide delivery links without changing stored URLs or document metadata', () => {
  const url = 'https://res.cloudinary.com/our-cloud/raw/upload/v123/class/worksheet.pdf';
  const original = { file: [{ public_id: 'class/worksheet.pdf', url }], date: new Date('2026-11-15') };
  const calls = [];
  const delivered = withFileDelivery(original, 'our-cloud', id => { calls.push(id); return 'signed-download'; });
  assert.deepEqual(calls, ['class/worksheet.pdf']);
  assert.equal(delivered.file[0].downloadUrl, 'signed-download');
  assert.equal(delivered.file[0].url, url);
  assert.equal(original.file[0].downloadUrl, undefined);
  assert.equal(delivered.date, '2026-11-15T00:00:00.000Z');
});

test('external hosts, other accounts, private assets and images are never signed as raw uploads', () => {
  const files = [
    'https://res.cloudinary.com/other-cloud/raw/upload/v1/a.pdf',
    'https://res.cloudinary.com.evil.test/our-cloud/raw/upload/v1/a.pdf',
    'https://example.com/a.pdf',
    'https://res.cloudinary.com/our-cloud/image/upload/v1/a.png',
    'https://res.cloudinary.com/our-cloud/raw/authenticated/v1/a.pdf',
  ].map(url => ({ url }));
  let signed = 0;
  assert.deepEqual(withFileDelivery(files, 'our-cloud', () => { signed++; return 'unexpected'; }), files);
  assert.equal(signed, 0);
});

test('direct Express JSON responses also provide file delivery without a response-helper dependency', async () => {
  const express = require('express');
  const { fileDeliveryReplacer } = require('../src/utils/mediaDelivery');
  const app = express();
  app.set('json replacer', fileDeliveryReplacer('our-cloud', id => 'signed:' + id));
  app.get('/', (_req, res) => res.json({ data: { file: { url: 'https://res.cloudinary.com/our-cloud/raw/upload/v12/help.pdf' } } }));
  const server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)); });
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port);
    assert.equal((await response.json()).data.file.downloadUrl, 'signed:help.pdf');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
