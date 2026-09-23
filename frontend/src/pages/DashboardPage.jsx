import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Search, Plus, ExternalLink
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import RiskBadge from '../components/RiskBadge';

const PIE_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
const BAR_COLORS = ['#0ea5e9', '#8b5cf6', '#06b6d4', '#f59e0b'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, alertsRes, vendorsRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/alerts'),
          api.get('/api/vendors'),
        ]);
        setStats(statsRes.data);
        setAlerts(alertsRes.data.alerts.slice(0, 5));
        setVendors(vendorsRes.data.vendors);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pieData = stats
    ? Object.entries(stats.riskDistribution)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const barData = stats?.byCategory || [];

  const filteredVendors = vendors.filter(
    (v) => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Security Operations Dashboard</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time shadow AI detection, risk distribution, and vendor remediation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/vendors"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            Manage Vendors
          </Link>
        </div>
      </div>

      {/* 1. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tracked Vendors"
          value={stats?.total ?? 0}
          subtitle="All cataloged AI & SaaS tools"
          icon={Building2}
          color="blue"
        />
        <StatsCard
          title="Shadow AI Tools"
          value={stats?.shadow ?? 0}
          subtitle="Unapproved employee visits"
          icon={ShieldAlert}
          color="orange"
        />
        <StatsCard
          title="High Risk Services"
          value={stats?.riskDistribution?.High ?? 0}
          subtitle="Requires security review"
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="IT Approved & Compliant"
          value={stats?.riskDistribution?.Low ?? 0}
          subtitle="Verified compliance posture"
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-sky-500" />
            Risk Distribution Overview
          </h2>
          {pieData.length === 0 ? (
            <EmptyChart message="No vendor data logged yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart by Category */}
        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-purple-500" />
            Vendor Volume by Category
          </h2>
          {barData.length === 0 ? (
            <EmptyChart message="No vendor categories logged yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={26}>
                <XAxis
                  dataKey="category"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Recent Shadow Alerts Callout */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Active Security Alerts
          </h2>
          <Link to="/alerts" className="text-sky-500 hover:text-sky-400 text-xs font-semibold">
            View All Alerts
          </Link>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-xs">No active alerts — vendor posture is fully compliant.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {alerts.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between py-3 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{vendor.name}</p>
                    {vendor.isShadow && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Shadow
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{vendor.category} • Sensitivity: {vendor.dataSensitivity}</p>
                </div>
                <RiskBadge level={vendor.riskLevel} score={vendor.riskScore} showScore />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Complete Single-Page Vendor Inventory Table */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Vendor Inventory & Remediation Table</h2>
            <p className="text-xs text-slate-400 mt-0.5">Comprehensive view of all vendors, risk scores, and IT-approved alternatives</p>
          </div>

          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 pl-8 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Search size={13} className="text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3">Vendor / Tool</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Sensitivity</th>
                <th className="px-5 py-3">Risk Assessment</th>
                <th className="px-5 py-3">Suggested Alternative</th>
                <th className="px-5 py-3">IT Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No vendors found in inventory matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{vendor.name}</span>
                        {vendor.isShadow && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            SHADOW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{vendor.category}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        vendor.dataSensitivity === 'High'
                          ? 'bg-rose-500/10 text-rose-500'
                          : vendor.dataSensitivity === 'Medium'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {vendor.dataSensitivity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge level={vendor.riskLevel} score={vendor.riskScore} showScore />
                    </td>
                    <td className="px-5 py-3.5">
                      {vendor.isShadow ? (
                        vendor.suggestedAlternative ? (
                          <a
                            href={vendor.suggestedAlternative.approvedToolUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                          >
                            <span>{vendor.suggestedAlternative.approvedToolName}</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            ⚠️ Needs Review
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">N/A (Approved)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${vendor.approvedByIT ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {vendor.approvedByIT ? '✓ Approved' : '✗ Unapproved'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-[220px] text-slate-400 text-xs">
      {message}
    </div>
  );
}
