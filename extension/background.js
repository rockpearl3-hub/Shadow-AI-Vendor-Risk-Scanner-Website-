// Configurable backend API endpoint
const BACKEND_URL = 'http://localhost:4000/api/detections';

// Hardcoded list of known AI tool domains mapped to friendly names
const AI_TOOL_MAP = {
  "chat.openai.com": "ChatGPT",
  "chatgpt.com": "ChatGPT",
  "claude.ai": "Claude AI",
  "midjourney.com": "Midjourney",
  "notion.so": "Notion AI",
  "jasper.ai": "Jasper AI",
  "grammarly.com": "Grammarly",
  "perplexity.ai": "Perplexity AI",
  "copilot.microsoft.com": "Microsoft Copilot",
  "gemini.google.com": "Google Gemini",
  "otter.ai": "Otter.ai",
  "deepl.com": "DeepL Translator",
  "canva.com": "Canva",
  "huggingface.co": "Hugging Face"
};

/**
 * Match a hostname against known AI tool domains
 */
function getMatchingTool(hostname) {
  if (!hostname) return null;
  const cleanHost = hostname.toLowerCase();

  for (const [domain, name] of Object.entries(AI_TOOL_MAP)) {
    if (cleanHost === domain || cleanHost.endsWith('.' + domain)) {
      return { domain, name };
    }
  }
  return null;
}

/**
 * Listen for tab updates
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  try {
    const urlObj = new URL(tab.url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return;

    const match = getMatchingTool(urlObj.hostname);
    if (match) {
      processDetection(match.domain, match.name);
    }
  } catch (e) {
    console.error('[Shadow AI] Error parsing tab URL:', e);
  }
});

/**
 * Process detection with 1-hour deduplication window
 */
function processDetection(domain, toolName) {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const now = Date.now();
  const detectedAt = new Date().toISOString();

  chrome.storage.local.get(['lastReported', 'recentDetections'], (result) => {
    const lastReported = result.lastReported || {};
    let recentDetections = result.recentDetections || [];

    const lastSentTime = lastReported[domain] || 0;
    const isNewReport = (now - lastSentTime) > ONE_HOUR_MS;

    const detectionItem = {
      domain,
      toolName,
      detectedAt,
      timestamp: now,
      reported: isNewReport
    };

    // Keep top 20 recent detections for popup UI
    recentDetections = [
      detectionItem,
      ...recentDetections.filter(item => item.domain !== domain)
    ].slice(0, 20);

    if (isNewReport) {
      lastReported[domain] = now;
      chrome.storage.local.set({ lastReported, recentDetections }, () => {
        sendReport(domain, toolName, detectedAt);
      });
    } else {
      chrome.storage.local.set({ recentDetections });
      console.log(`[Shadow AI] Skipped backend report for ${toolName} (${domain}) - reported within the last 1 hour.`);
    }
  });
}

/**
 * Send POST request to backend API
 */
async function sendReport(domain, toolName, detectedAt) {
  try {
    console.log(`[Shadow AI] Sending detection report for ${toolName} (${domain}) to ${BACKEND_URL}...`);
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, toolName, detectedAt })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Shadow AI] Backend successfully recorded detection:', data);
    } else {
      console.error('[Shadow AI] Backend returned error status:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('[Shadow AI] Network error sending detection report:', error);
  }
}
