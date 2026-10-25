"""Verwerf de afgebakende hoofdtekst met revisie en bronvermelding."""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]

class Element:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []
    def find(self, predicate):
        if predicate(self): return self
        for child in self.children:
            if isinstance(child, Element):
                result = child.find(predicate)
                if result is not None: return result
        return None
    def all(self, tag):
        for child in self.children:
            if isinstance(child, Element):
                if child.tag == tag: yield child
                yield from child.all(tag)
    def text(self):
        if self.tag in ('sup', 'style', 'script', 'noscript'): return ''
        if self.tag == 'br': return ' '
        return ''.join(child if isinstance(child,str) else child.text() for child in self.children)

class Parser(HTMLParser):
    VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Element()
        self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        node = Element(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.VOID: self.stack.append(node)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag,attrs)
        if tag not in self.VOID: self.handle_endtag(tag)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break
    def handle_data(self, data): self.stack[-1].children.append(data)

def extract(html):
    parser=Parser(); parser.feed(html)
    main=parser.root.find(lambda n:'gmara_text' in n.attrs.get('class','').split())
    if main is None: raise ValueError('Geen afzonderlijke gmara_text-hoofdtekst: handmatige bronafbakening vereist')
    paragraphs=[' '.join(p.text().split()) for p in main.all('p')]
    paragraphs=[p for p in paragraphs if p]
    if not paragraphs:
        text=' '.join(main.text().split())
        if text: paragraphs=[text]
    revisions=re.findall(r'oldid=(\d+)',html)
    if not paragraphs or not revisions: raise ValueError('Hoofdtekst of revisie ontbreekt')
    return {'paragraphs':paragraphs,'revision':int(revisions[-1])}

def hebrew_number(n):
    if n == 15: return 'טו'
    if n == 16: return 'טז'
    hundreds, n = divmod(n,100)
    tens, ones = divmod(n,10)
    return ('ק'*hundreds)+['','י','כ','ל','מ','נ','ס','ע','פ','צ'][tens]+['','א','ב','ג','ד','ה','ו','ז','ח','ט'][ones]

def acquire(amud, overwrite=False):
    target=ROOT/'data'/'sources'/('wikisource-berakhot-'+amud+'.json')
    if target.exists() and not overwrite: return json.loads(target.read_text(encoding='utf-8'))
    match=re.fullmatch(r'(\d+)([ab])',amud)
    if not match: raise ValueError('Ongeldige amud')
    title='ברכות_'+hebrew_number(int(match[1]))+'_'+('א' if match[2]=='a' else 'ב')
    url='https://he.wikisource.org/wiki/'+quote(title)
    request=Request(url,headers={'User-Agent':'OpenTalmudCorpus/0.1 (public text acquisition)'})
    with urlopen(request,timeout=45) as response: html=response.read().decode('utf-8')
    content=extract(html)
    revision=content['revision']
    source={'id':f'wikisource-berakhot-{amud}-r{revision}','title':f'Berakhot {amud} — ongevocaliseerde Wikisource-editie','revision':revision,'url':'https://he.wikisource.org/w/index.php?title='+quote(title)+'&oldid='+str(revision),'acquisitionUrl':url,'revisionEvidence':'Revisie geïdentificeerd via de bronverwijzing onderaan de opgehaalde pagina.','accessed':'2026-10-25','attribution':f'Wikisource-bijdragers, Hebreeuwse Wikisource, {title.replace("_"," ")}; auteurs en bewerkingen via de paginageschiedenis.','historyUrl':'https://he.wikisource.org/w/index.php?title='+quote(title)+'&action=history','license':'CC-BY-SA-4.0','licenseUrl':'https://creativecommons.org/licenses/by-sa/4.0/','extraction':'Alleen de afzonderlijke gmara_text-hoofdtekst. Navigatie, hyperlinks, stijlcodes en verwijzingssuperscripten verwijderd; haakjes en varianten behouden. Geen commentaren geïmporteerd. Dit is een tekstextract, geen ruwe HTML- of manuscriptkopie.','paragraphs':content['paragraphs']}
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    return source

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('amud',nargs='+');ap.add_argument('--overwrite',action='store_true')
    args=ap.parse_args()
    for amud in args.amud:
        source=acquire(amud,args.overwrite)
        print(amud,source['revision'],len(source['paragraphs']),'alinea’s',sum(len(p.split()) for p in source['paragraphs']),'woorden',flush=True)
