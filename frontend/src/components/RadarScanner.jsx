import { useState, useEffect } from 'react';

const MOCK_DETECTIONS = [
  {
    id: 'chatgpt',
    domain: 'chatgpt.com',
    toolName: 'ChatGPT',
    category: 'AI Tool',
    detectedAt: 'Just now',
    riskScore: 50,
    riskLevel: 'Medium',
    status: 'Shadow',
    sensitivity: 'Medium',
    compliance: false,
    alternative: {
      name: 'Microsoft Copilot Enterprise',
      url: 'https://copilot.microsoft.com',
    },
  },
  {
    id: 'claude',
    domain: 'claude.ai',
    toolName: 'Claude AI',
    category: 'AI Tool',
    detectedAt: '2m ago',
    riskScore: 50,
    riskLevel: 'Medium',
    status: 'Shadow',
    sensitivity: 'Medium',
    compliance: false,
    alternative: {
      name: 'Microsoft Copilot Enterprise',
      url: 'https://copilot.microsoft.com',
    },
  },
  {
    id: 'midjourney',
    domain: 'midjourney.com',
    toolName: 'Midjourney',
    category: 'AI Tool',
    detectedAt: '5m ago',
    riskScore: 70,
    riskLevel: 'High',
    status: 'Shadow',
    sensitivity: 'High',
    compliance: false,
    alternative: {
      name: 'Canva Enterprise',
      url: 'https://canva.com',
    },
  },
  {
    id: 'untracked-ai',
    domain: 'custom-gpt-wrapper.ai',
    toolName: 'Unknown AI Service',
    category: 'AI Tool',
    detectedAt: '12m ago',
    riskScore: 80,
    riskLevel: 'High',
    status: 'Shadow',
    sensitivity: 'High',
    compliance: false,
    alternative: null, // Needs review
  },
];

export default function RadarScanner() {
  const [activeItem, setActiveItem] = useState(MOCK_DETECTIONS[0]);
  const [scanPulse, setScanPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanPulse((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-slate-950 border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6 text-slate-100 font-sans">
      {/* Scanner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-3.5 h-3.5">
            <span className={`absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 ${scanPulse ? 'animate-ping' : ''}`} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span>Live Shadow AI Radar Scanner</span>
              <span className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-mono">
                Active Monitoring
              </span>
            </div>
            <p className="text-xs text-slate-400">Simulated real-time tab navigation detection stream</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>4 Unapproved Detections Today</span>
        </div>
      </div>

      {/* Main Radar Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Domain Stream List */}
        <div className="md:col-span-6 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Detected Employee AI Tool Visits
          </div>
          {MOCK_DETECTIONS.map((item) => {
            const isSelected = activeItem.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-900 border-sky-500/60 ring-1 ring-sky-500/30'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{item.toolName}</span>
                    <span className="text-xs text-slate-400 font-mono">({item.domain})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Visited {item.detectedAt}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      item.riskLevel === 'High'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    Risk {item.riskScore}/100
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Selected Item Inspection & Remediation */}
        <div className="md:col-span-6 bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-slate-400">Inspected Service</span>
                <h3 className="text-base font-bold text-slate-100">{activeItem.toolName}</h3>
              </div>
              <span className="text-xs font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded">
                Unapproved (Shadow Entry)
              </span>
            </div>

            {/* Risk Factors Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Data Sensitivity</span>
                <span className="font-medium text-slate-200">{activeItem.sensitivity} Sensitivity</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Compliance Cert</span>
                <span className="font-medium text-rose-400">None Provided</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">IT Approval</span>
                <span className="font-medium text-amber-400">Not Approved</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Calculated Score</span>
                <span className="font-bold text-sky-400">{activeItem.riskScore} / 100 ({activeItem.riskLevel})</span>
              </div>
            </div>

            {/* Remediation Callout */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>💡 Automated IT Remediation Guidance</span>
              </div>
              {activeItem.alternative ? (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300 space-y-1.5">
                  <div>
                    This tool is unapproved. Employees visiting this domain are guided to:
                  </div>
                  <div className="font-semibold text-emerald-200">
                    {activeItem.alternative.name}
                  </div>
                  <a
                    href={activeItem.alternative.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-emerald-400 underline font-medium hover:text-emerald-300"
                  >
                    View IT Approved Policy Tool
                  </a>
                </div>
              ) : (
                <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300">
                  ⚠️ No alternative configured for this category yet. Flagged as <b>Needs Review</b> for admin assignment.
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3 flex items-center justify-between">
            <span>Automatic Database Sync</span>
            <span className="font-mono text-slate-400">Status: Cataloged in Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
