# Open Talmud

Nederlandse leesomgeving voor de grondtekst en vertaling van de Talmoed, met de vormgeving van [Open Vertaling](https://openvertaling.nl/).

## Status — 25 oktober 2026

**Dit is een onvolledige conceptuitgave. Geen tractaat is volledig vertaald.**

Beschikbaar: de volledige hoofdtekst van **Babylonische Berakhot 2a–2b**, rechtstreeks vertaald uit de vastgelegde Hebreeuws-Aramese bron. De dertig gekoppelde segmenten bevatten Misjna Berakhot 1:1 (vier segmenten) en de aansluitende Gemara (zesentwintig segmenten). Op 2a staan twaalf segmenten, op 2b achttien. Toelichting en onzekere interpretaties staan afzonderlijk bij de tekst.

De onafhankelijke inhoudelijke en taalkundige controle is nog niet uitgevoerd: **0 segmenten onafhankelijk gecontroleerd**. De laatste vraag op 2a loopt door op de nu beschikbare 2b. De discussie gaat verder op 3a; die voortzetting ontbreekt nog.

Resteert: Berakhot 3a–64a (123 amudim), de overige Babylonische tractaten, de gehele Jeruzalemse Talmoed en de overige Misjna-teksten. De inventaris bevat alle 63 Misjna-tractaten en per Talmoed alle 63 posities, met onderscheid tussen overgeleverde, gedeeltelijk overgeleverde en ontbrekende Gemara. Er zijn 37 Babylonische en 39 Jeruzalemse tractaten met overgeleverde Gemara; deze aantallen betekenen geen volledige overlevering per tractaat.

Alleen Berakhot heeft een register op amudniveau. De volledige segmentinventaris voor de overige teksten is nog niet verworven. Daarom wordt geen totaalpercentage opgegeven.

## Lezen en controleren

Geen installatie of build nodig:

~~~sh
python -m http.server 8000
~~~

Open http://localhost:8000. Gebruik een HTTP-server; een bestand-URL ondersteunt de JSON-laadfunctie niet.

- Eerste tekst: #lezen/bavli-berakhot/2a
- Vervolg: #lezen/bavli-berakhot/2b
- Voorbeeld van een vaste fragmentlink: #lezen/bavli-berakhot/2a/g7
- Inventaris en voortgang: #inventaris
- Bronverantwoording: #bronnen

De ongewijzigde basisstylesheet, lokale lettertypen, navigatie, thema’s en tekstopties van de bestaande lezer blijven behouden.

## Corpusbestanden

| Bestand | Inhoud |
| --- | --- |
| [data/library.json](data/library.json) | Geïntegreerde brontekst, vertaling, blijvende segmenten, tekstlaag en toelichting |
| [data/inventory.json](data/inventory.json) | Misjna, Babylonische en Jeruzalemse inventaris, plus Berakhot 2a–64a |
| [data/sources.json](data/sources.json) | Gebruikte bronversie, rechten, naamsvermelding, bronkandidaten en checksum |
| [data/sources/wikisource-berakhot-2a.json](data/sources/wikisource-berakhot-2a.json) | Vier bronalinea’s uit revisie 3006896, zonder hyperlink- en notenapparaat |
| [data/sources/wikisource-berakhot-2b.json](data/sources/wikisource-berakhot-2b.json) | Zes bronalinea’s uit revisie 2852504, zonder hyperlinks |
| [data/progress.json](data/progress.json) | Exacte vertaalstatus, controlestatus, checksum en eerstvolgende passage |
| [docs/corpusbeleid.md](docs/corpusbeleid.md) | Afbakening, bronkeuze, redactie en vervolgvolgorde |

De lokale segmentcodes m1a–m1d en g1–g8 op 2a, en g1–g18 op 2b, zijn eigen uitgavenummering, geen universele Talmoedsegmenten. Een ref zoals bavli:berakhot:2a:g7 koppelt de Nederlandse tekst aan de vastgelegde bronalinea. Misjna en Gemara worden onderscheiden; een misjnacitaat binnen de Gemara blijft onderdeel van de Gemara. Ingebedde Misjna wordt niet dubbel als vertaalprestatie geteld.

Een eerste vertaling krijgt status concept. Alleen een vastgelegde onafhankelijke controle mag die controlestatus verhogen. Een onbekend totaal staat als null, nooit als een gefingeerde nul of voltooiingspercentage.

## Bronnen en rechten

De geïmporteerde bron is [Hebreeuwse Wikisource, Berakhot 2a, revisie 3006896](https://he.wikisource.org/w/index.php?oldid=3006896&title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%91_%D7%90), 20 april 2026. Naamsvermelding: Wikisource-bijdragers; auteurs en bewerkingen staan in de [paginageschiedenis](https://he.wikisource.org/w/index.php?title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%91_%D7%90&action=history). Alleen de hoofdtekst is overgenomen. Hyperlinks en verwijzingssuperscripten zijn verwijderd; lokale segmentering, Nederlandse vertaling en eigen toelichting zijn toegevoegd.

Voor 2b is [revisie 2852504](https://he.wikisource.org/w/index.php?title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%91_%D7%91&oldid=2852504) gebruikt, van 22 april 2024. De revisie is geïdentificeerd via de bronverwijzing onderaan de opgehaalde Wikisource-pagina. Het extract bevat zes alinea’s, verdeeld in achttien segmenten. De [paginageschiedenis van 2b](https://he.wikisource.org/w/index.php?title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%91_%D7%91&action=history) vermeldt de bijdragers.

De Wikisource-bewerkingen en deze afgeleide Nederlandse conceptvertaling en toelichtingen vallen onder [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Nederlandse tekst: Open Talmud, 2026. Zie ook [licenses/corpus.md](licenses/corpus.md).

Sefaria is onderzocht als aanvullende vindplaats en voor structuurcontrole. Daar heeft iedere tekstversie eigen rechten; er is geen Sefaria-tekst geïmporteerd. Beschermde moderne vertalingen zijn niet overgenomen. De inventarislinks buiten 2a–2b zijn vindplaatsen voor verdere verwerving; zij vormen geen verklaring dat iedere afzonderlijke pagina of teksteditie al gecontroleerd is.

css/openvertaling.css is ongewijzigd overgenomen uit de Open Vertaling-repository; herkomst en SHA-256 staan in SOURCE.json. De lokale lettertypen vallen onder de SIL Open Font License; zie licenses/. De corpuslicentie vervangt de bestaande rechten op andere onderdelen niet.

## Verificatie

De datacontroles gebruiken alleen Node.js:

~~~sh
node --test tests/corpus.test.mjs
node --check js/app.js
~~~

De browsercontroles gebruiken Playwright en een lokale Chromium-browser. Installeer die zelf in de ontwikkelomgeving, of gebruik een aanwezige installatie. PLAYWRIGHT_MODULE kan naar een bestaande Playwright-module wijzen; BROWSER_EXECUTABLE naar een browser. Zonder overrides wordt Playwright als pakket geladen en Edge gebruikt.

~~~sh
node --test tests/reader.test.mjs
~~~

De controles toetsen brondekking zonder tekstverlies, checksums, inventaris en voortgang, bronvermelding en toelichting in de lezer, zoeken, fragmentlinks en mobiele paginaoverloop. Zij vervangen geen onafhankelijke beoordeling van de vertaling.
