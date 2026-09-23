import { useEffect, useState } from 'react';
import { Bell, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { Link } from 'react-router-dom';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/dashboard/alerts');
        setAlerts(res.data.alerts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const highRisk = alerts.filter((a) => a.riskLevel === 'High');
  const shadowOnly = alerts.filter((a) => a.isShadow && a.riskLevel !== 'High');

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell size={24} className="text-red-500" />
          Active Alerts
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Vendors requiring immediate attention — High Risk or unapproved Shadow tools
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 size={52} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">All Clear!</h2>
          <p className="text-slate-400 text-sm mb-4">
            No high-risk or shadow vendors detected. Your vendor posture looks good.
          </p>
          <Link to="/vendors" className="btn-primary inline-flex">
            Manage Vendors
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AlertBanner
              icon={AlertTriangle}
              color="red"
              count={highRisk.length}
              label="High Risk Vendors"
              description="Vendors with a risk score ≥ 70"
            />
            <AlertBanner
              icon={ShieldAlert}
              color="orange"
              count={shadowOnly.length + alerts.filter(a => a.isShadow && a.riskLevel === 'High').length}
              label="Shadow / Unapproved Tools"
              description="Tools not approved by IT"
            />
          </div>

          {/* High Risk Section */}
          {highRisk.length > 0 && (
            <AlertSection
              title="High Risk Vendors"
              icon={AlertTriangle}
              iconColor="text-red-500"
              borderColor="border-red-200 dark:border-red-800"
              headerBg="bg-red-50 dark:bg-red-900/20"
              vendors={highRisk}
            />
          )}

          {/* Shadow (non-high) Section */}
          {shadowOnly.length > 0 && (
            <AlertSection
              title="Shadow / Unapproved Tools"
              icon={ShieldAlert}
              iconColor="text-orange-500"
              borderColor="border-orange-200 dark:border-orange-800"
              headerBg="bg-orange-50 dark:bg-orange-900/20"
              vendors={shadowOnly}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AlertBanner({ icon: Icon, color, count, label, description }) {
  const colors = {
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
  };
  return (
    <div className={`card flex items-center gap-4 p-4 border ${colors[color]}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'red' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-orange-100 dark:bg-orange-900/40'}`}>
        <Icon size={20} className={color === 'red' ? 'text-red-500' : 'text-orange-500'} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function AlertSection({ title, icon: Icon, iconColor, borderColor, headerBg, vendors }) {
  return (
    <div className={`card overflow-hidden border ${borderColor}`}>
      <div className={`flex items-center gap-2 px-5 py-3 ${headerBg} border-b ${borderColor}`}>
        <Icon size={16} className={iconColor} />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="flex items-start sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{vendor.name}</p>
                {vendor.isShadow && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-700">
                    SHADOW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-slate-400">{vendor.category}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-400">Sensitivity: {vendor.dataSensitivity}</span>
                {!vendor.hasCompliance && (
                  <span className="text-xs text-red-400">• No Compliance Cert</span>
                )}
                {vendor.hasBreachHistory && (
                  <span className="text-xs text-red-400">• Breach History</span>
                )}
              </div>
              {vendor.notes && (
                <p className="text-xs text-slate-400 mt-1 italic">{vendor.notes}</p>
              )}
              {vendor.isShadow && (
                vendor.suggestedAlternative ? (
                  <div className="mt-2.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg flex items-center justify-between gap-2 max-w-lg">
                    <span className="flex items-center gap-1.5">
                      <span>💡</span> Recommended Approved Tool: <strong>{vendor.suggestedAlternative.approvedToolName}</strong>
                    </span>
                    <a
                      href={vendor.suggestedAlternative.approvedToolUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-semibold hover:text-emerald-500 shrink-0"
                    >
                      Visit Tool →
                    </a>
                  </div>
                ) : (
                  <div className="mt-2.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg flex items-center justify-between gap-2 max-w-lg">
                    <span>⚠️ No approved alternative set for category '{vendor.category}'</span>
                    <Link to="/alternatives" className="underline font-semibold hover:text-amber-500 shrink-0">
                      Add Alternative →
                    </Link>
                  </div>
                )
              )}
            </div>
            <RiskBadge level={vendor.riskLevel} score={vendor.riskScore} showScore />
          </div>
        ))}
      </div>
    </div>
  );
}
