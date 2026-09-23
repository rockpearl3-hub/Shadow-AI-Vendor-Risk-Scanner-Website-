# Shadow AI Detector - Chrome Extension (Phase 2)

The **Shadow AI Detector** is a privacy-respecting Chrome browser extension (Manifest V3) that monitors employee visits to known third-party AI tool websites (such as ChatGPT, Claude AI, Perplexity, DeepL, Canva, etc.) and automatically reports them to the central **Shadow AI & Vendor Risk Scanner** backend server.

---

## 🚀 Key Features

1. **Automatic Detection**: Intercepts completed tab navigations (`chrome.tabs.onUpdated`) and checks hostnames against a list of known AI tool domains.
2. **Deduplication Window**: Prevents duplicate backend reporting by maintaining a 1-hour cooldown window per tool in `chrome.storage.local`.
3. **Session Dashboard UI**: Clickable extension popup displays real-time status and a list of AI tools visited during the current session.
4. **Privacy-Respecting**: Only checks domain names against hardcoded AI hostnames. **Never** reads page contents, form entries, or search queries.

---

## 🛠️ How to Load Unpacked in Chrome

1. Ensure the **Shadow AI Backend Server** is running locally (`http://localhost:4000`).
2. Open Chrome and navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `extension/` folder from this repository.
6. The **Shadow AI Detector** extension icon will appear in your Chrome extension bar.

---

## 🧪 End-to-End Verification Test

1. With the extension loaded, visit any supported AI tool website in Chrome, e.g.:
   - `https://chatgpt.com`
   - `https://claude.ai`
   - `https://www.perplexity.ai`
2. Open the extension popup from your toolbar to verify the tool is logged under **Session Detections**.
3. Open the main Web Dashboard (`http://localhost:5173`) and refresh — the newly detected AI tool will automatically appear as an unapproved **Shadow** vendor with a calculated risk score (Medium risk, 50 pts default).
