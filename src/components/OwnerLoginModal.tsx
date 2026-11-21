import { useState } from "react";
import { KeyRound, X, Eye, EyeOff, ShieldCheck } from "lucide-react";
interface Props {
  onClose: () => void;
  onLogin: () => void;
}
export default function OwnerLoginModal({ onClose, onLogin }: Props) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit owner mobile number.");
      return;
    }
    if (password !== "Rammy018") {
      setError("The password you entered is incorrect.");
      return;
    }
    sessionStorage.setItem("srinivasa-owner-auth", "true");
    onLogin();
  }
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal-card max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <button
          className="icon-button modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={19} />
        </button>
        <div className="icon-tile mb-4">
          <KeyRound size={22} />
        </div>
        <p className="eyebrow">PRIVATE OWNER ACCESS</p>
        <h2 id="login-title" className="section-title">
          Welcome back
        </h2>
        <p className="muted mt-1">Sign in to manage your tenants and rooms.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="field-label">
            Owner mobile number
            <input
              className="input mt-2"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit mobile number"
              required
            />
          </label>
          <label className="field-label">
            Password
            <div className="relative mt-2">
              <input
                className="input pr-12"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter owner password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShow(!show)}
                aria-label="Toggle password visibility"
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button className="button-primary w-full" type="submit">
            <ShieldCheck size={18} /> Secure login
          </button>
          <p className="text-xs text-slate-500">
            Owner credentials are checked in this browser app. Configure real
            server-side authentication before production use.
          </p>
        </form>
      </section>
    </div>
  );
}
