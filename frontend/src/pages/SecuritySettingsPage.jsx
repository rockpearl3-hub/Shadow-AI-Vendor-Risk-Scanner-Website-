import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { ShieldCheck, ShieldAlert, KeyRound, Clock, Download, RefreshCw, FileText, Sparkles } from 'lucide-react';

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retentionDays, setRetentionDays] = useState(365);
  const [mfaMetrics, setMfaMetrics] = useState({ totalActiveUsers: 0, mfaUsers: 0, mfaAdoptionRate: 0 });
  const [ssoStatus, setSsoStatus] = useState({ googleEnabled: false, microsoftEnabled: false });
  const [auditIntegrity, setAuditIntegrity] = useState(null);
  const [verifyingAudit, setVerifyingAudit] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/settings');
      setRetentionDays(res.data.retentionDays || 365);
      setMfaMetrics(res.data.mfaMetrics || { totalActiveUsers: 0, mfaUsers: 0, mfaAdoptionRate: 0 });
      setSsoStatus(res.data.ssoStatus || { googleEnabled: false, microsoftEnabled: false });
      setAuditIntegrity(res.data.auditIntegrity || null);
    } catch (err) {
      console.error('[fetchSettings]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveRetention = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      await api.put('/api/settings', { retentionDays });
      setMessage('✓ Retention policy updated successfully.');
      fetchSettings();
    } catch (err) {
      setMessage(`✗ ${err.message || 'Failed to update retention policy.'}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleVerifyAudit = async () => {
    try {
      setVerifyingAudit(true);
      const res = await api.post('/api/settings/verify-audit');
      setAuditIntegrity(res.data.auditIntegrity);
    } catch (err) {
      alert(err.message || 'Failed to verify audit log integrity.');
    } finally {
      setVerifyingAudit(false);
    }
  };

  const handleDownloadComplianceReport = async () => {
    try {
      const response = await api.get('/api/settings/compliance-report', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enterprise-compliance-report-${Date.now()}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.message || 'Failed to download compliance report.');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <span>Security & Compliance Settings</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
              Enterprise Hardened
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Configure log retention, verify audit chain integrity, monitor MFA adoption, and export compliance reports for auditors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={handleDownloadComplianceReport}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm px-4 py-2 rounded-lg transition shadow-sm"
          >
            <Download size={16} />
            Export Compliance Summary
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            message.startsWith('✓')
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
          }`}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading security configuration...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Cryptographic Audit Integrity */}
          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Cryptographic Audit Chain</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">SHA-256 HMAC hash tamper verification</p>
                </div>
              </div>
              <button
                onClick={handleVerifyAudit}
                disabled={verifyingAudit}
                className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 disabled:opacity-50"
              >
                <RefreshCw size={12} className={verifyingAudit ? 'animate-spin' : ''} />
                {verifyingAudit ? 'Verifying...' : 'Re-Verify Chain'}
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Chain Status:</span>
                {auditIntegrity?.isIntact ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    ✓ 100% INTACT (No Tampering)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    ⚠️ TAMPERING DETECTED ({auditIntegrity?.compromisedCount} modified)
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Verified Log Entries:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {auditIntegrity?.totalChecked || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Application Layer Immutability:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active (No Update/Delete Routes)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Log Retention Policy */}
          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Audit Log Retention Policy</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Automated purge schedule for compliance compliance</p>
              </div>
            </div>

            <form onSubmit={handleSaveRetention} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Retention Window (Days)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    required
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Policy'}
                  </button>
                </div>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                Log entries older than <b className="text-purple-400">{retentionDays} days</b> will be automatically purged by the background cleanup task.
              </p>
            </form>
          </div>

          {/* Card 3: MFA Adoption Rate */}
          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">MFA Adoption Rate</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">TOTP Authenticator security status</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">MFA Active Accounts:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {mfaMetrics.mfaUsers} of {mfaMetrics.totalActiveUsers}
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${mfaMetrics.mfaAdoptionRate}%` }}
                />
              </div>

              <div className="text-right text-xs font-bold text-emerald-500 font-mono">
                {mfaMetrics.mfaAdoptionRate}% Adoption Rate
              </div>
            </div>
          </div>

          {/* Card 4: SSO Providers Configuration */}
          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">SSO Identity Providers</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">OAuth2 / OpenID Connect integration</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>🔵</span> Google Workspace SSO
                </span>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${ssoStatus.googleEnabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                  {ssoStatus.googleEnabled ? 'Active (.env set)' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>🟦</span> Microsoft Entra ID SSO
                </span>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${ssoStatus.microsoftEnabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                  {ssoStatus.microsoftEnabled ? 'Active (.env set)' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
