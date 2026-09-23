import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShieldAlert, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // MFA Challenge State
  const [mfaModal, setMfaModal] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaError, setMfaError] = useState('');

  // SSO Provider Config
  const [ssoConfig, setSsoConfig] = useState({ googleEnabled: false, microsoftEnabled: false });

  useEffect(() => {
    const fetchSsoConfig = async () => {
      try {
        const res = await api.get('/api/auth/sso/config');
        setSsoConfig(res.data);
      } catch (err) {
        console.error('[fetchSsoConfig]', err);
      }
    };
    fetchSsoConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.mfaRequired) {
          setMfaToken(res.mfaToken);
          setMfaModal(true);
        }
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfaCode = async (e) => {
    e.preventDefault();
    if (!mfaCode) return;
    try {
      setMfaVerifying(true);
      setMfaError('');
      const res = await api.post('/api/auth/mfa/verify-login', {
        mfaToken,
        code: mfaCode,
      });

      // Update token & user in local state
      localStorage.setItem('token', res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setMfaModal(false);
      window.location.href = '/dashboard';
    } catch (err) {
      setMfaError(err.message || 'Invalid MFA code or backup code.');
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleSsoClick = async (provider) => {
    try {
      setLoading(true);
      setError('');
      // Demonstration SSO login workflow
      const mockSsoId = `${provider}_${Date.now()}`;
      const mockEmail = email || `sso_user_${Date.now()}@company.com`;
      const res = await api.post('/api/auth/sso/login', {
        provider,
        email: mockEmail,
        ssoId: mockSsoId,
      });

      localStorage.setItem('token', res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'SSO authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 font-sans">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Shadow AI</p>
            <p className="text-blue-400 text-sm">Vendor Risk Scanner</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Track every vendor.<br />
            <span className="text-blue-400">Detect every risk.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            The smart dashboard for IT & security teams to monitor third-party vendors,
            AI tools, and shadow software — with automated risk scoring and enterprise RBAC.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: '🎯', title: 'Automated Risk Scoring', desc: 'Instant 0–100 risk scores based on compliance & breach history' },
              { icon: '🔒', title: 'Enterprise Hardening', desc: 'Immutable audit logs, TOTP MFA & session revocation' },
              { icon: '📊', title: 'Visual Governance', desc: 'Real-time charts, alerts, and exportable compliance reports' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-slate-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">Phase 5 Enterprise Edition — Hardened Compliance Suite</p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <ShieldAlert size={18} className="text-white" />
            </div>
            <p className="text-white font-bold text-lg">Shadow AI Scanner</p>
          </div>

          <div className="card p-8 bg-slate-900 border-slate-800">
            {/* Tab Toggle */}
            <div className="flex rounded-lg bg-slate-800 p-1 mb-6">
              {['login', 'signup'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    mode === m
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <h2 className="text-xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {mode === 'login'
                ? 'Sign in to access your risk dashboard'
                : 'Get started with Shadow AI Scanner'}
            </p>

            {error && (
              <div className="mb-4 px-3 py-2.5 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label text-slate-300" htmlFor="auth-email">Email address</label>
                <input
                  id="auth-email"
                  type="email"
                  className="input bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label text-slate-300 mb-0" htmlFor="auth-password">Password</label>
                  {mode === 'login' && (
                    <Link to="/forgot-password" className="text-xs text-sky-400 hover:underline">
                      Forgot Password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPw ? 'text' : 'password'}
                    className="input pr-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500"
                    placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center py-2.5 mt-2"
                disabled={loading}
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* SSO Providers Login */}
            {(ssoConfig.googleEnabled || ssoConfig.microsoftEnabled) && (
              <div className="mt-6 border-t border-slate-800 pt-5 space-y-3">
                <p className="text-xs text-center text-slate-500 font-medium">Or continue with Enterprise SSO</p>

                {ssoConfig.googleEnabled && (
                  <button
                    onClick={() => handleSsoClick('google')}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-semibold transition"
                  >
                    <span>🔵</span> Sign in with Google Workspace
                  </button>
                )}

                {ssoConfig.microsoftEnabled && (
                  <button
                    onClick={() => handleSsoClick('microsoft')}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-semibold transition"
                  >
                    <span>🟦</span> Sign in with Microsoft Entra ID
                  </button>
                )}
              </div>
            )}

            <p className="text-center text-slate-500 text-sm mt-6">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* MFA Verification Modal Challenge */}
      {mfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Two-Factor Authentication</h3>
                <p className="text-slate-400 text-xs">Enter code from Authenticator App</p>
              </div>
            </div>

            {mfaError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs">
                {mfaError}
              </div>
            )}

            <form onSubmit={handleVerifyMfaCode} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">6-Digit TOTP or Backup Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456 or A1B2C3D4"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMfaModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mfaVerifying}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-50"
                >
                  {mfaVerifying ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
