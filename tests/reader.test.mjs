import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = new URL('../', import.meta.url);
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
