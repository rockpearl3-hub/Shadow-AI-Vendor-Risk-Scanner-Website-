document.addEventListener('DOMContentLoaded', () => {
  const listContainer = document.getElementById('detection-list');
  const remediationContainer = document.getElementById('remediation-container');
  const clearBtn = document.getElementById('clear-btn');
  const BACKEND_BASE_URL = 'http://localhost:4000';

  async function checkApprovedAlternative(category = 'AI Tool') {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/alternatives/category/${encodeURIComponent(category)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.alternative) {
          const alt = data.alternative;
          remediationContainer.innerHTML = `
            <div class="alternative-notice">
              <div class="alt-header">
                <span>💡</span> Approved Alternative Available
              </div>
              <div class="alt-body">
                This tool isn't approved by IT. Try <b>${escapeHtml(alt.approvedToolName)}</b> instead!
              </div>
              <a href="${escapeHtml(alt.approvedToolUrl)}" target="_blank" class="alternative-btn">
                Use ${escapeHtml(alt.approvedToolName)} →
              </a>
            </div>
          `;
          return;
        }
      }
    } catch (e) {
      console.warn('[Shadow AI Popup] Could not fetch alternative:', e);
    }

    // Default notice if no alternative configured yet
    remediationContainer.innerHTML = `
      <div class="no-alt-notice">
        ⚠️ <b>Unapproved AI Tool Detected</b><br>
        Visits are logged for IT security review. Please ensure data policy compliance.
      </div>
    `;
  }

  function renderDetections() {
    chrome.storage.local.get('recentDetections', (result) => {
      const detections = result.recentDetections || [];

      if (detections.length === 0) {
        remediationContainer.innerHTML = '';
        listContainer.innerHTML = `
          <div class="empty-state">
            No AI tool visits detected in this browser session.<br><br>
            Visit a website like <b>chatgpt.com</b> or <b>claude.ai</b> to test auto-detection.
          </div>
        `;
        return;
      }

      // Render remediation recommendation notice based on most recent detection
      const latestDetection = detections[0];
      checkApprovedAlternative('AI Tool');

      listContainer.innerHTML = detections.map(item => {
        const timeAgo = formatTimeAgo(new Date(item.detectedAt));
        return `
          <div class="detection-card">
            <div class="tool-info">
              <span class="tool-name">${escapeHtml(item.toolName)}</span>
              <span class="tool-domain">${escapeHtml(item.domain)}</span>
            </div>
            <span class="time-badge">${timeAgo}</span>
          </div>
        `;
      }).join('');
    });
  }

  clearBtn.addEventListener('click', () => {
    chrome.storage.local.set({ recentDetections: [] }, () => {
      renderDetections();
    });
  });

  function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (isNaN(seconds) || seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  renderDetections();
});
