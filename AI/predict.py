import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import pickle
import pandas as pd
from urllib.parse import urlparse

from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

from web_analyzer import get_web_content, analyze_content

# Best-effort: use tldextract if available to correctly get registrable domains
try:
    import tldextract
    def get_registered_domain(hostname: str) -> str:
        if not hostname:
            return ""
        try:
            # normalize punycode
            ascii_host = hostname.encode("idna").decode("ascii")
        except Exception:
            ascii_host = hostname
        ext = tldextract.extract(ascii_host)
        if ext.registered_domain:
            return ext.registered_domain.lower()
        # fallback
        return ascii_host.lower()
except Exception:
    def get_registered_domain(hostname: str) -> str:
        # fallback simple heuristic if tldextract not installed
        if not hostname:
            return ""
        try:
            ascii_host = hostname.encode("idna").decode("ascii")
        except Exception:
            ascii_host = hostname
        host = ascii_host.lower()
        if host.startswith("www."):
            host = host[4:]
        parts = host.split(".")
        if len(parts) >= 2:
            return ".".join(parts[-2:])
        return host


def ensure_scheme(url: str) -> str:
    if "//" not in url:
        return "http://" + url
    return url


def get_hostname_from_url(url: str) -> str:
    try:
        parsed = urlparse(url)
        return parsed.hostname or ""
    except Exception:
        return ""


# =====================================
# Load AI Model
# =====================================

print("Loading model...")

model = load_model("models/url_phishing_cnn.keras")

with open("models/tokenizer.pkl", "rb") as f:
    tokenizer = pickle.load(f)

print("Model loaded successfully!")


# =====================================
# Load Whitelist
# =====================================

print("Loading whitelist...")

# top-1m.csv often contains domains like example.com; we convert each to its registrable domain
_df = pd.read_csv(
    "dataset/top-1m.csv",
    header=None,
    names=["rank", "domain"]
)

# normalize and reduce to registrable domain form to compare correctly with final domains
TRUSTED_DOMAINS = set()
for d in _df["domain"].astype(str):
    host = get_hostname_from_url(ensure_scheme(d))
    reg = get_registered_domain(host)
    if reg:
        TRUSTED_DOMAINS.add(reg.lower())

print(f"Loaded {len(TRUSTED_DOMAINS)} trusted domains.")


# =====================================
# Predict URL
# =====================================

def predict_url(raw_url: str):

    url = raw_url.strip()
    if url == "":
        print("Vui lòng nhập URL.")
        return

    # ensure scheme so urlparse works
    url_with_scheme = ensure_scheme(url)

    hostname = get_hostname_from_url(url_with_scheme)
    original_domain = get_registered_domain(hostname)

    print("\n" + "=" * 60)
    print("URL :", raw_url)

    # -----------------------------
    # STEP 1 : Whitelist (original)
    # -----------------------------

    if original_domain in TRUSTED_DOMAINS and original_domain != "":
        print("Status : Trusted Website (matched by original domain)")
        print("Action : Bỏ qua AI và Sandbox")
        return

    # -----------------------------
    # STEP 2 : URL AI
    # -----------------------------

    seq = tokenizer.texts_to_sequences([url])

    pad = pad_sequences(
        seq,
        maxlen=200,
        padding="post"
    )

    prediction = model.predict(pad, verbose=0)

    score = float(prediction[0][0])

    print(f"URL AI Score : {score:.4f}")

    if score < 0.8:
        print("Status : Legitimate URL")
        print("Action : Cho phép truy cập")
        return

    print("\nAI nghi ngờ URL độc hại.")
    print("Đang phân tích nội dung website...")

    # -----------------------------
    # STEP 3 : HTML Analysis (follow redirects and re-check whitelist)
    # -----------------------------

    result = get_web_content(url_with_scheme)

    if not result["success"]:
        print("Không thể truy cập website.")
        print("Action : Đưa vào Sandbox")
        return

    final_url = result.get("final_url", url_with_scheme) or url_with_scheme
    final_hostname = get_hostname_from_url(ensure_scheme(final_url))
    final_domain = get_registered_domain(final_hostname)

    print("Title :", result.get("title", ""))
    print("Final URL :", final_url)

    # If final domain is trusted, allow even if original seemed suspicious
    if final_domain in TRUSTED_DOMAINS and final_domain != "":
        print("Status : Trusted Website (matched by final domain after redirect)")
        print("Action : Cho phép truy cập")
        return

    content_score = analyze_content(result)

    print("Content Score :", content_score)

    # STEP 4 : Final Decision

    if content_score >= 4:
        print("\nStatus : Phishing Website")
        print("Action : Đưa vào Sandbox")
    else:
        print("\nStatus : Legitimate Website")
        print("Action : Cho phép truy cập")


# =====================================
# Main
# =====================================

if __name__ == "__main__":

    print("\n========== URL PHISHING DETECTION ==========")
    print("Nhập 'exit' để thoát.\n")

    while True:

        url = input("Nhập URL: ").strip()

        if url.lower() == "exit":
            print("Đã thoát chương trình.")
            break

        if url == "":
            print("Vui lòng nhập URL.")
            continue

        predict_url(url)
