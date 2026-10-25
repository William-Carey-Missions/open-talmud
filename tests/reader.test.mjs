import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = new URL('../', import.meta.url);
const progress = JSON.parse(await readFile(new URL('data/progress.json',base),'utf8'));
const library = JSON.parse(await readFile(new URL('data/library.json',base),'utf8'));
const latest = library.works[0].chapters.at(-1);
const types = {html:'text/html',js:'text/javascript',json:'application/json',css:'text/css',woff2:'font/woff2',svg:'image/svg+xml'};
let server, browser, origin;
test.before(async () => {
 server = createServer(async (req,res) => {
  try {
   const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'') || 'index.html';
   if (path.includes('..')) { res.writeHead(403).end(); return; }
   const body = await readFile(new URL(path,base));
   res.writeHead(200,{'Content-Type':types[path.split('.').at(-1)]||'application/octet-stream'}).end(body);
  } catch { res.writeHead(404).end(); }
 });
 await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
 origin = 'http://127.0.0.1:'+server.address().port;
 browser = await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {channel:process.env.BROWSER_CHANNEL || 'msedge'})});
});
test.after(async () => { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); });
test('lezer toont tekstlaag, toelichting, bron en conceptstatus', async () => {
 const page=await browser.newPage();
 try {
  await page.goto(origin+'/#lezen/bavli-berakhot/2a/g7');
  await page.locator('.passage').first().waitFor();
  assert.equal(await page.locator('.passage').count(),12);
  assert.match(await page.locator('#passage-g7').innerText(),/verzoeningsoffer/);
  assert.match(await page.locator('#passage-g7').innerText(),/Toelichting/);
  assert.match(await page.locator('#passage-g8').innerText(),/2b/);
  assert.match(await page.locator('#reader-status').innerText(),/concept/i);
  assert.ok((await page.locator('#reader-source a').first().getAttribute('href')).includes('oldid=3006896'));
 } finally { await page.close(); }
});
test('inventaris houdt beide corpora en ontbrekende Gemara zichtbaar', async () => {
 const page=await browser.newPage();
 try {
  await page.goto(origin+'/#inventaris');
  await page.waitForFunction(()=>document.querySelectorAll('#inventory-tables tbody tr').length===126,{},{timeout:3000});
  assert.match(await page.locator('#inventory-summary').innerText(),/37/);
  assert.match(await page.locator('#inventory-summary').innerText(),/39/);
  assert.match(await page.locator('#inventory-summary').innerText(),/0.*onafhankelijk/s);
  assert.equal(await page.locator('#inventory-bavli tbody tr').count(),63);
  assert.equal(await page.locator('#inventory-yerushalmi tbody tr').count(),63);
 } finally { await page.close(); }
});
test('zoeken en fragmentlinks werken op mobiel zonder paginaoverloop', async () => {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 try {
  await page.goto(origin);
  await page.locator('.passage').first().waitFor();
  await page.locator('#topnav-search-input').fill('dageraad');
  await page.locator('#topnav-search-input').press('Enter');
  await page.locator('#search-results a').first().waitFor();
  assert.ok(await page.locator('#search-results a').count()>0);
  await page.locator('#search-results a').first().click();
  assert.match(page.url(),/#lezen\/bavli-berakhot\/2a\/m1a$/);
  assert.equal(await page.locator('.original[dir="rtl"]').count(),12);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await page.locator('#settings-open').click();
  await page.locator('#show-original').uncheck();
  assert.equal(await page.locator('.original:visible').count(),0);
 } finally { await page.close(); }
});

test('mobiele inventaristitel blijft onder de vaste navigatie zichtbaar', async () => {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 try {
  await page.goto(origin+'/#inventaris');
  await page.locator('#inventory-bavli').waitFor();
  const heading=await page.locator('#inventaris h1').boundingBox();
  const nav=await page.locator('#topnav').boundingBox();
  assert.ok(heading.y>=nav.y+nav.height, 'de vaste navigatie mag de titel niet bedekken');
 } finally {await page.close();}
});

test('volgend gedeelte opent 2b met eigen bron en actuele voortgang', async () => {
 const page=await browser.newPage();
 try {
  await page.goto(origin+'/#lezen/bavli-berakhot/2a');
  await page.locator('.passage').first().waitFor();
  await page.locator('#next').click();
  await page.waitForURL('**/#lezen/bavli-berakhot/2b');
  assert.equal(await page.locator('.passage').count(),18);
  assert.match(await page.locator('#passage-g18').innerText(),/oogwenk/);
  assert.ok((await page.locator('#reader-source a').first().getAttribute('href')).includes('oldid=2852504'));
  assert.doesNotMatch(await page.locator('#reader-status').innerText(),/Alleen Berakhot 2a/);
  await page.goto(origin+'/#inventaris');
  await page.locator('#inventory-bavli').waitFor();
  assert.match(await page.locator('#inventory-summary').innerText(),new RegExp(progress.translatedSegments+' segmenten'));
  assert.match(await page.locator('#inventory-next').innerText(),new RegExp('Volgende passage: '+progress.nextLabel));
  assert.match(await page.locator('#inventory-bavli tbody tr').first().innerText(),new RegExp(progress.translatedSegments+' segmenten'));
 } finally {await page.close();}
});

test('een trage inventaris blokkeert de leestekst niet', async () => {
 const page=await browser.newPage();
 try {
  await page.route('**/data/inventory.json',()=>{});
  await page.goto(origin+'/#lezen/bavli-berakhot/2b',{waitUntil:'domcontentloaded'});
  await page.locator('#passage-g18').waitFor({timeout:3000});
  assert.match(await page.locator('#passage-g18').innerText(),/oogwenk/);
 } finally {await page.close();}
});

test('3a is navigeerbaar en gebruikt zijn eigen bronrevisie', async () => {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 try {
  await page.goto(origin+'/#lezen/bavli-berakhot/2b');
  await page.locator('.passage').first().waitFor();
  await page.locator('#next').click();
  await page.waitForURL('**/#lezen/bavli-berakhot/3a');
  assert.equal(await page.locator('.passage').count(),19);
  assert.match(await page.locator('#passage-g11').innerText(),/Elia/);
  assert.match(await page.locator('#passage-g19').innerText(),/instortingsgevaar/);
  assert.ok((await page.locator('#reader-source a').first().getAttribute('href')).includes('oldid=3006952'));
  assert.equal(await page.locator('#next').isDisabled(), latest.id==='3a');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await page.locator('#previous').click();
  await page.waitForURL('**/#lezen/bavli-berakhot/2b');
 } finally {await page.close();}
});

test('inventaris toont een herleidbaar percentage met de vaste noemer',async()=>{
 const page=await browser.newPage();
 try {
  await page.goto(origin+'/#inventaris');
  await page.locator('#inventory-bavli').waitFor();
  const status=await page.locator('#extent-status').innerText();
  assert.match(status,/8.445/);
  assert.match(status,/85/);
  assert.match(status,/drukzijden/);
  assert.match(status,/woordpercentage/);
 }finally{await page.close();}
});

test('laatste geïntegreerde zijde toont alle segmenten en de juiste navigatiegrens',async()=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await page.goto(origin+'/#lezen/bavli-berakhot/'+latest.id);
  await page.locator('.passage').first().waitFor();
  assert.equal(await page.locator('.passage').count(),latest.passages.length);
  assert.equal(await page.locator('#reader-source a').first().getAttribute('href'),latest.sourceUrl);
  assert.ok(await page.locator('#next').isDisabled());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }finally{await page.close();}
});
