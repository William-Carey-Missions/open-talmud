# Open Talmud

Nederlandse leesomgeving voor de grondtekst en vertaling van de Talmoed, met de vormgeving van [Open Vertaling](https://openvertaling.nl/).

## Status

**Dit is een onvolledige conceptuitgave.** De actuele reeks, segmenttelling en eerstvolgende passage staan in [de vertaalstatus](docs/status.md) en [het voortgangsregister](data/progress.json). Onafhankelijke inhoudelijke eindcontrole is nog niet uitgevoerd.

De voortgangsmaat telt **8.445 vastgezette editiegebonden drukzijden** van beide Talmoeds samen. **85 volledig vertaalde zijden** overschrijden 1%. Dit is geen woordpercentage en geen extra telling van de zelfstandige Misjna; zie [methode en bronnen](docs/omvangstelling.md).

De inventaris bevat alle 63 Misjna-tractaten, 37 Babylonische en 39 Jeruzalemse tractaten met overgeleverde Gemara. Gedeeltelijk overgeleverde of ontbrekende Gemara blijft apart zichtbaar. De daadwerkelijke tekstverwerving wordt per bronextract verantwoord.

## Lezen en controleren

Geen installatie of build nodig:

~~~sh
python -m http.server 8000
~~~

Open http://localhost:8000. Gebruik een HTTP-server; een bestand-URL ondersteunt de JSON-laadfunctie niet.

- Eerste tekst: #lezen/bavli-berakhot/2a
- Vervolg: #lezen/bavli-berakhot/2b
- Nieuwste gedeelte: zie de keuzelijst in de lezer
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
| [data/sources/wikisource-berakhot-3a.json](data/sources/wikisource-berakhot-3a.json) | Zes bronalinea’s uit revisie 3006952; haakjestekst behouden |
| [data/progress.json](data/progress.json) | Exacte vertaalstatus, controlestatus, checksum en eerstvolgende passage |
| [docs/corpusbeleid.md](docs/corpusbeleid.md) | Afbakening, bronkeuze, redactie en vervolgvolgorde |

De lokale segmentcodes m1a–m1d en g1–g8 op 2a, g1–g18 op 2b en g1–g19 op 3a, zijn eigen uitgavenummering, geen universele Talmoedsegmenten. Een ref zoals bavli:berakhot:2a:g7 koppelt de Nederlandse tekst aan de vastgelegde bronalinea. Misjna en Gemara worden onderscheiden; een misjnacitaat binnen de Gemara blijft onderdeel van de Gemara. Ingebedde Misjna wordt niet dubbel als vertaalprestatie geteld.

Een eerste vertaling krijgt status concept. Alleen een vastgelegde onafhankelijke controle mag die controlestatus verhogen. Een onbekend totaal staat als null, nooit als een gefingeerde nul of voltooiingspercentage.

## Bronnen en rechten

De geïmporteerde bron is [Hebreeuwse Wikisource, Berakhot 2a, revisie 3006896](https://he.wikisource.org/w/index.php?oldid=3006896&title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%91_%D7%90), 20 april 2026. Naamsvermelding: Wikisource-bijdragers; auteurs en bewerkingen staan in de [paginageschiedenis](https://he.wikisource.org/w/index.php?title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%91_%D7%90&action=history). Alleen de hoofdtekst is overgenomen. Hyperlinks en verwijzingssuperscripten zijn verwijderd; lokale segmentering, Nederlandse vertaling en eigen toelichting zijn toegevoegd.

Voor 2b is [revisie 2852504](https://he.wikisource.org/w/index.php?title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%91_%D7%91&oldid=2852504) gebruikt, van 22 april 2024. De revisie is geïdentificeerd via de bronverwijzing onderaan de opgehaalde Wikisource-pagina. Het extract bevat zes alinea’s, verdeeld in achttien segmenten. De [paginageschiedenis van 2b](https://he.wikisource.org/w/index.php?title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%91_%D7%91&action=history) vermeldt de bijdragers.

Voor 3a is [revisie 3006952](https://he.wikisource.org/w/index.php?title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%92_%D7%90&oldid=3006952) gebruikt, van 20 april 2026. De revisie is geïdentificeerd via de bronverwijzing onderaan de opgehaalde pagina. De zes bronalinea’s zijn verdeeld in negentien segmenten; de haakjestekst is behouden. De [paginageschiedenis van 3a](https://he.wikisource.org/w/index.php?title=%D7%91%D7%A8%D7%9B%D7%95%D7%AA_%D7%92_%D7%90&action=history) vermeldt de bijdragers.

De Wikisource-bewerkingen en deze afgeleide Nederlandse conceptvertaling en toelichtingen vallen onder [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Nederlandse tekst: Open Talmud, 2026. Zie ook [licenses/corpus.md](licenses/corpus.md).

Sefaria is onderzocht als aanvullende vindplaats en voor structuurcontrole. Daar heeft iedere tekstversie eigen rechten; er is geen Sefaria-tekst geïmporteerd. Beschermde moderne vertalingen zijn niet overgenomen. De inventarislinks zonder verworven bronextract zijn vindplaatsen voor verdere verwerving; zij vormen geen verklaring dat iedere afzonderlijke pagina of teksteditie al gecontroleerd is.

css/openvertaling.css is ongewijzigd overgenomen uit de Open Vertaling-repository; herkomst en SHA-256 staan in SOURCE.json. De lokale lettertypen vallen onder de SIL Open Font License; zie licenses/. De corpuslicentie vervangt de bestaande rechten op andere onderdelen niet.

## Blokverwerving en integratie

Nieuwe bronextracten worden met scripts/acquire_wikisource.py verworven. Afgeronde amudim staan als controleerbare hoofdstukken in data/drafts/. node scripts/import_drafts.mjs valideert volledige brondekking en unieke verwijzingen vóór het toevoegen van een aaneengesloten reeks aan de lezer. Het script berekent voortgang en status opnieuw uit de daadwerkelijke inhoud.

De omvangstelling is offline reproduceerbaar met python scripts/corpus_extent.py. Bronverwerving gebruikt alleen openbare bronnen; geen betaalde vertaaldienst is nodig.

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
