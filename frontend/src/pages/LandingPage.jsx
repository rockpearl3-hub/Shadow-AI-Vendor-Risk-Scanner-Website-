import { Link } from 'react-router-dom';
import RadarScanner from '../components/RadarScanner';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-sky-500 selection:text-slate-950">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-lg shadow-sky-500/20">
              🛡️
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">Shadow AI Scanner</span>
              <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 font-mono">Vendor Risk Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link
                to="/dashboard"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md shadow-sky-500/10"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white font-medium text-sm px-3 py-2 transition"
                >
                  Admin Login
                </Link>
                <Link
                  to="/dashboard"
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md shadow-sky-500/10"
                >
                  Explore Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            Real-Time Enterprise AI Governance & Security
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Detect unauthorized AI tools before they become security breaches.
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Shadow AI & Vendor Risk Scanner gives security teams real-time visibility into unapproved AI service usage, calculates empirical vendor risk scores, and routes employees to IT-approved alternatives automatically.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm px-6 py-3 rounded-lg transition shadow-lg shadow-sky-500/20"
            >
              Explore Live Dashboard
            </Link>
            <a
              href="#problem"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm px-6 py-3 rounded-lg transition"
            >
              Read Risk Analysis
            </a>
          </div>
        </div>

        {/* Memorable Hero Visual Moment: Live Interactive Radar Scanner */}
        <div className="pt-4">
          <RadarScanner />
        </div>
      </section>

      {/* Section 2: The Problem */}
      <section id="problem" className="py-20 px-6 bg-slate-950/70 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              The Reality of Shadow AI in Modern Enterprises
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Employees adoption of generative AI tools outpaces traditional IT approval workflows. When sensitive company assets enter unvetted third-party platforms, organizations face silent risk exposure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-lg">
                01
              </div>
              <h3 className="text-base font-bold text-white">Source Code & IP Exposure</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Developers copy internal source code, proprietary algorithms, or API keys into consumer AI assistants whose terms allow model training on user inputs.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-lg">
                02
              </div>
              <h3 className="text-base font-bold text-white">Customer Data & PII Leakage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Support and operations personnel paste customer support logs, medical records, or financial data into unvetted grammar or translation tools without a Data Processing Addendum (DPA).
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold text-lg">
                03
              </div>
              <h3 className="text-base font-bold text-white">Compliance Audit Failures</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Auditors flag uncataloged vendors that process enterprise data without SOC2 Type II certifications, violating SOC2 Trust Services Criteria, HIPAA, and GDPR standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works (3 Core Capabilities) */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Comprehensive Vendor Risk Remediation Capabilities
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Engineered to provide end-to-end detection, scoring, and automated policy enforcement without interrupting employee workflow velocity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="text-sky-400 font-mono text-xs font-semibold bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full w-max">
              Capability 01
            </div>
            <h3 className="text-lg font-bold text-white">Empirical Risk Scoring Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates an objective 0–100 risk score for every vendor based on four foundational risk vectors: compliance certification status, data sensitivity level, known breach history, and IT approval state.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="text-sky-400 font-mono text-xs font-semibold bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full w-max">
              Capability 02
            </div>
            <h3 className="text-lg font-bold text-white">Centralized Security Dashboard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitors risk distribution across the organization, generates CSV risk posture reports for compliance audits, highlights active shadow alerts, and manages approved enterprise tool alternatives.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="text-sky-400 font-mono text-xs font-semibold bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full w-max">
              Capability 03
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time Extension Detector</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manifest V3 Chrome extension checks tab navigations against known AI domains. Automatically provisions shadow vendors on the dashboard and alerts employees with approved tool alternatives.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Dashboard Screenshot / Mockup Placeholder */}
      <section className="py-16 px-6 bg-slate-950/70 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Built for Security Operations & Audit Readiness
            </h2>
            <p className="text-slate-400 text-sm">
              Single-page operations control center providing vendor inventory, risk distribution metrics, and alternative mapping.
            </p>
          </div>

          {/* <!-- Dashboard Screenshot Placeholder --> */}
          <div className="relative max-w-5xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">Shadow AI Security Dashboard UI Preview</span>
              </div>
              <span className="text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded">
                Live App Interface
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Total Tracked Vendors</div>
                <div className="text-xl font-bold text-white mt-1">3 Vendors</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Shadow Tools</div>
                <div className="text-xl font-bold text-amber-400 mt-1">3 Unapproved</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Average Risk Score</div>
                <div className="text-xl font-bold text-sky-400 mt-1">56 / 100</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Approved Alternatives</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">1 Configured</div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-400 border-b border-slate-800 pb-2">
                <span>Vendor Name</span>
                <span>Category</span>
                <span>Sensitivity</span>
                <span>Suggested Remediation</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                <span className="font-semibold text-white">Claude AI</span>
                <span>AI Tool</span>
                <span className="text-yellow-400">Medium</span>
                <span className="text-emerald-400">Use Microsoft Copilot Enterprise</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span className="font-semibold text-white">Midjourney</span>
                <span>AI Tool</span>
                <span className="text-rose-400">High</span>
                <span className="text-emerald-400">Use Canva Enterprise</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Call to Action Section (Dual Compatible Copy) */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Take control of shadow AI in your organization
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Request a security demo for your organization or explore our full-stack security product architecture directly in the live dashboard environment.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm px-6 py-3 rounded-lg transition shadow-lg shadow-sky-500/20"
            >
              Explore Live Dashboard
            </Link>
            <Link
              to="/login"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm px-6 py-3 rounded-lg transition"
            >
              Admin Security Login
            </Link>
          </div>
        </div>
      </section>

      {/* Section 6: Minimal Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} Shadow AI & Vendor Risk Scanner • Security Product Engineering
          </div>
          <div className="flex items-center gap-6">
            <span>Privacy-Preserving Monitoring</span>
            <span>Manifest V3 Extension</span>
            <span>REST API v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
