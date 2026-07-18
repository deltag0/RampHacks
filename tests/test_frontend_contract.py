import re
import shutil
import subprocess
import unittest
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "static" / "index.html"


class IdCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []

    def handle_starttag(self, _tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"])


class StorytellerFrontendContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = INDEX.read_text(encoding="utf-8")
        script_match = re.search(r"<script>(.*)</script>", cls.html, re.DOTALL)
        if not script_match:
            raise AssertionError("static/index.html must contain its application script")
        cls.script = script_match.group(1)

    def test_required_storyteller_surfaces_exist_with_unique_ids(self):
        parser = IdCollector()
        parser.feed(self.html)
        self.assertEqual(len(parser.ids), len(set(parser.ids)), "HTML IDs must be unique")
        required_ids = {
            "crewName",
            "memberNames",
            "storyStripCard",
            "momentOverlay",
            "review",
            "reviewGrid",
            "generating",
            "generatingCopy",
            "scrapbook",
        }
        self.assertTrue(required_ids.issubset(parser.ids))

    def test_dynamic_text_avoids_unsafe_html_sinks(self):
        self.assertNotIn("innerHTML", self.script)
        self.assertNotIn("outerHTML", self.script)
        self.assertIn("textContent", self.script)

    def test_capture_and_completion_use_the_story_flow(self):
        self.assertIn("const maxEdge = 1024", self.script)
        self.assertIn('toDataURL("image/jpeg", .65)', self.script)
        self.assertIn('fetch("/api/story"', self.script)
        self.assertNotIn('fetch("/api/recap"', self.script)
        self.assertIn("showReview();", self.script)
        self.assertIn("localFallbackStory", self.script)

    def test_photo_data_is_not_written_to_browser_storage(self):
        persistence_match = re.search(
            r"function persistCollection\(records\) \{(.*?)\n\}",
            self.script,
            re.DOTALL,
        )
        self.assertIsNotNone(persistence_match)
        self.assertNotIn("imageDataUrl", persistence_match.group(1))
        self.assertNotIn("thumbnail", persistence_match.group(1))
        self.assertNotRegex(self.script, r"localStorage\.setItem\([^)]*data:image")

    def test_mobile_reduced_motion_and_print_styles_are_present(self):
        self.assertIn("@media (max-width: 640px)", self.html)
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.html)
        self.assertIn("@media print", self.html)
        self.assertIn("Print / Save PDF", self.html)

    def test_inline_javascript_parses(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("Node.js is not installed")
        result = subprocess.run(
            [node, "--check"],
            input=self.script,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
