/**
 * Safar Tours — Lead capture for the website contact forms.
 *
 * ONE Apps Script endpoint → ONE Google Spreadsheet → one tab per form type:
 *   Tours | Cars | Contact
 *
 * The website POSTs JSON like:
 * {
 *   "formType": "tour",          // "tour" | "car" | "contact"
 *   "name": "Rahul",
 *   "phone": "+91 98XXX XXXXX",
 *   "email": "",
 *   "destination": "Sikkim",
 *   "travelDate": "10–15 October",
 *   "travellers": "3–5",
 *   "package": "Sikkim Delight (5D/4N)",
 *   "message": "...",
 *   "page": "/packages/sikkim/sikkim-delight",
 *   "receivedAt": "2026-09-16T10:00:00.000Z"
 * }
 *
 * Tabs are created automatically with clean headers if missing — you only
 * need to create the spreadsheet itself. See GOOGLE-SHEETS-SETUP.md.
 */

// Tab names — keep in sync with src/config/forms.ts.
var TABS = {
  tour: "Tours",
  car: "Cars",
  contact: "Contact"
};

// Column headers per tab (first row). Keep names human-readable.
var HEADERS = {
  "Tours": ["Timestamp", "Name", "Phone", "Email", "Destination", "Travel Date", "Travellers", "Package", "Message", "Source Page"],
  "Cars": ["Timestamp", "Name", "Phone", "Email", "Vehicle / Route", "Destination", "Travel Date", "Travellers", "Message", "Source Page"],
  "Contact": ["Timestamp", "Name", "Phone", "Email", "Destination", "Travel Date", "Travellers", "Package", "Message", "Source Page"]
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var formType = String(data.formType || "tour");
    var tabName = TABS[formType] || "Tours";

    var lock = LockService.getScriptLock();
    lock.waitLock(10000); // wait up to 10s for concurrent writes

    try {
      var sheet = getOrCreateSheet(tabName);
      appendLead(sheet, data, formType);
    } finally {
      lock.releaseLock();
    }

    return json({ ok: true, tab: tabName });
  } catch (err) {
    // Return 200 with ok:false so the passthrough can read the error body
    // (non-2xx statuses from Apps Script lose the body in redirects).
    return json({ ok: false, error: String(err) });
  }
}

/** Basic CORS preflight support (direct browser calls, not needed for the
 *  server passthrough, but harmless and useful for testing). */
function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    var headers = HEADERS[name] || HEADERS["Tours"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendLead(sheet, data, formType) {
  var now = new Date();
  var values = [
    now,
    data.name || "",
    data.phone || "",
    data.email || "",
    data.destination || "",
    data.travelDate || "",
    data.travellers || "",
    data.package || "",
    data.message || "",
    data.page || ""
  ];
  sheet.appendRow(values);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
