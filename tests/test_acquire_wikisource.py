import importlib.util
from pathlib import Path
import unittest

MODULE = Path(__file__).resolve().parents[1] / 'scripts' / 'acquire_wikisource.py'

class AcquisitionTests(unittest.TestCase):
    def test_main_text_retains_variants_but_excludes_apparatus(self):
        self.assertTrue(MODULE.exists(), 'bronverwerver ontbreekt')
        spec = importlib.util.spec_from_file_location('acquire', MODULE)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        html = '<html><script>secret</script><div class="gmara_text"><p>אב <a href="x">גד</a><sup>א</sup> [ו] (ז)<style>css</style></p><p>ח<br>ט</p></div><h2>רשי</h2><p>commentaar</p><a href="/w/index.php?title=x&amp;oldid=12345">bron</a></html>'
        result = module.extract(html)
        self.assertEqual(result['paragraphs'], ['אב גד [ו] (ז)', 'ח ט'])
        self.assertEqual(result['revision'],12345)

if __name__ == '__main__': unittest.main()
