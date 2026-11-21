import type { Tenant, UploadedDocument } from '../types/tenant';

const KEY = 'srinivasa-pg-tenants';
const URL_KEY = 'srinivasa-apps-script-url';

export function getAppsScriptUrl(): string {
  return import.meta.env.VITE_APPS_SCRIPT_URL || localStorage.getItem(URL_KEY) || '';
}

export function loadTenants(): Tenant[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Tenant[]; }
  catch { return []; }
}

function cacheTenant(tenant: Tenant): Tenant {
  return {
    ...tenant,
    aadhaarFront: { name: '', mimeType: '', dataUrl: '' },
    aadhaarBack: { name: '', mimeType: '', dataUrl: '' },
    officeId: { name: '', mimeType: '', dataUrl: '' }
  };
}

function safeSet(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; }
  catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
    }
    return false;
  }
}

export function saveTenant(tenant: Tenant): void {
  const cached = cacheTenant(tenant);
  const existing = loadTenants();
  const next = [cached, ...existing.filter(t => t.id !== tenant.id)].slice(0, 100);
  if (!safeSet(KEY, JSON.stringify(next))) {
    safeSet(KEY, '[]');
  }
}

export function updateTenant(updated: Tenant): void {
  const cached = cacheTenant(updated);
  const next = loadTenants().map(t => t.id === updated.id ? cached : t);
  safeSet(KEY, JSON.stringify(next));
}

async function uploadedToBase64(doc: UploadedDocument | null) {
  if (!doc) return null;
  const comma = doc.dataUrl.indexOf(',');
  return {
    name: doc.name,
    mimeType: doc.mimeType,
    base64: comma >= 0 ? doc.dataUrl.slice(comma + 1) : doc.dataUrl
  };
}

export async function syncTenant(tenant: Tenant): Promise<{ ok: boolean; id?: string; aadhaarUrl?: string; aadhaarBackUrl?: string; officeIdUrl?: string; error?: string }> {
  const url = getAppsScriptUrl();
  if (!url) {
    return { ok: false, error: 'Apps Script URL is not configured' };
  }

  try {
    const aadhaarPhoto = await uploadedToBase64(tenant.aadhaarFront);
    const aadhaarBack = await uploadedToBase64(tenant.aadhaarBack);
    const officeIdPhoto = await uploadedToBase64(tenant.officeId);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'submit', recipient: 'srinivasa.andhra.pg@gmail.com', tenant, aadhaarPhoto, aadhaarBack, officeIdPhoto })
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result || result.status !== 'success') {
      return { ok: false, error: result?.message || `Apps Script returned HTTP ${response.status}` };
    }

    return { ok: true, id: result.id, aadhaarUrl: result.aadhaarUrl, aadhaarBackUrl: result.aadhaarBackUrl, officeIdUrl: result.officeIdUrl };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Network request failed' };
  }
}

export async function fetchTenants(): Promise<{ activeTenants: Tenant[]; vacatedTenants: Tenant[] } | null> {
  const url = getAppsScriptUrl();
  if (!url) return null;

  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) return null;
    const result = await response.json();
    if (result.status && result.status !== 'success') return null;

    const normalize = (record: Record<string, unknown>, fallbackStatus: 'active' | 'vacated'): Tenant => {
      const value = (keys: string[], fallback: unknown = '') => {
        for (const key of keys) if (record[key] !== undefined && record[key] !== null) return record[key];
        return fallback;
      };
      const aadhaarUrl = String(value(['aadhaarUrl', 'Aadhaar Photo URL'], ''));
      const officeUrl = String(value(['officeIdUrl', 'Office ID Photo URL'], ''));
      const dataDoc = (urlValue: string, name: string): UploadedDocument => ({ name, mimeType: 'image/jpeg', dataUrl: urlValue });

      return {
        id: String(value(['id', 'ID'], '')),
        fullName: String(value(['fullName', 'Full Name'], '')),
        mobile: String(value(['mobile', 'Mobile'], '')),
        emergencyContact: String(value(['emergencyContact', 'Emergency Contact'], '')),
        fatherName: String(value(['fatherName', 'Father Name'], '')),
        motherName: String(value(['motherName', 'Mother Name'], '')),
        address: String(value(['address', 'Permanent Address'], '')),
        organization: String(value(['organization', 'Company/College'], '')),
        aadhaarNumber: String(value(['aadhaarNumber', 'Aadhaar Number'], '')),
        aadhaarFront: dataDoc(aadhaarUrl, 'Aadhaar front'),
        aadhaarBack: dataDoc(aadhaarUrl, 'Aadhaar back'),
        officeId: dataDoc(officeUrl, 'Office / college ID'),
        joiningDate: String(value(['joiningDate', 'Joining Date'], '')),
        advanceAmount: Number(value(['advanceAmount', 'Advance Paid'], 0)) || 0,
        roomNumber: String(value(['roomNumber', 'Room Number'], '')),
        sharingType: String(value(['sharingType', 'Sharing Type'], '')) as Tenant['sharingType'],
        acceptedRules: true,
        status: fallbackStatus,
        createdAt: String(value(['createdAt', 'Timestamp'], '')),
        vacateDate: record.vacateDate ? String(record.vacateDate) : (record['Vacate Date'] ? String(record['Vacate Date']) : undefined),
        noticeGiven: Boolean(value(['noticeGiven', '30-Day Notice'], false)),
        refundAmount: record.refundAmount !== undefined ? Number(record.refundAmount) : undefined,
        remarks: record.remarks ? String(record.remarks) : undefined
      };
    };

    const active = Array.isArray(result.activeTenants) ? result.activeTenants.map((r: Record<string, unknown>) => normalize(r, 'active')) : [];
    const vacated = Array.isArray(result.vacatedTenants) ? result.vacatedTenants.map((r: Record<string, unknown>) => normalize(r, 'vacated')) : [];
    return { activeTenants: active, vacatedTenants: vacated };
  } catch {
    return null;
  }
}

export async function vacateTenant(tenant: Tenant): Promise<boolean> {
  const url = getAppsScriptUrl();
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'vacate',
        id: tenant.id,
        vacateDate: tenant.vacateDate,
        noticeGiven: tenant.noticeGiven,
        refundAmount: tenant.refundAmount,
        remarks: tenant.remarks
      })
    });
    const result = await response.json().catch(() => null);
    return response.ok && result?.status === 'success';
  } catch {
    return false;
  }
}

export function exportCsv(tenants: Tenant[]): void {
  const fields: (keyof Tenant)[] = ['fullName','mobile','emergencyContact','fatherName','motherName','address','organization','aadhaarNumber','joiningDate','advanceAmount','roomNumber','sharingType','status','vacateDate','noticeGiven','refundAmount','maintenanceDeduction','remarks'];
  const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [fields.join(','), ...tenants.map(t => fields.map(f => quote(t[f])).join(','))].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = 'sri-srinivasa-andhra-pg-tenants.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

export function setAppsScriptUrl(url: string): void {
  const cleaned = url.trim();
  if (cleaned) localStorage.setItem(URL_KEY, cleaned);
  else localStorage.removeItem(URL_KEY);
}

export async function testAppsScriptUrl(url: string): Promise<{ ok: boolean; message: string }> {
  const cleaned = url.trim();
  if (!cleaned) return { ok: false, message: 'Enter the deployed Apps Script /exec URL.' };
  if (!cleaned.includes('script.google.com') || !cleaned.endsWith('/exec')) {
    return { ok: false, message: 'Use the full Web App URL ending in /exec.' };
  }

  try {
    const response = await fetch(cleaned, { method: 'GET' });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || result.status === 'error') {
      return { ok: false, message: result?.message || `Connection returned HTTP ${response.status}.` };
    }
    setAppsScriptUrl(cleaned);
    return { ok: true, message: 'Connected to Google Sheets successfully.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not connect to Apps Script.' };
  }
}
