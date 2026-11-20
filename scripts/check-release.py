"""Check the student entry points and assets before publishing to GitHub Pages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
HOME = "https://roknnaoms-hub.github.io/kcli-homepage/"
LMS = "https://kcli-iso19011-records.roknaoms.chatgpt.site/classroom"

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.assets = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "a" and data.get("href"):
            self.links.append((data["href"], data.get("target")))
        if tag in ("script", "img") and data.get("src"):
            self.assets.append(data["src"])
        if tag == "link" and "stylesheet" in data.get("rel", "").split():
            self.assets.append(data["href"])

def check():
    issues = []
    pages = list(ROOT.rglob("index.html"))
    for path in pages:
        relative = path.relative_to(ROOT)
        if any(part.startswith(".") or part == "node_modules" for part in relative.parts):
            continue
        text = path.read_text(encoding="utf8")
        if "kcli-edu-dev.roknaoms.chatgpt.site" in text:
            issues.append(f"{relative} links to the development site")
        page = Page()
        page.feed(text)
        if str(relative) in {"index.html", "iso-19011-classroom/index.html", "en/index.html", "en/iso-19011-classroom/index.html"}:
            target = LMS + ("?lang=en" if relative.parts[0] == "en" else "")
            if (target, "_top") not in page.links:
                issues.append(f"{relative} is missing the learner sign-in link")
        for href in page.assets:
            absolute = urljoin(HOME + relative.as_posix(), href)
            if absolute.startswith(HOME):
                asset = ROOT / unquote(urlsplit(absolute[len(HOME):]).path)
                if not asset.is_file():
                    issues.append(f"{relative} refers to missing asset {href}")
    for script in (ROOT / "js").glob("*.js"):
        if "kcli-edu-dev.roknaoms.chatgpt.site" in script.read_text(encoding="utf8"):
            issues.append(f"{script.name} contains the development site address")
    catalog = json.loads((ROOT / "iso-19011-classroom/lessons.json").read_text(encoding="utf8"))
    if [entry.get("id") for entry in catalog] != list(range(1, 13)):
        issues.append("Expected all 12 lessons in order")
    return issues

if __name__ == "__main__":
    errors = check()
    if errors:
        sys.exit("\n".join(errors))
    print("Verified homepage assets, KO/EN sign-in, production routing and all 12 lesson IDs.")
