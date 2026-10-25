import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const json = async path => JSON.parse(await read(path));
const sha = value => createHash('sha256').update(value).digest('hex');
const normalize = value => value.replace(/\s+/g, ' ').trim();

test('alle tractaten blijven zichtbaar, met afzonderlijke overlevering', async () => {
 const inventory = await json('data/inventory.json');
 assert.equal(inventory.mishnah.length, 63);
 for (const [id, expected] of [['bavli',37],['yerushalmi',39]]) {
  const rows = inventory.corpora.find(item => item.id === id).tractates;
  assert.equal(rows.length, 63);
  assert.equal(new Set(rows.map(item => item.id)).size, 63);
  assert.equal(rows.filter(item => item.gemara !== 'niet-overgeleverd').length, expected);
  assert.deepEqual(rows.map(item => item.id), inventory.mishnah.map(item => item.id));
 }
 assert.equal(inventory.corpora[0].tractates.find(t => t.id === 'shekalim').gemara, 'niet-overgeleverd');
 assert.equal(inventory.corpora[1].tractates.find(t => t.id === 'niddah').gemara, 'gedeeltelijk-overgeleverd');
});

test('ieder vertaald segment heeft unieke verwijzingen en een controleerbare bron', async () => {
 const library = await json('data/library.json');
 const sources = await json('data/sources.json');
 const ids = new Set();
 assert.ok(library.works.length > 0, 'de lezer bevat daadwerkelijke vertalingen');
 for (const work of library.works) for (const chapter of work.chapters) for (const p of chapter.passages) {
  const id = work.id + '/' + chapter.id + '/' + p.id;
  assert.ok(!ids.has(id)); ids.add(id);
  assert.ok(p.nl.trim() && p.original.trim());
  assert.ok(['mishnah','gemara'].includes(p.layer));
  assert.ok(['he','arc'].includes(p.lang));
  assert.equal(p.translationStatus, 'concept');
  assert.ok(p.ref.startsWith('bavli:berakhot:'));
  assert.ok(p.locator.startsWith('Berakhot ' + chapter.id));
  assert.ok(sources.sources.some(s => s.id === p.sourceId && s.license === 'CC-BY-SA-4.0'));
  assert.ok(Array.isArray(p.notes));
 }
});

test('Berakhot 2a is zonder verlies of toevoegingen gesegmenteerd', async () => {
 const library = await json('data/library.json');
 const source = await json('data/sources/wikisource-berakhot-2a.json');
 const passages = library.works[0].chapters.find(c => c.id === '2a').passages;
 assert.equal(source.paragraphs.length, 4);
 for (let i = 0; i < source.paragraphs.length; i++) {
  assert.equal(normalize(passages.filter(p => p.sourceParagraph === i+1).map(p => p.original).join(' ')), normalize(source.paragraphs[i]));
 }
 assert.equal(passages.filter(p => p.layer === 'mishnah').length, 4);
 assert.equal(passages.filter(p => p.layer === 'gemara').length, 8);
 assert.ok(passages.at(-1).notes.some(n => n.type === 'vervolg'));
});

test('bronsnapshots hebben de vastgelegde checksum en revisie', async () => {
 const sources = await json('data/sources.json');
 for (const source of sources.sources.filter(s => s.localPath)) {
  assert.equal(sha(await read(source.localPath)), source.sha256);
  assert.ok(source.url.includes('oldid='));
  assert.ok(source.attribution && source.licenseUrl);
 }
});

test('voortgang telt alleen aanwezige segmenten en claimt geen voltooiing', async () => {
 const library = await json('data/library.json');
 const progress = await json('data/progress.json');
 const inventory = await json('data/inventory.json');
 const p = library.works.flatMap(w => w.chapters.flatMap(c => c.passages));
 assert.equal(progress.translatedSegments, p.length);
 assert.equal(progress.independentlyReviewedSegments, 0);
 assert.equal(progress.corpusComplete, false);
 const units = inventory.corpora[0].tractates[0].units;
 assert.equal(units.length, 125);
 assert.equal(units[0].id, '2a'); assert.equal(units.at(-1).id, '64a');
 assert.equal(units.filter(u => u.translationStatus === 'concept').length, progress.translatedUnits);
 for (const unit of progress.units) {
  const passages = p.filter(p => p.ref.startsWith(unit.ref + ':'));
  assert.equal(unit.segments, passages.length);
  assert.equal(unit.translationSha256, sha(passages.map(p => p.nl).join('\n')+'\n'));
 }
});

test('Open Vertaling-basisstylesheet behoudt zijn herkomstchecksum', async () => {
 const source = await json('SOURCE.json');
 assert.equal(sha(await read('css/openvertaling.css')), source.sha256);
});

test('Berakhot 2b bevat de volledige hoofdtekst met blijvende brondekking', async () => {
 const library = await json('data/library.json');
 const chapter = library.works[0].chapters.find(c => c.id === '2b');
 assert.ok(chapter, 'de volgende amud is daadwerkelijk vertaald');
 const source = await json('data/sources/wikisource-berakhot-2b.json');
 assert.equal(source.revision, 2852504);
 assert.equal(source.paragraphs.length, 6);
 assert.equal(chapter.passages.length, 18);
 for (let i=0;i<source.paragraphs.length;i++)
  assert.equal(normalize(chapter.passages.filter(p=>p.sourceParagraph===i+1).map(p=>p.original).join(' ')), normalize(source.paragraphs[i]));
 assert.ok(chapter.passages.every(p=>p.layer==='gemara'));
 assert.ok(chapter.passages.at(-1).notes.some(n=>n.type==='vervolg'));
 const progress=await json('data/progress.json');
 assert.equal(progress.nextRef,'bavli:berakhot:3a');
 assert.equal(progress.translatedSegments,30);
});
