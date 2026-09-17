/**
 * CREW Submissions — Google Apps Script backend (v2)
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
 * Hasil di sheet:
 *   - Tab "WL"      : Timestamp (WIB) | Wallet | Comment link
 *   - Tab "Airdrop" : Timestamp (WIB) | Post link
 */

function handle(p) {
  var isAirdrop = p.type === "airdrop";
  if (p.type !== "wl" && !isAirdrop) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureSheet(ss, isAirdrop ? "Airdrop" : "WL");
  var ts = new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta" });
  if (isAirdrop) {
    sheet.appendRow([ts, String(p.post || "")]);
  } else {
    sheet.appendRow([ts, String(p.wallet || ""), String(p.comment || "")]);
  }
  return { ok: true, saved: true };
}

function ensureSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === "Airdrop") sheet.appendRow(["Timestamp (WIB)", "Post link"]);
    else sheet.appendRow(["Timestamp (WIB)", "Wallet", "Comment link"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Website mengirim: GET {url}?type=wl&wallet=...&comment=...
// atau:             GET {url}?type=airdrop&post=...
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
