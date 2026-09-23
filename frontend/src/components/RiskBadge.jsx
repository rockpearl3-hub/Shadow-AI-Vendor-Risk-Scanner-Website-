const RISK_CONFIG = {
  Critical: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-700',
    dot: 'bg-purple-600 dark:bg-purple-400',
    emoji: '🟣',
  },
  High: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    emoji: '🔴',
  },
  Medium: {
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500',
    emoji: '🟡',
  },
  Low: {
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    emoji: '🟢',
  },
};

const FACTOR_LABELS = {
  dataSensitivity: { label: 'Data Sensitivity', icon: '🗂️' },
  authMethod:      { label: 'Auth Method',       icon: '🔑' },
  securityPosture: { label: 'Security Posture',  icon: '🛡️' },
  blastRadius:     { label: 'Blast Radius',      icon: '💥' },
  aiDataRisk:      { label: 'AI Data Risk',      icon: '🤖' },
};

/**
 * Displays a colored risk level badge with optional score and breakdown tooltip.
 * @param {string}  level          - "Low" | "Medium" | "High" | "Critical"
 * @param {number}  score          - 0–100 numeric score
 * @param {boolean} showScore      - whether to show numeric score in badge
 * @param {object}  scoreBreakdown - optional breakdown from the risk engine
 */
export default function RiskBadge({ level, score, showScore = false, scoreBreakdown }) {
  const config = RISK_CONFIG[level] || RISK_CONFIG.Low;
  const hasBreakdown = scoreBreakdown && Object.keys(scoreBreakdown).length > 0;

  return (
    <div className="relative inline-flex group">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-default ${config.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
        {level}
        {showScore && score !== undefined && (
          <span className="opacity-70">({score})</span>
        )}
      </span>

      {/* Breakdown tooltip — visible on hover */}
      {hasBreakdown && (
        <div
          className="
            absolute z-50 left-0 top-full mt-2 w-64
            bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-xl shadow-2xl
            p-3 space-y-2
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200 pointer-events-none
          "
          role="tooltip"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Score Breakdown
          </p>
          {Object.entries(scoreBreakdown).map(([factor, { weighted, max }]) => {
            const meta = FACTOR_LABELS[factor] || { label: factor, icon: '📊' };
            const pct = max > 0 ? Math.round((weighted / max) * 100) : 0;
            return (
              <div key={factor} className="flex items-center gap-2">
                <span className="text-sm w-5 text-center shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[11px] text-slate-300 font-medium truncate">{meta.label}</span>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                      {weighted}/{max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 80 ? 'bg-red-500' :
                        pct >= 50 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
            <span className="text-[11px] text-slate-400 font-bold">Total Risk Score</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
              {score}/100
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

