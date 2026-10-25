import test from 'node:test';
import assert from 'node:assert/strict';

test('draftvalidatie weigert tekstverlies, lege vertaling en verkeerde bronkoppeling', async()=>{
 const {validateDraft}=await import('../scripts/import_drafts.mjs');
 const source={id:'bron',license:'CC-BY-SA-4.0',paragraphs:['אב גד','הו']};
 const chapter={id:'4a',passages:[{id:'g1',ref:'bavli:berakhot:4a:g1',original:'אב גד',nl:'Een volledige zin.',sourceId:'bron',sourceParagraph:1,translationStatus:'concept',layer:'gemara',notes:[]},{id:'g2',ref:'bavli:berakhot:4a:g2',original:'הו',nl:'Nog een zin.',sourceId:'bron',sourceParagraph:2,translationStatus:'concept',layer:'gemara',notes:[]}]};
 assert.doesNotThrow(()=>validateDraft(chapter,source));
 const reversed=structuredClone(chapter);reversed.passages.reverse();
 assert.throws(()=>validateDraft(reversed,source),'Omgekeerde bronvolgorde mag niet worden geïmporteerd');
 assert.throws(()=>validateDraft(chapter,source,'5a'),'De hoofdstukcode moet bij de gevraagde amud horen');
 for(const [field,value] of [['original','אב'],['nl',''],['sourceId','anders']]){
  const broken=structuredClone(chapter);broken.passages[0][field]=value;
  assert.throws(()=>validateDraft(broken,source));
 }
});
