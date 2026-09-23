import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CATEGORIES = ['AI Tool', 'SaaS Vendor', 'Cloud Provider', 'Other'];
const SENSITIVITIES = ['Low', 'Medium', 'High'];

const DEFAULT_FORM = {
  name: '',
  category: 'AI Tool',
  dataSensitivity: 'Low',
  hasCompliance: false,
  hasBreachHistory: false,
  approvedByIT: false,
  notes: '',
};

/**
 * Modal form for adding / editing a vendor.
 * @param {object|null} vendor - existing vendor for edit mode, null for add
 * @param {function} onClose - close the modal
 * @param {function} onSubmit - called with form data
 */
export default function VendorForm({ vendor, onClose, onSubmit }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name,
        category: vendor.category,
        dataSensitivity: vendor.dataSensitivity,
        hasCompliance: vendor.hasCompliance,
        hasBreachHistory: vendor.hasBreachHistory,
        approvedByIT: vendor.approvedByIT,
        notes: vendor.notes || '',
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Vendor name is required.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg card p-6 animate-slide-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="label" htmlFor="vf-name">Vendor / Tool Name *</label>
            <input
              id="vf-name"
              name="name"
              type="text"
              className="input"
              placeholder="e.g. OpenAI GPT-4, Salesforce"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="label" htmlFor="vf-category">Category *</label>
            <select
              id="vf-category"
              name="category"
              className="select"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Data Sensitivity */}
          <div>
            <label className="label" htmlFor="vf-sensitivity">Data Sensitivity Level *</label>
            <select
              id="vf-sensitivity"
              name="dataSensitivity"
              className="select"
              value={form.dataSensitivity}
              onChange={handleChange}
            >
              {SENSITIVITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Boolean Checkboxes */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Risk Factors</p>

            {[
              { name: 'hasCompliance', label: 'Has Compliance Certification (SOC2, GDPR, ISO27001)', positive: true },
              { name: 'hasBreachHistory', label: 'Known Data Breach History', positive: false },
              { name: 'approvedByIT', label: 'Approved by IT Department', positive: true },
            ].map(({ name, label, positive }) => (
              <label key={name} className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    name={name}
                    checked={form[name]}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    id={`vf-${name}`}
                  />
                </div>
                <span className={`text-sm select-none group-hover:text-slate-900 dark:group-hover:text-white transition-colors ${
                  form[name]
                    ? positive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {label}
                </span>
              </label>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="label" htmlFor="vf-notes">Notes (optional)</label>
            <textarea
              id="vf-notes"
              name="notes"
              rows={2}
              className="input resize-none"
              placeholder="Any additional context..."
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {vendor ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
