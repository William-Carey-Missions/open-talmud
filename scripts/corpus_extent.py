"""Reproduceer de editiegebonden amud-inventaris uit Wikisource-indexen."""
import argparse
import concurrent.futures
import datetime
import hashlib
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
HOST = "https://he.wikisource.org"


class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            a = dict(attrs)
            if a.get("href"):
                self.links.append(a)


def title_from_url(url):
    p = urllib.parse.urlsplit(url)
    if p.path.startswith("/wiki/"):
        return urllib.parse.unquote(p.path[6:]).replace("_", " ")
    return urllib.parse.parse_qs(p.query).get("title", [""])[0].replace("_", " ")


def acquire(job, refresh):
    corpus, tractate = job
    dest = ROOT / "data" / "extent" / f"{corpus}-{tractate['id']}.json"
    if dest.exists() and not refresh:
        return json.loads(dest.read_text(encoding="utf-8"))
    for attempt in range(4):
        try:
            req = urllib.request.Request(tractate["sourceUrl"], headers={"User-Agent": "OpenTalmudCorpus/0.1"})
            with urllib.request.urlopen(req, timeout=60) as response:
                raw = response.read()
                final_url = response.url
            break
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)
    parser = Links()
    parser.feed(raw.decode("utf-8"))
    permanent = next((urllib.parse.urljoin(HOST, a["href"]) for a in parser.links if "oldid=" in a["href"]), None)
    if not permanent:
        raise ValueError(f"Geen vaste revisie voor {corpus}:{tractate['id']}")
    record = {
        "corpus": corpus, "tractate": tractate["id"], "title": tractate["title"],
        "gemara": tractate["gemara"], "sourceUrl": tractate["sourceUrl"],
        "resolvedUrl": final_url, "revisionUrl": permanent,
        "historyUrl": HOST + "/w/index.php?" + urllib.parse.urlencode({"title": title_from_url(final_url), "action": "history"}),
        "retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "htmlSha256": hashlib.sha256(raw).hexdigest(),
        "links": [{k: a[k] for k in ("href", "title", "class") if k in a} for a in parser.links],
    }
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return record


NUMBERS = dict(zip("אבגדהוזחטיכלמנסעפצקרשת", (1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100,200,300,400)))


def measure(record):
    base = title_from_url(record["revisionUrl"]).replace(" מסכת ", " ")
    if record["corpus"] == "bavli":
        base = base.removeprefix("בבלי ")
    pattern = re.compile(re.escape(base) + (r" דף ([א-ת]+) ([אב])" if record["corpus"] == "yerushalmi" else r" ([א-ת]+) ([אב])"))
    pages = {}
    for a in record["links"]:
        title = title_from_url(a["href"])
        match = pattern.fullmatch(title)
        if match:
            number = sum(NUMBERS.get(c, 0) for c in match[1])
            pages[title] = {
                "ref": f"{record['corpus']}:{record['tractate']}:{number}{'a' if match[2] == 'א' else 'b'}",
                "title": title, "url": HOST + "/wiki/" + urllib.parse.quote(title.replace(" ", "_")),
                "folio": number, "side": "a" if match[2] == "א" else "b",
                "redLink": "new" in a.get("class", "").split(),
            }
    ordered = sorted(pages.values(), key=lambda x: (x["folio"], x["side"]))
    return {k: record[k] for k in ("corpus", "tractate", "title", "gemara", "sourceUrl", "resolvedUrl", "revisionUrl", "historyUrl", "retrievedAt", "htmlSha256")} | {
        "amudCount": len(ordered) if ordered else None, "redLinkCount": sum(x["redLink"] for x in ordered), "amudim": ordered}


def sefaria_structure(tractate, refresh):
    name = "Jerusalem Talmud " + tractate.replace("-", " ").title()
    dest = ROOT / "data/extent" / f"sefaria-{tractate}.json"
    if dest.exists() and not refresh:
        cached = json.loads(dest.read_text(encoding="utf-8"))
        if "alt_structs" not in cached:
            return cached
    url = "https://www.sefaria.org/api/v2/raw/index/" + name.replace(" ", "_")
    req = urllib.request.Request(url, headers={"User-Agent": "OpenTalmudCorpus/0.1"})
    with urllib.request.urlopen(req, timeout=60) as response:
        raw = response.read()
    data = json.loads(raw)
    if "Vilna" not in data.get("alt_structs", {}):
        raise ValueError(f"Geen Vilna-structuur: {tractate}: {list(data)}")
    nodes = data["alt_structs"]["Vilna"]["nodes"]
    addresses = set()
    evidence = []
    for node in nodes:
        start = node["startingAddress"]
        match = re.fullmatch(r"(\d+)([ab])", start)
        assert node["addressTypes"] == ["Talmud"], node
        offset = 2 * (int(match[1]) - 1) + (match[2] == "b")
        for i, ref in enumerate(node["refs"]):
            if ref:
                n = offset + i
                addresses.add(f"{n // 2 + 1}{'b' if n % 2 else 'a'}")
        evidence.append({k: node[k] for k in ("wholeRef", "startingAddress", "refs")})
    result = {"sourceUrl": url, "retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "responseSha256": hashlib.sha256(raw).hexdigest(), "tractate": tractate,
              "edition": "Vilna", "nodes": evidence,
              "amudim": sorted(addresses, key=lambda a: (int(a[:-1]), a[-1]))}
    dest.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="haal indexen opnieuw op; anders bewaarde structuursnapshots")
    args = parser.parse_args()
    inventory = json.loads((ROOT / "data/inventory.json").read_text(encoding="utf-8"))
    jobs = [(c["id"], t) for c in inventory["corpora"] for t in c["tractates"] if t.get("sourceUrl") and t.get("gemara") in ("overgeleverd", "gedeeltelijk-overgeleverd")]
    assert {c: sum(j[0] == c for j in jobs) for c in ("bavli", "yerushalmi")} == {"bavli": 37, "yerushalmi": 39}
    records = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for record in pool.map(lambda job: acquire(job, args.refresh), jobs):
            result = measure(record)
            records.append(result)
            print(f"{result['corpus']}:{result['tractate']} {result['amudCount']} red={result['redLinkCount']}", flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        structures = list(pool.map(lambda r: sefaria_structure(r["tractate"], args.refresh), [r for r in records if r["corpus"] == "yerushalmi"]))
    for r in records:
        wiki_pages = r.pop("amudim")
        r["wikisourceAmudim"] = wiki_pages
        observed = {str(a["folio"]) + a["side"] for a in wiki_pages}
        r["wikisourceIndexAmudCount"] = r["amudCount"]
        if r["corpus"] == "yerushalmi":
            structure = next(s for s in structures if s["tractate"] == r["tractate"])
            r["sefariaVilnaAmudCount"] = len(structure["amudim"])
            r["structuralSourceUrl"] = structure["sourceUrl"]
            r["structuralSourceSha256"] = structure["responseSha256"]
            r["wikisourceOutsideSefariaMapping"] = sorted(observed - set(structure["amudim"]))
            observed.update(structure["amudim"])
        offsets = {2 * (int(a[:-1]) - 1) + (a[-1] == "b") for a in observed}
        # Een gevuld bereik is een bovengrens, ook als een register interne gaten heeft.
        slots = [f"{i // 2 + 1}{'b' if i % 2 else 'a'}" for i in range(min(offsets), max(offsets) + 1)]
        r["amudim"] = [f"{r['corpus']}:{r['tractate']}:{a}" for a in slots]
        r["amudCount"] = len(slots)
        r["observedUniqueAmudCount"] = len(observed)
        r["editorialGapSlots"] = sorted(set(slots) - observed, key=lambda a: (int(a[:-1]), a[-1]))
    totals = {c: sum(r["amudCount"] or 0 for r in records if r["corpus"] == c) for c in ("bavli", "yerushalmi")}
    total = sum(totals.values())
    assert len({a for r in records for a in r["amudim"]}) == total
    assert not any(r["corpus"] == "bavli" and r["tractate"] == "shekalim" for r in records)
    tamid = next(r for r in records if r["corpus"] == "bavli" and r["tractate"] == "tamid")
    assert tamid["amudim"][0] == "bavli:tamid:25b"
    assert tamid["amudim"][-1] == "bavli:tamid:33b"
    output = {
        "version": 1, "date": "2026-10-25", "unit": "edition-index-amud-slot",
        "status": "fixed-editorial-upper-bound", "definition": "Editiegebonden amudplaatsen voor 37 Babylonische en 39 Jeruzalemse tractaten. Bavli: eerste tot laatste unieke Wikisource-indexamud. Yerushalmi: eerste tot laatste amud uit de unie van Wikisource-paginaregister en Sefaria Vilna-structuur. Interne gaten en rode links blijven in deze redactionele bovengrens opgenomen. Geen percentage tekstvolume; zelfstandige Misjna buiten deze amudnoemer.",
        "license": "CC BY-SA 4.0", "attribution": "Hebreeuwse Wikisource, gezamenlijke bijdragers; revisie- en geschiedenislinks per index.",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "structuralSourceNotice": "Sefaria wordt uitsluitend als structuurgetuige gebruikt; geen lopende tekst, vertaling of beschrijvingen geïmporteerd. De snapshots bewaren bron-URL, ophaaltijd, responshash en gebruikte Vilna-koppelingen.",
        "totals": totals, "denominator": total, "onePercentThresholdWholeAmudim": math.ceil(total / 100),
        "redLinkCount": sum(r["redLinkCount"] for r in records), "tractates": records,
    }
    (ROOT / "data/extent.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"totals": totals, "denominator": total, "threshold": math.ceil(total / 100), "redLinks": output["redLinkCount"]}))


if __name__ == "__main__":
    main()
