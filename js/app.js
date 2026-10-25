
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
  const sections = ['lezen','over','bronnen','zoeken'];
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
    for (const passage of chapter?.passages || []) {
      const row = text('div', '', 'passage');
      row.id = 'passage-' + passage.id;
      row.append(text('span', passage.id, 'passage-number'));
      const nl = text('p', passage.nl || 'Nederlandse vertaling nog niet beschikbaar.');
      nl.lang = 'nl';
      const original = text('p', passage.original || 'Grondtekst nog niet beschikbaar.', 'original');
      original.dir = 'rtl'; original.lang = passage.lang || 'he';
      row.append(nl, original);
      $('passages').append(row);
    }
    $('reader-source').replaceChildren();
    if (work.source) $('reader-source').append(text('p', 'Bron: ' + work.source + (work.license ? ' · Rechten: ' + work.license : '')));
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
    $('chapter-title').textContent = {lezen: document.title.split(' — ')[0], over: 'Over deze uitgave', bronnen: 'Bronnen en verantwoording', zoeken: 'Zoeken'}[current];
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
