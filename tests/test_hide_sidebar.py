"""Плагин «Спрятать панель»: манифест и то, что страница находит в файлах. Стандартная библиотека; правила панели —
в tests/state.test.mjs (node --test tests). Запуск: python3 -m unittest discover -s tests"""
import json
import os
import re
import shutil
import subprocess
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


class Manifest(unittest.TestCase):
    def test_manifest_is_complete(self):
        man = json.loads(read("hub-plugin.json"))
        self.assertEqual((man["name"], man["web"], man["hub"]), ("hide-sidebar", "main.js", "^1.5"))   # sidebar.header — 1.5
        for key in ("icon", "description", "why", "version"):
            self.assertTrue(str(man.get(key) or "").strip(), key)
        for key in ("icon", "web"):
            self.assertTrue(os.path.isfile(os.path.join(ROOT, man[key])), man[key])

    def test_readme_credits_the_icon(self):
        self.assertIn("Иконка — [3D Fluency](https://icons8.com/icons/3d-fluency) от Icons8.", read("README.md"))


class Page(unittest.TestCase):
    def test_contract_is_in_the_code(self):
        main = read("main.js")
        self.assertIn('addEventListener("hub-sidebar"', main)
        self.assertIn('hub.addSlot("sidebar.header"', main)
        self.assertIn('hub.addStyle("style.css")', main)

    def test_style_hides_only_on_wide_screens(self):
        css = read("style.css")
        self.assertRegex(css, r"@media \(min-width: 761px\)\s*\{[^@]*html\.hs-hidden \.app > aside")
        self.assertNotRegex(re.sub(r"@media \(min-width: 761px\)\s*\{.*?\n\}", "", css, flags=re.S), r"hs-hidden")

    def test_head_is_two_rows_on_wide_screens(self):
        css = read("style.css")
        wide = re.search(r"@media \(min-width: 761px\)\s*\{[^@]*\.search-row \{ flex-wrap: wrap[^@]*\.search \{[^}]*flex: 1 1 0", css)
        self.assertTrue(wide, "поиск должен уходить во второй ряд на всю ширину")

    def test_animation_moves_only_transform_and_opacity(self):
        css = read("style.css")
        self.assertIn("view-transition-name", css)
        for kf in re.findall(r"@keyframes hs-[\w-]+ \{([^@]*?)\}\s*(?=@|$)", css, flags=re.S):
            self.assertRegex(kf, r"transform|opacity")
        self.assertNotRegex(css, r"transition:[^;]*(grid-template-columns|width|left)")
        self.assertNotRegex(css, r"@keyframes[^{]*\{[^@]*(grid-template-columns|width:|left:)")

    def test_reduced_motion_is_only_a_fade(self):
        css = read("style.css")
        rm = re.search(r"@media \(prefers-reduced-motion: reduce\)\s*\{(.*?)\n\}", css, flags=re.S)
        self.assertTrue(rm, "нет ветки prefers-reduced-motion")
        self.assertNotIn("translateX", rm.group(1))
        self.assertIn("hs-fade", rm.group(1))

    def test_no_animation_right_after_load_or_without_support(self):
        main = read("main.js")
        self.assertIn("startViewTransition", main)
        self.assertRegex(main, r"!document\.startViewTransition\s*\|\|\s*performance\.now\(\)\s*-\s*loadedAt\s*<\s*\d+")
        self.assertIn("hs-vt", main)

    @unittest.skipUnless(shutil.which("node"), "нет node")
    def test_state_rules(self):
        r = subprocess.run(["node", "--test", os.path.join(ROOT, "tests", "state.test.mjs")], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout[-1500:])


if __name__ == "__main__":
    unittest.main()
