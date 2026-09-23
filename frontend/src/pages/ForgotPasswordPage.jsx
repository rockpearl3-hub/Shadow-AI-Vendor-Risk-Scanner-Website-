import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { KeyRound, ArrowLeft, Copy, Check } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError('');
      setMessage('');
      setFallbackUrl('');

      const res = await api.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message || 'Password reset link sent.');
      if (res.data.fallbackUrl) {
        setFallbackUrl(res.data.fallbackUrl);
      }
    } catch (err) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!fallbackUrl) return;
    navigator.clipboard.writeText(fallbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
            <KeyRound size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Reset Your Password</h1>
            <p className="text-xs text-slate-400">Enter your email to receive a password reset link</p>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs space-y-2">
            <p className="font-semibold">{message}</p>
            {fallbackUrl && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                <p className="text-slate-300">
                  <b>Fallback Link:</b> (Copy and paste into your browser bar)
                </p>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="truncate max-w-[240px] text-sky-400">{fallbackUrl}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1 text-slate-400 hover:text-white flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold p-3 rounded-xl transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
          >
            {loading ? 'Sending Request...' : 'Send Password Reset Link'}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
