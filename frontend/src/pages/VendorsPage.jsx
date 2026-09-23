import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Plus, Search, Filter, Upload, Pencil, Trash2, ArrowUpDown, ChevronUp, ChevronDown, History, Lock
} from 'lucide-react';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import VendorForm from '../components/VendorForm';
import VendorHistoryModal from '../components/VendorHistoryModal';
import { useAuth } from '../context/AuthContext';

const RISK_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function VendorsPage() {
  const { isAdmin } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortKey, setSortKey] = useState('riskScore');
  const [sortDir, setSortDir] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [historyVendor, setHistoryVendor] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/vendors');
      setVendors(res.data.vendors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleCreate = async (form) => {
    if (!isAdmin) return;
    await api.post('/api/vendors', form);
    await fetchVendors();
  };

  const handleUpdate = async (form) => {
    if (!isAdmin) return;
    await api.put(`/api/vendors/${editVendor.id}`, form);
    await fetchVendors();
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    await api.delete(`/api/vendors/${id}`);
    setDeleteId(null);
    await fetchVendors();
  };

  const handleImport = async (e) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Importing...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/vendors/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportStatus(`✓ ${res.data.message}`);
      await fetchVendors();
    } catch (err) {
      setImportStatus(`✗ ${err.message}`);
    } finally {
      e.target.value = '';
      setTimeout(() => setImportStatus(''), 4000);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // Filter + sort
  const filtered = vendors
    .filter((v) => {
      const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase());
      const matchRisk = !filterRisk || v.riskLevel === filterRisk;
      const matchCat = !filterCategory || v.category === filterCategory;
      return matchSearch && matchRisk && matchCat;
    })
    .sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (sortKey === 'riskLevel') {
        aVal = RISK_ORDER[a.riskLevel];
        bVal = RISK_ORDER[b.riskLevel];
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const categories = [...new Set(vendors.map((v) => v.category))];

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown size={14} className="text-slate-400" />;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="text-sky-500" />
      : <ChevronDown size={14} className="text-sky-500" />;
  };

  const Th = ({ col, children }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
      onClick={() => handleSort(col)}
    >
      <div className="flex items-center gap-1.5">
        {children}
        <SortIcon col={col} />
      </div>
    </th>
  );

  return (
    <div className="p-6 lg:p-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Vendors & Tools</span>
            {!isAdmin && (
              <span className="text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock size={12} /> Read-Only Mode (Viewer Role)
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} tracked in risk registry
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
            <button className="btn-secondary text-sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={15} />
              Import CSV
            </button>
            <button
              className="btn-primary text-sm"
              onClick={() => { setEditVendor(null); setShowForm(true); }}
            >
              <Plus size={15} />
              Add Vendor
            </button>
          </div>
        )}
      </div>

      {/* Import status */}
      {importStatus && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
          importStatus.startsWith('✓')
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : importStatus === 'Importing...'
            ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
        }`}>
          {importStatus}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            className="select text-sm w-auto"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
          >
            <option value="">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            className="select text-sm w-auto"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <Th col="name">Name</Th>
                <Th col="category">Category</Th>
                <Th col="dataSensitivity">Sensitivity</Th>
                <Th col="riskScore">Risk Score</Th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Suggested Alternative</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading vendors...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <p className="text-slate-400 text-sm">No vendors match your filters.</p>
                    <button className="mt-3 text-sky-500 text-sm hover:underline" onClick={() => { setSearch(''); setFilterRisk(''); setFilterCategory(''); }}>
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{vendor.name}</p>
                        {vendor.isShadow && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                            SHADOW
                          </span>
                        )}
                      </div>
                      {vendor.notes && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{vendor.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{vendor.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        vendor.dataSensitivity === 'High'
                          ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                          : vendor.dataSensitivity === 'Medium'
                          ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {vendor.dataSensitivity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge
                        level={vendor.riskLevel}
                        score={vendor.riskScore}
                        scoreBreakdown={vendor.scoreBreakdown}
                        showScore
                      />
                    </td>
                    <td className="px-4 py-3">
                      {vendor.isShadow ? (
                        vendor.suggestedAlternative ? (
                          <a
                            href={vendor.suggestedAlternative.approvedToolUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                          >
                            <span>Use {vendor.suggestedAlternative.approvedToolName}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ⚠️ Needs Review (No Alt)
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">N/A (Approved)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs flex items-center gap-1 ${vendor.hasCompliance ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {vendor.hasCompliance ? '✓' : '✗'} Compliant
                        </span>
                        <span className={`text-xs flex items-center gap-1 ${vendor.approvedByIT ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {vendor.approvedByIT ? '✓' : '✗'} IT Approved
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setHistoryVendor(vendor)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                          title="View Audit History Timeline"
                        >
                          <History size={15} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => { setEditVendor(vendor); setShowForm(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                              title="Edit Vendor"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteId(vendor.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                              title="Delete Vendor"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
            Showing {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Vendor Form Modal */}
      {showForm && (
        <VendorForm
          vendor={editVendor}
          onClose={() => { setShowForm(false); setEditVendor(null); }}
          onSubmit={editVendor ? handleUpdate : handleCreate}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative card p-6 w-full max-w-sm animate-slide-in">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Vendor</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
              Are you sure you want to delete this vendor? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* History Timeline Modal */}
      {historyVendor && (
        <VendorHistoryModal
          vendorId={historyVendor.id}
          vendorName={historyVendor.name}
          onClose={() => setHistoryVendor(null)}
        />
      )}
    </div>
  );
}
