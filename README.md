# Open Talmud

Zelfstandige leesomgeving met de vormgeving van [Open Vertaling](https://openvertaling.nl/).

## Status

De websitebasis is gereed. **Er zijn nog geen Zohar- of Talmoedteksten geïmporteerd of vertaald.**
Beide projecten hebben een eigen tekstbestand en eigen browserinstellingen.

## Lokaal gebruiken

Geen installatie of build nodig. Start vanuit de hoofdmap:

~~~sh
python -m http.server 8000
~~~

Open http://localhost:8000. Gebruik een HTTP-server; rechtstreeks openen via een bestand-URL ondersteunt de JSON-laadfunctie niet.

## Beschikbaar

- Open Vertaling-stijl met de originele basisstylesheet, lokale lettertypen, bovenbalk en zijbalk.
- Responsieve navigatie, licht/donker/automatisch thema en bewaarde leesvoorkeuren.
- Nederlandse vertaling naast grondtekst van rechts naar links.
- Navigatie per werk en gedeelte, deelbare fragmentlinks en zoeken in geladen teksten.
- Een duidelijke melding zolang geen corpus is toegevoegd.

## Teksten toevoegen

Vul data/library.json. De lijst works is nu bewust leeg. De lezer verwacht dit model:

~~~json
{
  "version": 1,
  "title": "Open Talmud",
  "works": [
    {
      "id": "unieke-werkcode",
      "title": "Titel van het werk",
      "source": "Bibliografische bronvermelding",
      "license": "Rechten van de gebruikte tekst",
      "chapters": [
        {
          "id": "gedeelte-1",
          "title": "Eerste gedeelte",
          "passages": [
            {
              "id": "1",
              "nl": "Nederlandse tekst",
              "original": "Grondtekst",
              "lang": "he"
            }
          ]
        }
      ]
    }
  ]
}
~~~

Dit is uitsluitend een schema, geen tekstuitgave. Gebruik unieke string-id's. Geef he voor Hebreeuws of arc voor Aramees op. Tekstvelden worden als tekst weergegeven, nooit als HTML.
Leg voor import de brontekst, gebruiksrechten en vertaalstatus vast. Een koppeling heeft de vorm #lezen/werkcode/gedeeltecode/passagecode.

## Vormgeving en rechten

css/openvertaling.css is ongewijzigd overgenomen uit William-Carey-Missions/website-open-bijbelvertaling en wordt aangevuld door css/corpus.css.
Herkomst en SHA-256 staan in SOURCE.json. Er wordt geen algemene licentie overgenomen voor nog toe te voegen tekstuitgaven.
De meegeleverde lettertypen vallen onder de SIL Open Font License; zie licenses/.

Deze repository bevat geen Bijbelcorpus, accountconfiguratie, servergeheimen of productiepublicatieconfiguratie van de oorspronkelijke site.
