import type { Tenant } from '../types/tenant';
const KEY = 'srinivasa-pg-tenants';
export function loadTenants(): Tenant[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Tenant[]; } catch { return []; } }
export function saveTenant(tenant: Tenant): void { const rows = loadTenants(); localStorage.setItem(KEY, JSON.stringify([tenant, ...rows])); }
export function updateTenant(updated: Tenant): void { localStorage.setItem(KEY, JSON.stringify(loadTenants().map((t) => t.id === updated.id ? updated : t))); }
export async function syncTenant(tenant: Tenant): Promise<boolean> {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!url) return false;
  try { const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'submitTenant', recipient: 'srinivasa.andhra.pg@gmail.com', tenant }) }); return response.ok; }
  catch { return false; }
}
export function exportCsv(tenants: Tenant[]): void {
  const fields: (keyof Tenant)[] = ['fullName','mobile','emergencyContact','fatherName','motherName','address','organization','aadhaarNumber','joiningDate','advanceAmount','roomNumber','sharingType','status','vacateDate','noticeGiven','refundAmount','maintenanceDeduction','remarks'];
  const quote = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const csv = [fields.join(','), ...tenants.map((t) => fields.map((f) => quote(t[f])).join(','))].join('\r\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'srinivasa-pg-tenants.csv'; link.click(); URL.revokeObjectURL(link.href);
}
