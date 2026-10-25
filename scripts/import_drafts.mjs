import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const json=async path=>JSON.parse(await read(path));
const write=(path,value)=>writeFile(new URL(path,root),JSON.stringify(value,null,2)+'\n','utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const normalized=value=>value.replace(/\s+/g,' ').trim();

export function validateDraft(chapter,source,expectedAmud=chapter.id){
 assert.equal(chapter.id,expectedAmud,'Verkeerde amudcode');
 assert.equal(source.license,'CC-BY-SA-4.0');
 assert.ok(chapter.passages.length>0);
 const ids=new Set();
 let previousParagraph=0;
 for(const p of chapter.passages){
  assert.ok(!ids.has(p.id),'Dubbel segment '+chapter.id+'/'+p.id);ids.add(p.id);
  assert.equal(p.ref,'bavli:berakhot:'+chapter.id+':'+p.id);
  assert.ok(p.nl.trim(),'Lege vertaling '+p.ref);
  assert.equal(p.sourceId,source.id);
  assert.ok(Number.isInteger(p.sourceParagraph)&&p.sourceParagraph>=1&&p.sourceParagraph<=source.paragraphs.length);
  assert.ok(p.sourceParagraph>=previousParagraph,'Verkeerde bronvolgorde');
  previousParagraph=p.sourceParagraph;
  assert.ok(['mishnah','gemara'].includes(p.layer));
  assert.equal(p.translationStatus,'concept');
  assert.ok(Array.isArray(p.notes));
 }
 for(let i=0;i<source.paragraphs.length;i++){
  const passages=chapter.passages.filter(p=>p.sourceParagraph===i+1);
  assert.equal(normalized(passages.map(p=>p.original).join(' ')),normalized(source.paragraphs[i]),'Bronverlies '+chapter.id+' alinea '+(i+1));
 }
}

export async function importDrafts(){
 const library=await json('data/library.json');
 const inventory=await json('data/inventory.json');
 const sources=await json('data/sources.json');
 const progress=await json('data/progress.json');
 const extent=await json('data/extent.json');
 const work=library.works.find(w=>w.id==='bavli-berakhot');
 const tractate=inventory.corpora.find(c=>c.id==='bavli').tractates.find(t=>t.id==='berakhot');
 const files=new Set(await readdir(new URL('data/drafts/',root)));
 const acquired=new Map();
 for(const name of await readdir(new URL('data/sources/',root))){
  if(!/^wikisource-berakhot-\d+[ab]\.json$/.test(name))continue;
  const path='data/sources/'+name;
  const source=await json(path);
  const amud=name.match(/-(\d+[ab])\.json$/)[1];
  acquired.set(amud,source);
  const previous=sources.sources.find(s=>s.id===source.id);
  const entry={...source,paragraphs:undefined,localPath:path,sha256:sha(await read(path)),status:'verworven',changes:previous?.changes||'Hoofdtekst zonder commentaren verworven; varianten behouden. Een gekoppelde Nederlandse conceptvertaling wordt afzonderlijk gevalideerd.'};
  if(previous)Object.assign(previous,entry);else sources.sources.push(entry);
 }
 const present=new Set(work.chapters.map(c=>c.id));
 const imported=[];
 for(const unit of tractate.units){
  if(present.has(unit.id))continue;
  const name='berakhot-'+unit.id+'.json';
  if(!files.has(name))break;
  const chapter=await json('data/drafts/'+name);
  const source=acquired.get(unit.id);
  assert.ok(source,'Geen bron voor '+unit.id);
  validateDraft(chapter,source,unit.id);
  work.chapters.push(chapter);present.add(unit.id);imported.push(unit.id);
 }
 const order=new Map(tractate.units.map((u,i)=>[u.id,i]));
 work.chapters.sort((a,b)=>order.get(a.id)-order.get(b.id));
 const next=tractate.units.find(u=>!present.has(u.id));
 for(let i=0;i<work.chapters.length;i++){
  const chapter=work.chapters[i];
  const previous=work.chapters[i-1],following=work.chapters[i+1];
  chapter.previousAvailable=previous?.id||null;
  chapter.nextAvailable=following?.id||null;
  if(following)for(const p of chapter.passages)for(const note of p.notes){
   if(note.type==='vervolg')note.text=note.text.replace(/Die voortzetting is nog niet vertaald\./g,'Het volgende beschikbare gedeelte staat onder “Volgend gedeelte”.').replace(/die voortzetting is nog niet vertaald\./g,'het volgende beschikbare gedeelte staat onder “Volgend gedeelte”.');
  }
 }
 progress.units=work.chapters.map(chapter=>{
  const old=progress.units.find(u=>u.ref==='bavli:berakhot:'+chapter.id);
  return {...old,ref:'bavli:berakhot:'+chapter.id,status:'concept',sourceId:chapter.passages[0].sourceId,segments:chapter.passages.length,mishnahSegments:chapter.passages.filter(p=>p.layer==='mishnah').length,gemaraSegments:chapter.passages.filter(p=>p.layer==='gemara').length,sourceCoverage:'Volledige hoofdtekst van '+chapter.id+' in de gekozen editie; geen latere commentaren.',translationSha256:sha(chapter.passages.map(p=>p.nl).join('\n')+'\n'),checks:old?.checks||['Volledige bronalinea’s gekoppeld aan Nederlandse conceptvertaling.','Brondekking, unieke verwijzingen en rechten technisch gecontroleerd.'],independentReview:old?.independentReview||null};
 });
 progress.translatedUnits=work.chapters.length;
 progress.totalAcquiredUnits=acquired.size;
 progress.translatedSegments=work.chapters.reduce((n,c)=>n+c.passages.length,0);
 progress.nextRef=next?.ref||'bavli:shabbat:2a';
 progress.nextLabel=next?'Berakhot '+next.id:'Sjabbat 2a';
 progress.completeTractates=next?0:1;
 progress.remaining=(next?'Berakhot '+next.id+'–64a ('+(tractate.units.length-work.chapters.length)+' amudim), ':'')+'de overige Babylonische tractaten, de gehele Jeruzalemse Talmoed en de overige zelfstandige Misjna-teksten. Onafhankelijke inhoudelijke eindcontrole staat nog open.';
 progress.extent={manifest:'data/extent.json',unit:extent.unit,denominator:extent.denominator,translatedWholeUnits:work.chapters.length,percent:100*work.chapters.length/extent.denominator,onePercentThreshold:extent.onePercentThresholdWholeAmudim,targetReached:work.chapters.length>=extent.onePercentThresholdWholeAmudim,limitation:'Percentage vastgezette editiegebonden amudplaatsen van beide Talmoeds; geen woordpercentage en geen afzonderlijke Misjna-telling.'};
 for(const unit of tractate.units){
  const chapter=work.chapters.find(c=>c.id===unit.id);
  unit.sourceStatus=acquired.has(unit.id)?'verworven':'niet-verworven';
  unit.translationStatus=chapter?'concept':'niet-begonnen';
  unit.translatedSegments=chapter?.passages.length||0;
 }
 tractate.importedSegments=progress.translatedSegments;
 tractate.translatedSegments=progress.translatedSegments;
 tractate.translationStatus=next?'concept-deel':'concept-volledig';
 for(const corpus of inventory.corpora)for(const t of corpus.tractates){
  const measured=extent.tractates.find(e=>e.corpus===corpus.id&&e.tractate===t.id);
  if(measured)t.extentSlots=measured.amudCount;
 }
 sources.candidates[0].decision='Basis voor verwerving in kleine delen. De daadwerkelijk verworven bronextracten staan in het bronnenregister; overige links zijn vindplaatsen.';
 await write('data/library.json',library);
 await write('data/inventory.json',inventory);
 await write('data/sources.json',sources);
 await write('data/progress.json',progress);
 const first=work.chapters[0].id,last=work.chapters.at(-1).id;
 const status='# Vertaalstatus\n\nConceptvertaling: **Berakhot '+first+'–'+last+'**, '+progress.translatedUnits+' volledige amudim en '+progress.translatedSegments+' gekoppelde segmenten.\n\n**'+progress.extent.percent.toLocaleString('nl-NL',{minimumFractionDigits:3,maximumFractionDigits:3})+'% van de vastgezette drukzijden van beide Talmoeds** ('+progress.translatedUnits+' / '+extent.denominator+'). De 1%-grens is '+extent.onePercentThresholdWholeAmudim+' volledige zijden. Dit is geen woordpercentage en telt zelfstandige Misjna niet extra mee. Zie [omvangstelling](omvangstelling.md).\n\nOnafhankelijke inhoudelijke eindcontrole: **0 segmenten**. Volledig vertaald tractaat: '+progress.completeTractates+'. Het volledige corpus is niet vertaald.\n\nVolgende passage: **'+progress.nextLabel+'**.\n\nResterend: '+progress.remaining+'\n\nTechnische brondekking en checksums staan in [het voortgangsregister](../data/progress.json); licenties en vaste revisies staan in [het bronnenregister](../data/sources.json). De grondtekst, vertaling, toelichting en onzekere lezingen blijven per segment gekoppeld.\n';
 await writeFile(new URL('docs/status.md',root),status,'utf8');
 console.log(JSON.stringify({imported,translatedUnits:progress.translatedUnits,segments:progress.translatedSegments,percent:progress.extent.percent,next:progress.nextLabel}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])await importDrafts();
