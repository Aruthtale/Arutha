# Rangkuman Perkembangan ARUTHA (7 Mei 2026)

### 1. Sistem Integritas & Anti-Cheat (Core Loop)
*   **Verification Modal**: Setiap penyelesaian quest harian kini mewajibkan pengguna menuliskan catatan refleksi/bukti pengerjaan.
*   **AI Verifier**: Menggunakan `gemini-3.1-flash-lite-preview` untuk menganalisis kejujuran catatan user. Jika catatan tidak logis atau terlalu singkat, XP tidak akan diberikan.
*   **Refresh Limit**: Membatasi pergantian quest (*refresh*) menjadi maksimal **1 kali per hari** untuk menjaga keaslian progres karakter.

### 2. Restrukturisasi Database (Stabilitas Tinggi)
*   **Pembaruan Tabel**: Mengubah nama tabel utama menjadi `arutha_users` (via `@@map` di Prisma) untuk menghindari konflik dengan *reserved keyword* `User` di PostgreSQL/Supabase.
*   **Sinkronisasi Skema**: Menambahkan kolom `activeQuests`, `lastQuestUpdate`, `refreshCount`, dan `lastRefreshDate` untuk mendukung fitur integritas.
*   **Fix Error 400/403/406**: Mengatasi masalah izin akses (RLS) dan sinkronisasi cache skema di Supabase.

### 3. AI Infrastructure (Gemini 3.1)
*   **Modern Models Only**: Seluruh fungsi AI (Analisis Karakter, Quest Gen, Verifikasi) hanya menggunakan model versi 3.1 atau 3 Preview yang didukung.
*   **Fallback Logic**: Menambahkan sistem cadangan otomatis. Jika `gemini-3.1-flash-lite-preview` sibuk (Error 503), sistem akan beralih ke `gemini-3.1-flash-lite` untuk menjaga kelancaran UX.
*   **Awareness**: Menghindari model yang sudah *deprecated* (seperti Gemini 3 Pro Preview yang mati per 9 Maret 2026).

### 4. UI/UX Premium
*   **Halaman Profile**: Membuat `Profile.tsx` yang menampilkan *character sheet* dengan bar statistik dinamis, avatar, dan daftar pencapaian (*achievements*).
*   **Integritas Feedback**: Menambahkan animasi loader dan pesan feedback instan dari AI saat proses verifikasi quest di Dashboard.

### 5. Status Teknis
*   **Tech Stack**: React, Tailwind CSS, Supabase (Auth/DB), Prisma v7.
*   **Model Utama**: `gemini-3.1-flash-lite-preview`.
*   **Tabel Database**: `arutha_users`, `CharacterProfile`.

---
**Catatan Penting**: Selalu jalankan `NOTIFY pgrst, 'reload schema';` setelah melakukan perubahan skema database agar API Supabase tetap sinkron.
