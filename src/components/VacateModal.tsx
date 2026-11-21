import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import type { Tenant } from "../types/tenant";
interface Props {
  tenant: Tenant;
  onClose: () => void;
  onConfirm: (tenant: Tenant) => void;
}
export default function VacateModal({ tenant, onClose, onConfirm }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notice, setNotice] = useState<boolean>(false);
  const [remarks, setRemarks] = useState("");
  const [refundText, setRefundText] = useState("0");
  const [validationError, setValidationError] = useState("");
  const parsedAdvance = Number(String(tenant.advanceAmount ?? "3000").replace(/[^0-9.-]/g, ""));
  const advanceAmount = Number.isFinite(parsedAdvance) && parsedAdvance > 0
    ? parsedAdvance
    : 3000;
  const refund = Math.max(0, Number(refundText) || 0);
  const maintenanceDeduction = 1000;

  function chooseNotice(value: boolean) {
    setNotice(value);
    setRefundText(value ? "2000" : "0");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(refund) || refund < 0) {
      setValidationError("Enter a valid refund amount.");
      return;
    }
    if (refund > advanceAmount) {
      setValidationError(`Refund cannot exceed advance paid (₹${advanceAmount.toLocaleString("en-IN")}).`);
      return;
    }
    setValidationError("");
    onConfirm({
      ...tenant,
      status: "vacated",
      vacateDate: date,
      noticeGiven: notice,
      refundAmount: refund,
      maintenanceDeduction,
      remarks,
    });
  }
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="modal-card max-w-lg" role="dialog" aria-modal="true">
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} />
        </button>
        <div className="icon-tile mb-4">
          <CalendarDays size={21} />
        </div>
        <p className="eyebrow">TENANT CHECK-OUT</p>
        <h2 className="section-title">Mark {tenant.fullName} as vacated</h2>
        <p className="muted mt-1">
          Room {tenant.roomNumber} · Advance paid ₹
          {tenant.advanceAmount.toLocaleString("en-IN")}
        </p>
        <form className="mt-6 space-y-5" onSubmit={submit}>
          {validationError && <p className="error-banner" role="alert">{validationError}</p>}
          <label className="field-label">
            Vacate date
            <input
              className="input mt-2"
              type="date"
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <fieldset>
            <legend className="field-label mb-2">
              Was 30-day notice given?
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`choice-button ${notice === true ? "choice-active" : ""}`}
                onClick={() => chooseNotice(true)}
              >
                Yes, notice given
              </button>
              <button
                type="button"
                className={`choice-button ${notice === false ? "choice-active" : ""}`}
                onClick={() => chooseNotice(false)}
              >
                No notice
              </button>
            </div>
          </fieldset>
          <div className="refund-box">
            <div>
              <span className="muted text-sm">Refund to tenant</span>
              <div className="relative mt-1">
                <span className="currency-prefix">₹</span>
                <input
                  className="input advance-input"
                  type="number"
                  min="0"
                  max={advanceAmount}
                  step="1"
                  inputMode="numeric"
                  value={refundText}
                  onChange={(e) => setRefundText(e.target.value)}
                  
                  aria-label="Refund amount"
                />
              </div>
            </div>
            <div className="text-right">
              <span className="muted text-sm">Maintenance deduction</span>
              <strong className="block text-slate-900">
                ₹{maintenanceDeduction.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
          {validationError && <p className="error-banner" role="alert">{validationError}</p>}
          <label className="field-label">
            Remarks{" "}
            <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              className="input mt-2 min-h-24"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any check-out notes"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              className="button-secondary flex-1"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              
              className="button-primary flex-1"
            >
              Confirm vacate
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
