import requests
from bs4 import BeautifulSoup
import re
import time
from urllib.parse import urljoin


def _requests_get(url, headers=None, timeout=10, allow_redirects=True):
    # small wrapper to centralize requests.get call and headers
    if headers is None:
        headers = {"User-Agent": "Mozilla/5.0"}
    return requests.get(url, headers=headers, timeout=timeout, allow_redirects=allow_redirects)


def get_web_content(url, try_render_js=False):
    """Fetch a URL and return parsed information.

    Enhancements:
    - Detect meta-refresh and extract the target URL.
    - Scan inline JS for common redirect patterns (location.href, replace, assign).
    - Optionally try to render the page with Selenium (if installed) to catch JS redirects and dynamic content.

    Returns a dict with keys:
      success, title, text, forms, links, images, iframes, javascript,
      final_url, has_redirect, meta_refresh_url, js_redirect_url, meta_followed, selenium_ran
    """
    try:
        headers = {"User-Agent": "Mozilla/5.0"}

        response = _requests_get(url, headers=headers, timeout=10, allow_redirects=True)

        final_url = response.url

        soup = BeautifulSoup(response.text, "html.parser")

        # collect inline JS
        scripts = soup.find_all("script")
        js_code = ""
        for script in scripts:
            # script.string can be None if script contains children or comments
            text = script.string or script.get_text("", strip=True) or ""
            js_code += text + "\n"

        js_code_lower = js_code.lower()

        title = soup.title.string if soup.title else ""

        text = soup.get_text(" ", strip=True)

        forms = len(soup.find_all("form"))
        links = len(soup.find_all("a"))
        images = len(soup.find_all("img"))
        iframes = len(soup.find_all("iframe"))

        has_redirect = response.url != url

        meta_refresh_url = None
        meta_followed = False

        # Detect meta refresh
        meta = soup.find("meta", attrs={"http-equiv": lambda x: x and x.lower() == "refresh"})
        if meta and meta.get("content"):
            # content format: "5; url=http://example.com"
            m = re.search(r"url=(.+)$", meta.get("content"), flags=re.I)
            if m:
                candidate = m.group(1).strip().strip('"\'')
                meta_refresh_url = urljoin(final_url, candidate)

        # Detect JS-based redirects by regex on collected JS
        js_redirect_url = None
        js_patterns = [
            r"location\.href\s*=\s*['\"](?P<url>[^'\"]+)['\"]",
            r"window\.location(?:\.href)?\s*=\s*['\"](?P<url>[^'\"]+)['\"]",
            r"location\.replace\(\s*['\"](?P<url>[^'\"]+)['\"]\s*\)",
            r"location\.assign\(\s*['\"](?P<url>[^'\"]+)['\"]\s*\)",
            r"window\.location\.replace\(\s*['\"](?P<url>[^'\"]+)['\"]\s*\)",
            r"document\.location\s*=\s*['\"](?P<url>[^'\"]+)['\"]",
            r"window\.location\.href\(\)",
        ]

        for p in js_patterns:
            m = re.search(p, js_code, flags=re.I)
            if m and m.groupdict().get("url"):
                js_redirect_url = urljoin(final_url, m.groupdict()["url"].strip())
                break

        selenium_ran = False
        rendered_final_url = None
        rendered_html = None

        # If meta refresh is present, follow it (server-side)
        if meta_refresh_url:
            try:
                r2 = _requests_get(meta_refresh_url, headers=headers, timeout=10, allow_redirects=True)
                meta_followed = True
                rendered_final_url = r2.url
                rendered_html = r2.text
                # update soup/js_code to reflect the meta-followed page
                soup = BeautifulSoup(rendered_html, "html.parser")
                scripts = soup.find_all("script")
                js_code = ""
                for script in scripts:
                    text = script.string or script.get_text("", strip=True) or ""
                    js_code += text + "\n"
                js_code_lower = js_code.lower()
                # recalc counts based on new soup
                title = soup.title.string if soup.title else title
                text = soup.get_text(" ", strip=True)
                forms = len(soup.find_all("form"))
                links = len(soup.find_all("a"))
                images = len(soup.find_all("img"))
                iframes = len(soup.find_all("iframe"))
                final_url = rendered_final_url
                has_redirect = True
            except Exception:
                # if following fails, just continue with original response
                meta_followed = False

        # If JS redirect patterns exist and user asked to render JS, try Selenium to execute JS
        if js_redirect_url or (try_render_js and "window.location" in js_code_lower):
            try:
                # lazy import selenium to avoid hard dependency
                from selenium import webdriver
                from selenium.webdriver.chrome.options import Options
                # webdriver-manager to auto-download driver if available
                try:
                    from webdriver_manager.chrome import ChromeDriverManager
                    driver_path = ChromeDriverManager().install()
                except Exception:
                    driver_path = None

                options = Options()
                options.add_argument("--headless=new") if hasattr(options, 'add_argument') else None
                options.add_argument("--disable-gpu")
                options.add_argument("--no-sandbox")
                options.add_argument("--disable-dev-shm-usage")
                options.add_argument("--window-size=1280,800")

                if driver_path:
                    driver = webdriver.Chrome(executable_path=driver_path, options=options)
                else:
                    driver = webdriver.Chrome(options=options)

                selenium_ran = True
                driver.set_page_load_timeout(15)
                driver.get(final_url)
                # small wait for redirects or JS to run
                time.sleep(2)
                rendered_final_url = driver.current_url
                rendered_html = driver.page_source
                driver.quit()

                # update soup/js_code and counts using rendered_html
                soup = BeautifulSoup(rendered_html, "html.parser")
                scripts = soup.find_all("script")
                js_code = ""
                for script in scripts:
                    text = script.string or script.get_text("", strip=True) or ""
                    js_code += text + "\n"
                js_code_lower = js_code.lower()
                title = soup.title.string if soup.title else title
                text = soup.get_text(" ", strip=True)
                forms = len(soup.find_all("form"))
                links = len(soup.find_all("a"))
                images = len(soup.find_all("img"))
                iframes = len(soup.find_all("iframe"))
                final_url = rendered_final_url
                has_redirect = True

            except Exception:
                # If Selenium not available or fails, continue without rendering
                selenium_ran = False

        return {
            "success": True,
            "title": title,
            "text": text,
            "forms": forms,
            "links": links,
            "images": images,
            "iframes": iframes,
            "javascript": js_code.lower(),
            "final_url": final_url,
            "has_redirect": has_redirect,
            "meta_refresh_url": meta_refresh_url,
            "js_redirect_url": js_redirect_url,
            "meta_followed": meta_followed,
            "selenium_ran": selenium_ran
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def analyze_content(data):
    """Score content for phishing indicators.

    Adds extra weight for meta-refresh and JS redirects.
    """
    suspicious_words = [
        "login",
        "password",
        "verify",
        "account",
        "bank",
        "credit card",
        "paypal",
        "security",
        "confirm",
        "update account"
    ]

    title = data.get("title", "") or ""
    text = data.get("text", "") or ""
    combined = (title + " " + text).lower()

    score = 0

    js = data.get("javascript", "") or ""

    for word in suspicious_words:
        if word in combined:
            score += 1

    if data.get("forms", 0) > 0:
        score += 2

    if data.get("iframes", 0) > 0:
        score += 1

    # JS patterns that are dangerous
    dangerous_js = [
        "eval(",
        "document.write(",
        "atob(",
        "unescape(",
        "fromcharcode(",
        "settimeout(",
        "setinterval(",
        "fetch(",
        "xmlhttprequest",
        "websocket",
        "crypto.subtle",
        "navigator.clipboard"
    ]

    for keyword in dangerous_js:
        if keyword in js:
            score += 2

    # Meta-refresh detected is suspicious (automated redirect)
    if data.get("meta_refresh_url"):
        score += 1

    # JS redirect detection is more suspicious
    if data.get("js_redirect_url"):
        score += 2

    # If Selenium rendered the page and there was a redirect, increase suspicion slightly
    if data.get("selenium_ran") and data.get("has_redirect"):
        score += 1

    return score
