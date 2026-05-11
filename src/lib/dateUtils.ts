/**
 * Date Utilities — Device Local Time
 * 
 * Semua timestamp disimpan dalam waktu lokal device,
 * karena kolom database menggunakan "timestamp without time zone".
 * Ini menghilangkan semua masalah konversi UTC ↔ Lokal.
 */

/**
 * Mendapatkan timestamp lokal dalam format yang aman untuk database.
 * Output: "2026-05-10 00:28:00"
 */
export function getLocalTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${sec}`;
}

/**
 * Mendapatkan tanggal lokal hari ini dalam format YYYY-MM-DD.
 * Output: "2026-05-10"
 */
export function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Mengekstrak bagian tanggal (YYYY-MM-DD) dari string timestamp.
 * Aman untuk format: "2026-05-10 00:28:00", "2026-05-10T00:28:00Z", "2026-05-10T00:28:00"
 */
export function extractDate(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;
  // Ambil 10 karakter pertama: "YYYY-MM-DD"
  return timestamp.substring(0, 10);
}

/**
 * Mengecek apakah sebuah timestamp berasal dari hari ini (waktu lokal device).
 */
export function isToday(timestamp: string | null | undefined): boolean {
  const dateStr = extractDate(timestamp);
  if (!dateStr) return false;
  return dateStr === getTodayDate();
}

/**
 * Mengecek apakah sebuah timestamp BUKAN dari hari ini (hari baru telah berganti).
 */
export function isNewDay(timestamp: string | null | undefined): boolean {
  return !isToday(timestamp);
}

/**
 * Mendapatkan nomor minggu ISO (Senin sebagai awal minggu).
 */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Mengecek apakah sudah berganti minggu (untuk reset Senin).
 */
export function isNewWeek(lastTimestamp: string | null | undefined): boolean {
  if (!lastTimestamp) return true;
  const lastDate = new Date(lastTimestamp.replace(' ', 'T'));
  const now = new Date();
  
  // Jika tahun beda, pasti minggu beda (atau minimal reset)
  if (now.getFullYear() !== lastDate.getFullYear()) return true;
  
  return getISOWeek(now) !== getISOWeek(lastDate);
}
