# Makes public/images/og.png from design/og.html. Needs: pip install playwright pillow; playwright install chromium
# The screenshot is reduced to 256 colours, which keeps it about a tenth of the size with no visible change.
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
here = Path(__file__).resolve().parent
out = here.parent / "public" / "images" / "og.png"
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1200, "height": 630})
    page.goto((here / "og.html").as_uri())
    page.wait_for_timeout(300)
    page.screenshot(path=str(out))
    browser.close()
Image.open(out).convert("RGB").quantize(256, dither=Image.Dither.NONE).save(out, optimize=True)
