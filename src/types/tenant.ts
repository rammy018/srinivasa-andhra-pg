export type SharingType = '1 Sharing' | '2 Sharing' | '3 Sharing' | '4 Sharing';
export interface UploadedDocument { name: string; mimeType: string; dataUrl: string }
export interface Tenant {
  id: string; fullName: string; mobile: string; emergencyContact: string; fatherName: string; motherName: string;
  address: string; organization: string; aadhaarNumber: string; aadhaarFront: UploadedDocument; aadhaarBack: UploadedDocument;
  officeId: UploadedDocument; joiningDate: string; advanceAmount: number; roomNumber: string; sharingType: SharingType;
  acceptedRules: boolean; status: 'active' | 'vacated'; createdAt: string;
  vacateDate?: string; noticeGiven?: boolean; refundAmount?: number; maintenanceDeduction?: number; remarks?: string;
}
export type TenantInput = Omit<Tenant, 'id' | 'status' | 'createdAt'>;
