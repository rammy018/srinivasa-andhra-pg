import { useState } from "react";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileImage,
  FileText,
  Home,
  Loader2,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import type { Tenant, TenantInput, UploadedDocument } from "../types/tenant";
const rules = [
  [
    "30-Day Notice & Advance Refund",
    "Residents must inform management at least 30 days prior to vacating. With 30 days' prior notice, ₹1,000 maintenance charges will be deducted from the ₹3,000 advance and ₹2,000 will be refunded. If vacated without 30 days' prior notice, zero advance balance will be refunded.",
  ],
  [
    "Electricity / Current Bill Split",
    "Monthly electricity (current) bill generated for the room will be split equally among the roommates sharing that room and must be paid alongside the monthly rent.",
  ],
  [
    "Personal Belongings & Valuables",
    "Residents are solely responsible for their personal belongings (laptops, mobile phones, cash, gold, etc.). Management is not responsible for any loss or theft.",
  ],
  [
    "Property Damage (Nastapariharam)",
    "Any damage caused to hostel property (beds, fans, lights, switches, doors, bathroom fittings, etc.) must be compensated in full by the responsible resident.",
  ],
  [
    "Visitors & Guests",
    "Outsiders and friends are not allowed inside rooms without management permission. Night stays are strictly prohibited.",
  ],
  [
    "Conduct, Power & Water",
    "Smoking, alcohol, and illegal activities are strictly prohibited. Switch off lights, fans, and geysers when leaving the room and conserve water.",
  ],
];
interface Props {
  onSubmit: (t: Tenant) => Promise<{ ok: boolean; error?: string }>;
}
type FormValues = {
  fullName: string;
  mobile: string;
  emergencyContact: string;
  fatherName: string;
  motherName: string;
  address: string;
  organization: string;
  aadhaarNumber: string;
  joiningDate: string;
  advanceAmount: string;
  roomNumber: string;
  sharingType: string;
};
const initial: FormValues = {
  fullName: "",
  mobile: "",
  emergencyContact: "",
  fatherName: "",
  motherName: "",
  address: "",
  organization: "",
  aadhaarNumber: "",
  joiningDate: "",
  advanceAmount: "3000",
  roomNumber: "",
  sharingType: "",
};
export default function JoiningForm({ onSubmit }: Props) {
  const [values, setValues] = useState(initial);
  const [files, setFiles] = useState<{
    aadhaarFront: UploadedDocument | null;
    aadhaarBack: UploadedDocument | null;
    officeId: UploadedDocument | null;
  }>({ aadhaarFront: null, aadhaarBack: null, officeId: null });
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function update(key: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }
  async function readFile(file: File): Promise<UploadedDocument> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          mimeType: file.type,
          dataUrl: String(reader.result),
        });
      reader.onerror = () =>
        reject(new Error("Could not read the selected file."));
      reader.readAsDataURL(file);
    });
  }
  async function setFile(
    key: "aadhaarFront" | "aadhaarBack" | "officeId",
    file?: File,
  ) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Each ID file must be 5 MB or smaller.");
      return;
    }
    try {
      const data = await readFile(file);
      setFiles((v) => ({ ...v, [key]: data }));
      setError("");
    } catch {
      setError("We could not read that file. Please try again.");
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalizedName = values.fullName.trim().replace(/\s+/g, " ");
    if (
      !/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(normalizedName) ||
      normalizedName.split(" ").length < 2
    ) {
      setError("Enter a valid full name with at least first and last name.");
      return;
    }
    if (
      !/^\d{10}$/.test(values.mobile) ||
      !/^[6-9][0-9]{9}$/.test(values.mobile)
    ) {
      setError(
        "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.",
      );
      return;
    }
    if (
      !/^\d{10}$/.test(values.emergencyContact) ||
      !/^[6-9][0-9]{9}$/.test(values.emergencyContact)
    ) {
      setError(
        "Enter a valid 10-digit Indian emergency contact starting with 6, 7, 8 or 9.",
      );
      return;
    }
    if (!/^\d{12}$/.test(values.aadhaarNumber)) {
      setError("Aadhaar number must be exactly 12 digits.");
      return;
    }
    const advanceAmount = Number(values.advanceAmount);
    if (!Number.isFinite(advanceAmount) || advanceAmount < 1) {
      setError("Advance amount must be greater than ₹0.");
      return;
    }
    if (!files.aadhaarFront || !files.aadhaarBack || !files.officeId) {
      setError(
        "Please upload Aadhaar front and back, and your Office / College ID.",
      );
      return;
    }
    if (!accepted) {
      setError(
        "Please confirm that you have read and accepted all hostel rules.",
      );
      return;
    }
    setBusy(true);
    try {
      const tenant: Tenant = {
        ...(values as unknown as TenantInput),
        fullName: normalizedName,
        advanceAmount: Number(values.advanceAmount),
        sharingType: values.sharingType as Tenant["sharingType"],
        aadhaarFront: files.aadhaarFront,
        aadhaarBack: files.aadhaarBack,
        officeId: files.officeId,
        acceptedRules: accepted,
        id: crypto.randomUUID(),
        status: "active",
        createdAt: new Date().toISOString(),
      };
      const result = await onSubmit(tenant);
      if (!result.ok)
        setError(
          result.error ||
            "Submission failed. Please check the Google Sheets connection and try again.",
        );
    } catch (error) {
      setError(
        error instanceof Error
          ? `Submission failed: ${error.message}`
          : "Submission failed unexpectedly. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="joining-form">
      <section className="form-card">
        <div className="section-heading">
          <div className="section-icon">
            <UserRound size={20} />
          </div>
          <div>
            <p className="eyebrow">SECTION 01</p>
            <h2 className="section-title">Tenant details</h2>
            <p className="muted mt-1">
              A few details to make your move-in smooth.
            </p>
          </div>
        </div>
        <div className="form-grid">
          <Field label="Full name" required>
            <input
              className="input"
              required
              autoComplete="name"
              value={values.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="As on your ID"
            />
          </Field>
          <Field label="Mobile number / WhatsApp" required>
            <input
              className="input"
              required
              inputMode="numeric"
              maxLength={10}
              value={values.mobile}
              onChange={(e) =>
                update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit mobile number"
            />
          </Field>
          <Field label="Emergency contact — parent / guardian" required>
            <input
              className="input"
              required
              inputMode="numeric"
              maxLength={10}
              value={values.emergencyContact}
              onChange={(e) =>
                update(
                  "emergencyContact",
                  e.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
              placeholder="10-digit contact number"
            />
          </Field>
          <Field label="Father's name" required>
            <input
              className="input"
              required
              value={values.fatherName}
              onChange={(e) => update("fatherName", e.target.value)}
              placeholder="Father's full name"
            />
          </Field>
          <Field label="Mother's name">
            <input
              className="input"
              value={values.motherName}
              onChange={(e) => update("motherName", e.target.value)}
              placeholder="Mother's full name"
            />
          </Field>
          <Field label="Company / college name" required>
            <input
              className="input"
              required
              value={values.organization}
              onChange={(e) => update("organization", e.target.value)}
              placeholder="Where you work or study"
            />
          </Field>
          <Field label="Aadhaar number" required>
            <input
              className="input"
              required
              inputMode="numeric"
              maxLength={12}
              value={values.aadhaarNumber}
              onChange={(e) =>
                update(
                  "aadhaarNumber",
                  e.target.value.replace(/\D/g, "").slice(0, 12),
                )
              }
              placeholder="12-digit Aadhaar number"
            />
          </Field>
          <Field label="Joining date" required>
            <input
              className="input"
              required
              type="date"
              value={values.joiningDate}
              onChange={(e) => update("joiningDate", e.target.value)}
            />
          </Field>
          <Field label="Advance amount paid (₹)" required>
            <div className="relative">
              <span className="currency-prefix">₹</span>
              <input
                className="input advance-input"
                required
                min="1"
                step="1"
                inputMode="numeric"
                type="number"
                value={values.advanceAmount}
                onChange={(e) => update("advanceAmount", e.target.value)}
              />
            </div>
          </Field>
          <div className="field-span">
            <Field label="Permanent home address" required>
              <textarea
                className="input min-h-24"
                required
                value={values.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="House number, street, city, state and PIN code"
              />
            </Field>
          </div>
        </div>
        <div className="upload-grid">
          <UploadField
            label="Aadhaar card — front"
            doc={files.aadhaarFront}
            onFile={(f) => setFile("aadhaarFront", f)}
          />
          <UploadField
            label="Aadhaar card — back"
            doc={files.aadhaarBack}
            onFile={(f) => setFile("aadhaarBack", f)}
          />
          <UploadField
            label="Office / college ID"
            doc={files.officeId}
            onFile={(f) => setFile("officeId", f)}
          />
        </div>
        <p className="hint-text">
          <ShieldCheck size={14} /> Images or PDF, up to 5 MB each. Your
          documents are shared with PG management only.
        </p>
      </section>
      <section className="form-card">
        <div className="section-heading">
          <div className="section-icon">
            <Home size={20} />
          </div>
          <div>
            <p className="eyebrow">SECTION 02</p>
            <h2 className="section-title">Room allotment</h2>
            <p className="muted mt-1">Tell us your assigned room details.</p>
          </div>
        </div>
        <div className="form-grid">
          <Field label="Room number" required>
            <input
              className="input"
              required
              value={values.roomNumber}
              onChange={(e) => update("roomNumber", e.target.value)}
              placeholder="e.g. 203"
            />
          </Field>
          <Field label="Sharing type" required>
            <select
              className="input"
              required
              value={values.sharingType}
              onChange={(e) => update("sharingType", e.target.value)}
            >
              <option value="">Select sharing type</option>
              {["1 Sharing", "2 Sharing", "3 Sharing", "4 Sharing"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>
      <section className="form-card rules-card">
        <div className="section-heading">
          <div className="section-icon">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <p className="eyebrow">SECTION 03</p>
            <h2 className="section-title">Hostel rules & regulations</h2>
            <p className="muted mt-1">
              Please read each rule carefully before continuing.
            </p>
          </div>
        </div>
        <div className="rules-list">
          {rules.map(([title, text], i) => (
            <article className="rule-item" key={title}>
              <span className="rule-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
        <label className="accept-row">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            <strong>I have read and agree to all hostel rules.</strong>
            <small>
              By submitting, I confirm that the information above is accurate.
            </small>
          </span>
        </label>
      </section>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <button
        className="button-primary submit-button"
        type="submit"
        disabled={busy}
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin mr-2" size={16} />
            Saving details & uploading ID photos to Google Drive...
          </>
        ) : (
          <>
            Submit joining form <ArrowRight size={18} />
          </>
        )}
      </button>
      <p className="secure-note">
        <ShieldCheck size={14} /> Your information is handled securely and only
        used for tenancy management.
      </p>
    </form>
  );
}
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="field-label">
      {label}
      {required && <span className="required-mark"> *</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}
function UploadField({
  label,
  doc,
  onFile,
}: {
  label: string;
  doc: UploadedDocument | null;
  onFile: (f?: File) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className="upload-field">
      <label className="field-label" htmlFor={id}>
        {label}
        <span className="required-mark"> *</span>
      </label>
      <label className={`upload-box ${doc ? "upload-done" : ""}`} htmlFor={id}>
        {doc ? (
          <>
            <Check size={18} />
            <span className="truncate">{doc.name}</span>
          </>
        ) : (
          <>
            <Upload size={18} />
            <span>Choose image or PDF</span>
          </>
        )}
        <input
          id={id}
          type="file"
          accept="image/*,application/pdf"
          required={!doc}
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      {doc && (
        <a
          href={doc.dataUrl}
          target="_blank"
          rel="noreferrer"
          className="preview-link"
        >
          {doc.mimeType.startsWith("image/") ? (
            <FileImage size={14} />
          ) : (
            <FileText size={14} />
          )}{" "}
          Preview uploaded file
        </a>
      )}
    </div>
  );
}
