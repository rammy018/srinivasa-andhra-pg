const SHEET_HEADERS = [
  'ID', 'Timestamp', 'Full Name', 'Mobile', 'Emergency Contact', 'Father Name',
  'Mother Name', 'Permanent Address', 'Company/College', 'Aadhaar Number',
  'Aadhaar Photo URL', 'Office ID Photo URL', 'Joining Date', 'Advance Paid',
  'Room Number', 'Sharing Type', 'Status', 'Vacate Date', '30-Day Notice',
  'Refund Amount', 'Remarks'
];

const FOLDER_NAME = 'Sri_Srinivasa_PG_ID_Proofs';
const SPREADSHEET_ID = '1cw2WrOnvArO_WwRxApKG7I5m4qF0eqz8ylQmYzx--bY';

/** Automatically set up the folder and spreadsheet tabs on first use/open. */
function setup() {
  const ss = getSpreadsheet();
  ['Active_Tenants', 'Vacated_List'].forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
    } else {
      const existing = sheet.getRange(1, 1, 1, SHEET_HEADERS.length).getValues()[0];
      const needsUpdate = SHEET_HEADERS.some(function (header, i) { return existing[i] !== header; });
      if (needsUpdate) sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
    }

    sheet.setFrozenRows(1);
  });
  getOrCreateFolder();
  return ss;
}

function getSpreadsheet() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(FOLDER_NAME);
}

function onOpen() {
  setup();
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function firstValue(obj, keys, fallback) {
  for (let i = 0; i < keys.length; i++) {
    if (obj[keys[i]] !== undefined && obj[keys[i]] !== null) return obj[keys[i]];
  }
  return fallback;
}

function makeId() {
  return 'TEN-' + Utilities.getUuid().replaceAll('-', '').slice(0, 10).toUpperCase();
}

function sanitizeFileNamePart(value) {
  return String(value || 'Unknown').replace(/[\\/:*?"<>|]/g, '_').trim();
}

function saveDataUrlImage(dataUrl, fileName) {
  if (!dataUrl) return '';

  let mimeType = 'application/octet-stream';
  let base64 = '';

  if (typeof dataUrl === 'object') {
    mimeType = dataUrl.mimeType || mimeType;
    base64 = dataUrl.base64 || '';
  } else {
    base64 = String(dataUrl);
    const match = /^data:([^;]+);base64,(.+)$/i.exec(base64);
    if (match) {
      mimeType = match[1];
      base64 = match[2];
    } else if (base64.indexOf(',') > -1) {
      base64 = base64.split(',').slice(1).join(',');
    }
  }

  if (!base64) return '';

  let extension = 'jpg';
  if (mimeType.indexOf('png') !== -1) extension = 'png';
  else if (mimeType.indexOf('jpeg') !== -1 || mimeType.indexOf('jpg') !== -1) extension = 'jpg';
  else if (mimeType.indexOf('pdf') !== -1) extension = 'pdf';
  else if (mimeType.indexOf('webp') !== -1) extension = 'webp';

  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType, fileName + '.' + extension);
  const folder = getOrCreateFolder();
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function doPost(e) {
  try {
    setup();
    const payload = parsePayload(e);

    // Accept submitTenant for compatibility with the existing app, and submit as specified.
    if (payload.action === 'submitTenant' || payload.action === 'submit') {
      const tenant = payload.tenant || payload;

      const fullName = firstValue(tenant, ['fullName', 'full_name', 'Full Name'], '');
      const mobile = firstValue(tenant, ['mobile', 'Mobile'], '');
      const id = firstValue(tenant, ['id', 'ID'], makeId());
      const timestamp = firstValue(tenant, ['createdAt', 'timestamp', 'Timestamp'], new Date());

      let aadhaarPhoto = firstValue(payload, ['aadhaarPhoto'], firstValue(tenant, ['aadhaarPhoto', 'aadhaarFront', 'aadhaarFrontPhoto'], ''));
      let aadhaarBackPhoto = firstValue(payload, ['aadhaarBack'], firstValue(tenant, ['aadhaarBack', 'aadhaarBackPhoto'], ''));
      let officeIdPhoto = firstValue(payload, ['officeIdPhoto'], firstValue(tenant, ['officeIdPhoto', 'officeId'], ''));

      // Existing app data fields can contain UploadedDocument dataUrl objects.
      if (aadhaarPhoto && typeof aadhaarPhoto === 'object' && aadhaarPhoto.dataUrl) aadhaarPhoto = aadhaarPhoto.dataUrl;
      if (aadhaarBackPhoto && typeof aadhaarBackPhoto === 'object' && aadhaarBackPhoto.dataUrl) aadhaarBackPhoto = aadhaarBackPhoto.dataUrl;
      if (officeIdPhoto && typeof officeIdPhoto === 'object' && officeIdPhoto.dataUrl) officeIdPhoto = officeIdPhoto.dataUrl;

      const safeName = sanitizeFileNamePart(fullName);
      const safeMobile = sanitizeFileNamePart(mobile);
      const aadhaarUrl = saveDataUrlImage(aadhaarPhoto, safeName + '_' + safeMobile + '_Aadhaar_Front');
      const aadhaarBackUrl = saveDataUrlImage(aadhaarBackPhoto, safeName + '_' + safeMobile + '_Aadhaar_Back');
      const officeIdUrl = saveDataUrlImage(officeIdPhoto, safeName + '_' + safeMobile + '_OfficeID');

      const row = [
        id,
        timestamp,
        fullName,
        mobile,
        firstValue(tenant, ['emergencyContact', 'Emergency Contact'], ''),
        firstValue(tenant, ['fatherName', 'Father Name'], ''),
        firstValue(tenant, ['motherName', 'Mother Name'], ''),
        firstValue(tenant, ['address', 'permanentAddress', 'Permanent Address'], ''),
        firstValue(tenant, ['organization', 'companyCollege', 'Company/College'], ''),
        firstValue(tenant, ['aadhaarNumber', 'Aadhaar Number'], ''),
        aadhaarUrl,
        officeIdUrl,
        firstValue(tenant, ['joiningDate', 'Joining Date'], ''),
        firstValue(tenant, ['advanceAmount', 'advancePaid', 'Advance Paid'], 0),
        firstValue(tenant, ['roomNumber', 'Room Number'], ''),
        firstValue(tenant, ['sharingType', 'Sharing Type'], ''),
        'Active',
        firstValue(tenant, ['vacateDate', 'Vacate Date'], ''),
        firstValue(tenant, ['noticeGiven', '30-Day Notice'], false) ? 'Yes' : 'No',
        firstValue(tenant, ['refundAmount', 'Refund Amount'], ''),
        firstValue(tenant, ['remarks', 'Remarks'], '')
      ];

      const sheet = getSpreadsheet().getSheetByName('Active_Tenants');
      sheet.appendRow(row);

      return jsonOutput({
        status: 'success',
        id: id,
        aadhaarUrl: aadhaarUrl,
        aadhaarBackUrl: aadhaarBackUrl,
        officeIdUrl: officeIdUrl
      });
    }

    if (payload.action === 'vacate') {
      const ss = getSpreadsheet();
      const activeSheet = ss.getSheetByName('Active_Tenants');
      const vacatedSheet = ss.getSheetByName('Vacated_List');
      const id = String(firstValue(payload, ['id', 'ID'], ''));
      const lastRow = activeSheet.getLastRow();

      if (lastRow < 2) {
        return jsonOutput({ status: 'error', message: 'Tenant ID not found' });
      }

      const values = activeSheet.getRange(2, 1, lastRow - 1, SHEET_HEADERS.length).getValues();
      let foundIndex = -1;

      for (let i = 0; i < values.length; i++) {
        if (String(values[i][0]) === id) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex === -1) {
        return jsonOutput({ status: 'error', message: 'Tenant ID not found' });
      }

      const row = values[foundIndex];
      row[16] = 'Vacated';
      row[17] = firstValue(payload, ['vacateDate', 'Vacate Date'], '');
      row[18] = firstValue(payload, ['noticeGiven', '30-Day Notice'], false) ? 'Yes' : 'No';
      row[19] = firstValue(payload, ['refundAmount', 'Refund Amount'], '');
      row[20] = firstValue(payload, ['remarks', 'Remarks'], '');

      vacatedSheet.appendRow(row);
      activeSheet.deleteRow(foundIndex + 2);

      return jsonOutput({ status: 'success', id: id });
    }

    return jsonOutput({ status: 'error', message: 'Unknown action' });
  } catch (error) {
    return jsonOutput({ status: 'error', message: String(error && error.message ? error.message : error) });
  }
}

function rowObjects(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = SHEET_HEADERS.length;
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  return values.filter(function (row) {
    return row.some(function (cell) { return cell !== '' && cell !== null; });
  }).filter(function (row) {
    const id = String(row[0] || '').trim();
    const fullName = String(row[2] || '').trim();
    if (!id || !fullName) return false;
    if (id === 'ID' || id === 'Timestamp') return false;
    if (fullName === 'Full Name' || fullName === 'Mobile Number') return false;
    if (/dynamic live roster|all currently residing tenants|automatically synced/i.test(id + ' ' + fullName)) return false;
    return true;
  }).map(function (row) {
    const record = {};
    SHEET_HEADERS.forEach(function (header, i) {
      record[header] = row[i];
    });
    // Friendly keys also make the dashboard response easy to consume.
    record.id = row[0];
    record.createdAt = row[1];
    record.fullName = row[2];
    record.mobile = row[3];
    record.emergencyContact = row[4];
    record.fatherName = row[5];
    record.motherName = row[6];
    record.address = row[7];
    record.organization = row[8];
    record.aadhaarNumber = row[9];
    record.aadhaarUrl = row[10];
    record.officeIdUrl = row[11];
    record.joiningDate = row[12];
    record.advanceAmount = row[13];
    record.roomNumber = row[14];
    record.sharingType = row[15];
    record.status = String(row[16]).toLowerCase() || 'active';
    record.vacateDate = row[17];
    record.noticeGiven = String(row[18]).toLowerCase() === 'yes';
    record.refundAmount = row[19];
    record.remarks = row[20];
    return record;
  });
}

function doGet(e) {
  try {
    setup();
    const ss = getSpreadsheet();
    return jsonOutput({
      status: 'success',
      activeTenants: rowObjects(ss.getSheetByName('Active_Tenants')),
      vacatedTenants: rowObjects(ss.getSheetByName('Vacated_List'))
    });
  } catch (error) {
    return jsonOutput({ status: 'error', message: String(error && error.message ? error.message : error) });
  }
}
