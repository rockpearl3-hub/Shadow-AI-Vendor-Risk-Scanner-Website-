import { useState, useEffect } from 'react';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { Lock, Plus } from 'lucide-react';

export default function AlternativesPage() {
  const { isAdmin } = useAuth();
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    category: 'AI Tool',
    approvedToolName: '',
    approvedToolUrl: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAlternatives = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/alternatives');
      setAlternatives(res.data.alternatives || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch approved alternatives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlternatives();
  }, []);

  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setEditingItem(null);
    setFormData({
      category: 'AI Tool',
      approvedToolName: '',
      approvedToolUrl: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!isAdmin) return;
    setEditingItem(item);
    setFormData({
      category: item.category,
      approvedToolName: item.approvedToolName,
      approvedToolUrl: item.approvedToolUrl,
      notes: item.notes || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to delete the alternative '${name}'?`)) return;
    try {
      await api.delete(`/api/alternatives/${id}`);
      fetchAlternatives();
    } catch (err) {
      alert(err.message || 'Failed to delete alternative.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!formData.approvedToolName || !formData.approvedToolUrl || !formData.category) {
      alert('Please fill in category, tool name, and tool URL.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await api.put(`/api/alternatives/${editingItem.id}`, formData);
      } else {
        await api.post('/api/alternatives', formData);
      }
      setModalOpen(false);
      fetchAlternatives();
    } catch (err) {
      alert(err.message || 'Failed to save alternative.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAlternatives = alternatives.filter(
    (a) =>
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      a.approvedToolName.toLowerCase().includes(search.toLowerCase()) ||
      (a.notes && a.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <span>Manage Approved Alternatives</span>
            {!isAdmin && (
              <span className="text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock size={12} /> Read-Only Mode (Viewer Role)
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Define enterprise-approved tools per category. When employees visit unapproved AI tools, these alternatives will be recommended automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm px-4 py-2 rounded-lg transition shadow-sm"
            >
              <Plus size={16} />
              Add Approved Alternative
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by category, tool name, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 pl-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing {filteredAlternatives.length} alternative(s)
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading approved alternatives...</div>
        ) : filteredAlternatives.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto text-xl">
              💡
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Approved Alternatives Set</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Add your first IT-approved tool alternative (e.g., Microsoft Copilot for "AI Tool") so shadow tool detections get immediate remediation guidance.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="mt-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg"
              >
                Add First Alternative
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Approved Tool</th>
                  <th className="px-6 py-3.5">Approved URL</th>
                  <th className="px-6 py-3.5">Approval Notes / Rationale</th>
                  <th className="px-6 py-3.5 text-center">Linked Shadow Vendors</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {filteredAlternatives.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {item.approvedToolName}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={item.approvedToolUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5 text-xs font-medium"
                      >
                        <span>{item.approvedToolUrl}</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {item.notes || <span className="italic text-slate-400">No notes provided</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {item._count?.vendors ?? 0} vendor(s)
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 font-medium text-xs px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 hover:border-sky-500 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.approvedToolName)}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium text-xs px-2.5 py-1 rounded border border-rose-200 dark:border-rose-900/50 hover:bg-rose-500/10 transition"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {modalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Approved Alternative' : 'Add Approved Alternative'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder='e.g., "AI Tool", "Chatbot", "Translation"'
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Approved Tool Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder='e.g., "Microsoft Copilot Enterprise"'
                  value={formData.approvedToolName}
                  onChange={(e) => setFormData({ ...formData, approvedToolName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Approved Tool URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://copilot.microsoft.com"
                  value={formData.approvedToolUrl}
                  onChange={(e) => setFormData({ ...formData, approvedToolUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Approval Notes / Rationale
                </label>
                <textarea
                  rows="3"
                  placeholder="Why is this approved? e.g., SOC2 Type II certified, enterprise DPA signed, no data retention for training."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Alternative' : 'Create Alternative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
