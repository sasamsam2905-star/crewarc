/**
 * CREW Submissions — Google Apps Script backend
 * ==============================================
 * Semua submission dari website crewarc.xyz (form WL + form $CREW airdrop)
 * akan ditambahkan sebagai baris baru di Google Sheet ini.
 *
 * Setup (5 menit):
 * 1. Buat Google Sheet baru: https://sheets.new  → beri nama "CREW Submissions"
 * 2. Menu: Extensions → Apps Script
 * 3. Hapus isi editor, paste SELURUH kode ini, simpan (Ctrl+S)
 * 4. Klik "Deploy" (tombol panah) → "New deployment"
 *    - Icon gear → pilih "Web app"
 *    - Description : CREW submissions
 *    - Execute as  : Me (akunmu)
 *    - Who has access : Anyone
 *    - Klik "Deploy" → izinkan akses (Review permissions → Advanced → Go to project → Allow)
 * 5. Salin "Web app URL" (berakhiran /exec) → kirim ke developer untuk di-wire ke website
 *
 * Hasil di sheet:
 *  - Tab "WL"      : Timestamp (WIB) | Wallet | Comment link
 *  - Tab "Airdrop" : Timestamp (WIB) | Post link
 * Tab dibuat otomatis saat submission pertama masuk.
 */

function doPost(e) {
  var out;
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var isAirdrop = data.type === "airdrop";
    var sheet = ensureSheet(ss, isAirdrop ? "Airdrop" : "WL");
    var ts = new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta" });
    if (isAirdrop) {
      sheet.appendRow([ts, String(data.post || "")]);
    } else {
      sheet.appendRow([ts, String(data.wallet || ""), String(data.comment || "")]);
    }
    out = { ok: true };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
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

// Untuk cek cepat: buka URL /exec langsung di browser
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, msg: "CREW submissions endpoint is live" }))
    .setMimeType(ContentService.MimeType.JSON);
}
