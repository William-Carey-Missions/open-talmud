
'use strict';
(async () => {
  const $ = id => document.getElementById(id);
  const storageKey = document.body.dataset.project + ':reader';
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(prefs)); } catch {} };
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  function applyPreferences() {
    document.documentElement.dataset.theme = prefs.theme === 'auto' || !prefs.theme ? (systemTheme.matches ? 'donker' : 'licht') : prefs.theme;
    document.documentElement.style.setProperty('--reading-size', (Number(prefs.size) || 21) + 'px');
    document.body.classList.toggle('original-hidden', prefs.original === false);
    document.body.classList.toggle('alternate-font', prefs.font === 'sans');
    $('theme').value = prefs.theme || 'auto';
    $('font-size').value = prefs.size || 21;
    $('font-value').textContent = (prefs.size || 21) + ' px';
    $('font').value = prefs.font || 'serif';
    $('show-original').checked = prefs.original !== false;
  }
  applyPreferences();
  systemTheme.addEventListener('change', applyPreferences);
  for (const [id, key] of [['theme','theme'], ['font-size','size'], ['font','font'], ['show-original','original']]) {
    $(id).addEventListener('input', () => {
      prefs[key] = id === 'show-original' ? $(id).checked : $(id).value;
      save(); applyPreferences();
    });
  }
  $('theme-toggle').addEventListener('click', () => {
    prefs.theme = document.documentElement.dataset.theme === 'donker' ? 'licht' : 'donker';
    save(); applyPreferences();
  });
  const settings = $('settings');
  $('settings-open').addEventListener('click', () => settings.showModal());
  $('settings-close').addEventListener('click', () => settings.close());
  const sections = ['lezen','over','bronnen','inventaris','zoeken'];
  let library = { works: [] };
  let loadError = false;
  const text = (tag, value, className) => {
    const element = document.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    return element;
  };
  try {
    const response = await fetch('data/library.json');
    if (!response.ok) throw new Error('library');
    const loaded = await response.json();
    if (!Array.isArray(loaded.works)) throw new Error('schema');
    library = loaded;
  } catch { loadError = true; }
  const works = library.works;
  for (const work of works) {
    const link = text('a', work.title, 'tree-book-label');
    link.href = '#lezen/' + encodeURIComponent(work.id);
    $('work-links').append(link);
  }
  const link = (label, href) => {
    const a = text('a', label);
    a.href = href;
    return a;
  };
  async function renderInventory() {
    try {
      const [inventoryResponse, progressResponse] = await Promise.all([fetch('data/inventory.json'), fetch('data/progress.json')]);
      if (!inventoryResponse.ok || !progressResponse.ok) throw new Error('inventory');
      const inventory = await inventoryResponse.json();
      const progress = await progressResponse.json();
      const gemaraCount = id => inventory.corpora.find(c => c.id === id).tractates.filter(t => t.gemara !== 'niet-overgeleverd').length;
      $('inventory-summary').textContent = inventory.mishnah.length + ' Misjna-tractaten · ' + gemaraCount('bavli') + ' Babylonische tractaten met Gemara · ' + gemaraCount('yerushalmi') + ' Jeruzalemse tractaten met Gemara, waaronder gedeeltelijk overgeleverde teksten. ' + progress.translatedSegments + ' segmenten in concept vertaald; ' + progress.independentlyReviewedSegments + ' onafhankelijk gecontroleerd. ' + (progress.completeTractates ? progress.completeTractates + ' tractaten volledig vertaald.' : 'Geen tractaat volledig vertaald.');
      $('inventory-next').textContent = 'Volgende passage: ' + (progress.nextLabel || progress.nextRef) + '. ' + progress.remaining;
      for (const corpus of inventory.corpora) {
        const container = text('div', '', 'corpus-inventory');
        container.id = 'inventory-' + corpus.id;
        container.append(text('h2', corpus.title), text('p', corpus.structure));
        for (const order of inventory.orders) {
          const details = document.createElement('details');
          details.open = order.id === 'zeraim';
          details.append(text('summary', order.title + ' · ' + order.subject));
          const scroll = text('div', '', 'inventory-scroll');
          const table = document.createElement('table');
          const caption = text('caption', corpus.title + ' · ' + order.title);
          table.append(caption);
          const head = document.createElement('thead');
          const headings = document.createElement('tr');
          for (const value of ['Tractaat', 'Gemara', 'Vertaling']) {
            const th = text('th', value); th.scope = 'col'; headings.append(th);
          }
          head.append(headings); table.append(head);
          const body = document.createElement('tbody');
          for (const tractate of corpus.tractates.filter(t => t.order === order.id)) {
            const row = document.createElement('tr');
            const name = document.createElement('th'); name.scope = 'row';
            name.append(tractate.sourceUrl ? link(tractate.title, tractate.sourceUrl) : text('span', tractate.title));
            const preserved = tractate.gemara === 'niet-overgeleverd' ? 'Niet overgeleverd' : tractate.gemara === 'gedeeltelijk-overgeleverd' ? 'Gedeeltelijk overgeleverd' : 'Overgeleverd';
            const status = tractate.translationStatus === 'concept-deel' ? (tractate.units || []).filter(u => u.translationStatus === 'concept').map(u => u.id).join(', ') + ': ' + tractate.translatedSegments + ' segmenten in concept; rest open' : tractate.translationStatus === 'niet-van-toepassing' ? 'Niet van toepassing' : 'Nog niet begonnen';
            const note = text('td', preserved);
            if (tractate.note) note.append(text('small', tractate.note));
            row.append(name, note, text('td', status)); body.append(row);
          }
          table.append(body); scroll.append(table); details.append(scroll); container.append(details);
        }
        $('inventory-tables').append(container);
      }
      $('mishnah-inventory').append(text('p', 'De 63 Misjna-tractaten vormen één basislaag. Berakhot 1:1 is vertaald binnen Babylonische Berakhot 2a; er is nog geen zelfstandige Misjna-uitgave. Dezelfde tekst wordt niet dubbel als vertaalprestatie geteld.'));
      for (const order of inventory.orders) {
        const details = document.createElement('details');
        details.append(text('summary', order.title));
        const list = document.createElement('ul');
        for (const tractate of inventory.mishnah.filter(t => t.order === order.id)) {
          const item = document.createElement('li');
          item.append(link(tractate.title, tractate.sourceUrl), text('span', ' · zelfstandige vertaling nog niet begonnen'));
          list.append(item);
        }
        details.append(list); $('mishnah-inventory').append(details);
      }
    } catch {
      $('inventory-summary').textContent = 'De inventaris kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.';
    }
  }
  renderInventory();
  function chapterView(workId, chapterId) {
    const work = works.find(item => item.id === workId) || works[0];
    $('reader-controls').hidden = !work;
    $('chapter-actions').hidden = !work;
    $('reader-empty').hidden = !!work;
    $('reader-intro').hidden = !!work;
    $('passages').replaceChildren();
    if (!work) return;
    const chapters = work.chapters || [];
    const chapter = chapters.find(item => item.id === chapterId) || chapters[0];
    const fill = (select, items, selected) => {
      select.replaceChildren(...items.map(item => new Option(item.title, item.id)));
      select.value = selected || '';
    };
    fill($('work-select'), works, work.id);
    fill($('chapter-select'), chapters, chapter?.id);
    $('chapter-title').textContent = chapter ? work.title + ' · ' + chapter.title : work.title;
    $('reader-status').textContent = 'Conceptvertaling · niet onafhankelijk gecontroleerd. Beschikbaar in dit werk: ' + chapters.map(c => c.id).join(', ') + '; de overige tekst is nog niet vertaald.' + (chapter?.scope ? ' ' + chapter.scope : '');
    for (const passage of chapter?.passages || []) {
      const row = text('div', '', 'passage');
      row.id = 'passage-' + passage.id;
      row.append(text('span', passage.id, 'passage-number'));
      const nl = text('p', passage.nl || 'Nederlandse vertaling nog niet beschikbaar.');
      nl.lang = 'nl';
      const original = text('p', passage.original || 'Grondtekst nog niet beschikbaar.', 'original');
      original.dir = 'rtl'; original.lang = passage.lang || 'he';
      const translation = text('div', '', 'translation');
      const meta = text('div', '', 'passage-meta');
      meta.append(link((passage.layer === 'mishnah' ? 'Misjna' : 'Gemara') + ' · ' + passage.locator, '#lezen/' + encodeURIComponent(work.id) + '/' + encodeURIComponent(chapter.id) + '/' + encodeURIComponent(passage.id)));
      translation.append(meta, nl);
      if (passage.notes?.length) {
        const notes = text('aside', '', 'passage-notes');
        notes.setAttribute('aria-label', 'Toelichting bij ' + passage.id);
        notes.append(text('strong', 'Toelichting'));
        for (const note of passage.notes) {
          const label = note.type === 'onzeker' ? 'Onzekere interpretatie: ' : note.type === 'vervolg' ? 'Vervolg: ' : '';
          notes.append(text('p', label + note.text));
        }
        translation.append(notes);
      }
      row.append(translation, original);
      $('passages').append(row);
    }
    $('reader-source').replaceChildren();
    const source = chapter?.source || work.source;
    const sourceUrl = chapter?.sourceUrl || work.sourceUrl;
    if (source) {
      const credit = text('p', 'Bron: ' + source + ' ');
      if (sourceUrl) credit.append(link('Vaste bronversie', sourceUrl));
      if (work.license) credit.append(text('span', ' · Rechten: ' + work.license + ' '));
      if (work.licenseUrl) credit.append(link('Licentievoorwaarden', work.licenseUrl));
      $('reader-source').append(credit, link('Volledige inventaris en voortgang', '#inventaris'));
    }
    const index = chapters.indexOf(chapter);
    $('previous').disabled = index <= 0;
    $('next').disabled = index < 0 || index >= chapters.length - 1;
    $('previous').onclick = () => { location.hash = 'lezen/' + encodeURIComponent(work.id) + '/' + encodeURIComponent(chapters[index-1].id); };
    $('next').onclick = () => { location.hash = 'lezen/' + encodeURIComponent(work.id) + '/' + encodeURIComponent(chapters[index+1].id); };
  }
  $('work-select').onchange = () => { location.hash = 'lezen/' + encodeURIComponent($('work-select').value); };
  $('chapter-select').onchange = () => { location.hash = 'lezen/' + encodeURIComponent($('work-select').value) + '/' + encodeURIComponent($('chapter-select').value); };
  function search(query) {
    $('search-results').replaceChildren();
    $('search-count').textContent = '';
    $('search-query').textContent = query ? 'Zoeken naar “' + query + '”' : 'Vul bovenaan een zoekwoord in.';
    if (!query) return;
    let count = 0;
    for (const work of works) for (const chapter of work.chapters || []) for (const passage of chapter.passages || []) {
      if (!((passage.nl || '') + ' ' + (passage.original || '')).toLocaleLowerCase('nl').includes(query.toLocaleLowerCase('nl'))) continue;
      count++;
      const result = text('a', work.title + ' · ' + chapter.title + ' · ' + passage.id);
      result.href = '#lezen/' + encodeURIComponent(work.id) + '/' + encodeURIComponent(chapter.id) + '/' + encodeURIComponent(passage.id);
      result.append(text('small', passage.nl || passage.original));
      $('search-results').append(result);
    }
    $('search-count').textContent = works.length ? count + ' resultaten' : 'Er zijn nog geen teksten beschikbaar om te doorzoeken.';
  }
  function route() {
    const parts = location.hash.slice(1).split('/').map(part => { try { return decodeURIComponent(part); } catch { return ''; } });
    const current = sections.includes(parts[0]) ? parts[0] : 'lezen';
    for (const section of sections) $(section).hidden = section !== current;
    document.querySelectorAll('[data-section]').forEach(link => {
      const active = link.dataset.section === current;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
    $('mobile-section').value = current;
    $('chapter-title').textContent = {lezen: document.title.split(' — ')[0], over: 'Over deze uitgave', bronnen: 'Bronnen en verantwoording', inventaris: 'Corpusinventaris en voortgang', zoeken: 'Zoeken'}[current];
    if (current === 'lezen') {
      chapterView(parts[1], parts[2]);
      if (parts[3]) document.getElementById('passage-' + parts[3])?.scrollIntoView({block:'center'});
    }
    if (current === 'zoeken') search($('topnav-search-input').value.trim());
  }
  $('mobile-section').onchange = () => { location.hash = $('mobile-section').value; };
  $('search-form').onsubmit = event => { event.preventDefault(); location.hash = 'zoeken'; route(); };
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('topnav-search-input').focus(); }
  });
  if (loadError) {
    $('empty-title').textContent = 'Teksten konden niet worden geladen';
    $('empty-message').textContent = 'Ververs de pagina om het opnieuw te proberen.';
  }
  window.addEventListener('hashchange', route);
  route();
})();
