import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  House,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import JoiningForm from "./components/JoiningForm";
import OwnerLoginModal from "./components/OwnerLoginModal";
import OwnerDashboard from "./components/OwnerDashboard";
import type { Tenant } from "./types/tenant";
import {
  fetchTenants,
  getAppsScriptUrl,
  loadTenants,
  saveTenant,
  syncTenant,
  testAppsScriptUrl,
  updateTenant,
  vacateTenant,
} from "./services/googleSheetsService";
const WHATSAPP = "919876543210";
export default function App() {
  const [tenants, setTenants] = useState<Tenant[]>(() => loadTenants());
  const [submitted, setSubmitted] = useState<Tenant | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [owner, setOwner] = useState(
    () => sessionStorage.getItem("srinivasa-owner-auth") === "true",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scriptUrl, setScriptUrl] = useState(() => getAppsScriptUrl());
  const [settingsTesting, setSettingsTesting] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [copyState, setCopyState] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const onPop = () => {
      if (location.pathname === "/owner" && !owner) setLoginOpen(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [owner]);
  useEffect(() => {
    if (location.pathname === "/owner" && !owner) setLoginOpen(true);
  }, [owner]);
  useEffect(() => {
    if (owner && location.pathname === "/owner") {
      void fetchTenants().then((live) => {
        if (live) setTenants([...live.activeTenants, ...live.vacatedTenants]);
      });
    }
  }, [owner]);
  async function handleSubmit(t: Tenant): Promise<{ ok: boolean; error?: string }> {
    try {
      const result = await syncTenant(t);
      if (!result.ok) return { ok: false, error: `Submission failed: ${result.error ?? 'Please check the Apps Script Web App URL and try again.'}` };
      saveTenant(t);
      setTenants(loadTenants());
      setNotice('Submitted successfully. Your details and ID photos were saved to Google Sheets & Drive.');
      setSubmitted(t);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: `Submission failed: ${error instanceof Error ? error.message : 'Unexpected sync error. Please try again.'}` };
    }
  }
  async function login() {
    setOwner(true);
    setLoginOpen(false);
    history.pushState({}, "", "/owner");
    const live = await fetchTenants();
    if (live) {
      const combined = [...live.activeTenants, ...live.vacatedTenants];
      combined.forEach(saveTenant);
      setTenants(combined);
    }
  }
  function logout() {
    sessionStorage.removeItem("srinivasa-owner-auth");
    setOwner(false);
    history.pushState({}, "", "/");
  }
  async function upsert(t: Tenant) {
    updateTenant(t);
    if (t.status === "vacated") await vacateTenant(t);
    const live = await fetchTenants();
    if (live) setTenants([...live.activeTenants, ...live.vacatedTenants]);
    else setTenants(loadTenants());
  }
  async function copyWelcome() {
    if (!submitted) return;
    const msg = `Welcome to Sri Srinivasa Andhra PG, ${submitted.fullName}! Your stay is confirmed. Room: ${submitted.roomNumber} (${submitted.sharingType}). Joining date: ${submitted.joiningDate}. We look forward to making this your home. Please contact management if you need any help.`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopyState(true);
      setTimeout(() => setCopyState(false), 2500);
    } catch {
      setNotice("Unable to access clipboard. Please try again.");
    }
  }
  async function saveSettings() {
    setSettingsTesting(true);
    setSettingsMessage("Testing Apps Script connection...");
    const result = await testAppsScriptUrl(scriptUrl);
    setSettingsTesting(false);
    setSettingsMessage(
      result.ok ? result.message + " Live sync is ready." : result.message,
    );
  }
  const ownerView = owner && location.pathname === "/owner";
  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-inner">
          <div className="brand-mark">
            <House size={24} />
          </div>
          <div className="hero-copy">
            <span className="hero-kicker">
              <Sparkles size={14} /> A PLACE TO CALL HOME
            </span>
            <h1>
              Sri Srinivasa
              <br className="mobile-break" /> Andhra PG
            </h1>
            <p>Comfortable stays. Caring community. Welcome home.</p>
          </div>
          <div className="hero-badge">
            <ShieldCheck size={15} /> Safe & welcoming
          </div>
        </div>
      </header>
      {ownerView ? (
        <OwnerDashboard
          tenants={tenants}
          onUpdate={upsert}
          onLogout={logout}
          onSettings={() => setSettingsOpen(true)}
          syncConfigured={Boolean(scriptUrl)}
        />
      ) : submitted ? (
        <main className="confirmation-wrap">
          <section className="confirmation-card">
            <div className="success-icon">
              <CheckCircle2 size={34} />
            </div>
            <p className="eyebrow">APPLICATION RECEIVED</p>
            <h2 className="confirmation-title">
              Welcome home, {submitted.fullName.split(" ")[0]}!
            </h2>
            <p className="muted mt-2">
              Your joining details have been saved. The PG management team will
              be in touch soon.
            </p>
            <div className="summary-card">
              <div>
                <span>Room allotment</span>
                <strong>
                  Room {submitted.roomNumber} · {submitted.sharingType}
                </strong>
              </div>
              <div>
                <span>Joining date</span>
                <strong>{submitted.joiningDate}</strong>
              </div>
              <div>
                <span>Advance paid</span>
                <strong>
                  ₹{submitted.advanceAmount.toLocaleString("en-IN")}
                </strong>
              </div>
              <div>
                <span>Mobile</span>
                <strong>{submitted.mobile}</strong>
              </div>
            </div>
            {notice && <p className="sync-note">{notice}</p>}
            <button className="button-primary w-full" onClick={copyWelcome}>
              <Copy size={17} />
              {copyState
                ? "Copied to clipboard"
                : "Copy WhatsApp welcome message"}
            </button>
            <a
              className="whatsapp-link"
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Welcome to Sri Srinivasa Andhra PG, ${submitted.fullName}! Your stay is confirmed in room ${submitted.roomNumber}.`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Open WhatsApp <ArrowLeft size={15} />
            </a>
            <button
              className="button-secondary w-full mt-2"
              onClick={() => {
                setSubmitted(null);
                setNotice("");
              }}
            >
              Submit another response
            </button>
          </section>
        </main>
      ) : (
        <>
          <main className="main-content">
            <div className="intro-block">
              <span className="welcome-chip">
                <Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE
              </span>
              <h2>Joining form</h2>
              <p>
                Fill in your details to get started. Fields marked <b>*</b> are
                required.
              </p>
            </div>
            <JoiningForm onSubmit={handleSubmit} />
          </main>
        </>
      )}
      <footer className="site-footer">
        <div>
          <div className="footer-brand">
            <span className="footer-icon">
              <House size={17} />
            </span>
            <strong>Sri Srinivasa Andhra PG</strong>
          </div>
          <p>A comfortable place to call home.</p>
        </div>
        <a href="mailto:srinivasa.andhra.pg@gmail.com">
          srinivasa.andhra.pg@gmail.com
        </a>
        <button
          className="owner-login-link"
          onClick={() => (ownerView ? logout() : setLoginOpen(true))}
        >
          {ownerView ? "Back to form" : "Owner login"}
        </button>
      </footer>
      {loginOpen && (
        <OwnerLoginModal
          onClose={() => {
            setLoginOpen(false);
            if (location.pathname === "/owner") history.pushState({}, "", "/");
          }}
          onLogin={login}
        />
      )}
      {settingsOpen && (
        <div
          className="overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setSettingsOpen(false)
          }
        >
          <section className="modal-card max-w-lg">
            <p className="eyebrow">INTEGRATIONS</p>
            <h2 className="section-title mt-1">Google Sheets sync</h2>
            <p className="muted mt-2">
              Set a Google Apps Script Web App URL to send joining records and
              ID documents to Google Sheets and Drive.
            </p>
            <label className="field-label block mt-5">
              Apps Script Web App URL
              <input
                className="input mt-2"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
              />
            </label>
            <p className="hint-text mt-2">
              For hosting builds, set <code>VITE_APPS_SCRIPT_URL</code>. The
              current browser can test and save the URL below.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                className="button-secondary flex-1"
                onClick={() => setSettingsOpen(false)}
              >
                Cancel
              </button>
              <button
                className="button-primary flex-1"
                disabled={settingsTesting}
                onClick={saveSettings}
              >
                {settingsTesting ? "Testing connection…" : "Test & save"}
              </button>
            </div>
            {settingsMessage && (
              <p className="mt-4 text-center text-sm font-semibold">
                {settingsMessage}
              </p>
            )}
          </section>
        </div>
      )}
      {loginOpen === false &&
      location.pathname === "/owner" &&
      !owner &&
      !ownerView
        ? null
        : null}
    </div>
  );
}
