import { useEffect, useState } from 'react';
import { Download, FileText, RefreshCw, BarChart3, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, vendorsRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/vendors'),
        ]);
        setStats(statsRes.data);
        setVendors(vendorsRes.data.vendors);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    setExportMsg('');
    try {
      const res = await api.get('/api/vendors/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendor-risk-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExportMsg('✓ Report downloaded successfully!');
    } catch (err) {
      setExportMsg('✗ Export failed: ' + err.message);
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { total, shadow, riskDistribution, byCategory } = stats || {};
  const compliance = vendors.filter((v) => v.hasCompliance).length;
  const breached = vendors.filter((v) => v.hasBreachHistory).length;

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-500" />
            Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Vendor risk summary — generated {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || vendors.length === 0}
            className="btn-primary"
          >
            {exporting ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {exportMsg && (
        <div className={`mb-5 px-4 py-2.5 rounded-lg text-sm font-medium ${
          exportMsg.startsWith('✓')
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {exportMsg}
        </div>
      )}

      {vendors.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No vendor data yet. Add some vendors first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-blue-500" />
              Executive Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Vendors', value: total, icon: FileText, color: 'text-blue-500' },
                { label: 'Shadow Tools', value: shadow, icon: AlertTriangle, color: 'text-orange-500' },
                { label: 'With Compliance', value: compliance, icon: CheckCircle2, color: 'text-green-500' },
                { label: 'Breach History', value: breached, icon: AlertTriangle, color: 'text-red-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <Icon size={20} className={`mx-auto mb-2 ${color}`} />
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                  <p className="text-xs text-slate-400 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Breakdown Table */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Risk Level Breakdown</h2>
            <div className="space-y-3">
              {['High', 'Medium', 'Low'].map((level) => {
                const count = riskDistribution?.[level] || 0;
                const pct = total ? Math.round((count / total) * 100) : 0;
                const colors = {
                  High: { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
                  Medium: { bar: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
                  Low: { bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
                };
                return (
                  <div key={level} className="flex items-center gap-3">
                    <RiskBadge level={level} />
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${colors[level].bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold w-16 text-right ${colors[level].text}`}>
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          {byCategory?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Vendors by Category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {byCategory.map(({ category, count }) => (
                  <div key={category} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                    <p className="text-xs text-slate-400 mt-1">{category}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Vendor Table (print-friendly) */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Full Vendor List</h2>
              <span className="text-xs text-slate-400">{vendors.length} vendors</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    {['Name', 'Category', 'Sensitivity', 'Compliance', 'Breach', 'IT Approved', 'Risk'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900 dark:text-white">{v.name}</span>
                          {v.isShadow && (
                            <span className="text-xs font-bold text-orange-500 border border-orange-400 rounded px-1">S</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{v.category}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{v.dataSensitivity}</td>
                      <td className="px-4 py-3">
                        <span className={v.hasCompliance ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                          {v.hasCompliance ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={v.hasBreachHistory ? 'text-red-500' : 'text-green-600 dark:text-green-400'}>
                          {v.hasBreachHistory ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={v.approvedByIT ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}>
                          {v.approvedByIT ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={v.riskLevel} score={v.riskScore} showScore />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
