/**
 * CREW Submissions — Google Apps Script backend (v3)
 * ==================================================
 * Semua submission dari website crewarc.xyz (form WL + form $CREW airdrop)
 * masuk sebagai baris baru di Google Sheet ini.
 *
 * PENTING (setelah mengganti kode ini):
 *   Deploy → "Manage deployments" → ikon pensil (Edit) →
 *   Version: pilih "New version" → Deploy.
 *   (Tanpa "New version", kode lama yang masih berjalan tetap dipakai!)
 *   URL web app TIDAK berubah.
 *
 * SATU KALI SAJA: di tab "Airdrop", hapus baris-baris tes lama
 * (format 2 kolom) sebelum/ sesudah deploy v3 supaya rapi.
 *
 * Hasil di sheet:
 *   - Tab "WL"      : Timestamp (WIB) | Wallet | Comment link
 *   - Tab "Airdrop" : Timestamp (WIB) | Wallet | Post link
 */

function handle(p) {
  var isAirdrop = p.type === "airdrop";
  if (p.type !== "wl" && !isAirdrop) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureSheet(ss, isAirdrop ? "Airdrop" : "WL");
  var ts = new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta" });
  if (isAirdrop) {
    sheet.appendRow([ts, String(p.wallet || ""), String(p.post || "")]);
  } else {
    sheet.appendRow([ts, String(p.wallet || ""), String(p.comment || "")]);
  }
  return { ok: true, saved: true };
}

function ensureSheet(ss, name) {
  var header = name === "Airdrop"
    ? ["Timestamp (WIB)", "Wallet", "Post link"]
    : ["Timestamp (WIB)", "Wallet", "Comment link"];
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
    return sheet;
  }
  // Upgrade header otomatis kalau masih layout lama
  var a1 = String(sheet.getRange(1, 1).getValue());
  var b1 = String(sheet.getRange(1, 2).getValue());
  if (a1 !== header[0] || b1 !== header[1]) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
  return sheet;
}

// Website mengirim: GET {url}?type=wl&wallet=...&comment=...
// atau:             GET {url}?type=airdrop&wallet=...&post=...
function doGet(e) {
  var out;
  try {
    if (e && e.parameter && (e.parameter.type === "wl" || e.parameter.type === "airdrop")) {
      out = handle(e.parameter);
    }
    if (!out) out = { ok: true, msg: "CREW submissions endpoint is live" };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// Fallback: POST dengan body JSON (jika request datang sebagai POST langsung)
function doPost(e) {
  var out;
  try {
    var data = e && e.postData ? JSON.parse(e.postData.contents) : null;
    out = data ? handle(data) : null;
    if (!out) out = { ok: true, msg: "CREW submissions endpoint is live (POST)" };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
