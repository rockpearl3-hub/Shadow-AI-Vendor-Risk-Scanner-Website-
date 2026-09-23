import { useState, useEffect } from 'react';
import api from '../services/api';

export default function VendorHistoryModal({ vendorId, vendorName, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/audit-logs/vendor/${vendorId}`);
        setHistory(res.data.history || []);
      } catch (err) {
        setError(err.message || 'Failed to load vendor history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [vendorId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm font-sans">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Audit History: {vendorName}</span>
            </h2>
            <p className="text-xs text-slate-400">Timeline of approval changes, risk scoring, and detections</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading history timeline...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No historical audit entries found for this vendor.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-4 py-2">
              {history.map((item) => {
                let parsedDetails = null;
                try {
                  parsedDetails = item.details ? JSON.parse(item.details) : null;
                } catch {
                  parsedDetails = item.details;
                }

                return (
                  <div key={item.id} className="relative pl-6">
                    {/* Timeline Node */}
                    <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-sky-500 border-2 border-white dark:border-slate-800" />
                    
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono text-[11px] text-sky-600 dark:text-sky-400">
                          {item.action.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Triggered by: <span className="font-semibold">{item.userEmail || item.user?.email || 'System'}</span>
                      </div>

                      {parsedDetails && (
                        <div className="mt-2 bg-slate-100 dark:bg-slate-950 p-2 rounded text-[11px] font-mono text-slate-500 dark:text-slate-400 overflow-x-auto max-h-32">
                          {typeof parsedDetails === 'object' ? (
                            <pre className="whitespace-pre-wrap">{JSON.stringify(parsedDetails, null, 2)}</pre>
                          ) : (
                            <span>{parsedDetails}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
