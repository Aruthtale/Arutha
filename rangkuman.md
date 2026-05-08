# DOKUMENTASI & RANGKUMAN TEKNIS KOMPREHENSIF ARUTHA

Selamat datang di dokumentasi lengkap proyek **ARUTHA**. Laporan ini disusun untuk memberikan gambaran menyeluruh tentang arsitektur, fitur-fitur RPG, riwayat penanganan bug, dan status sistem saat ini.

---

## I. ARSITEKTUR & TEKNOLOGI UTAMA
Aplikasi ini dibangun dengan tumpukan teknologi modern untuk memastikan performa dan skalabilitas:
*   **Frontend**: React (Vite) dengan TypeScript untuk keamanan tipe data.
*   **Styling**: Tailwind CSS untuk antarmuka yang responsif dan estetis (RPG Theme).
*   **Backend & Database**: Supabase (PostgreSQL) dengan Prisma sebagai ORM untuk manajemen skema.
*   **Kecerdasan Buatan**: Google Gemini API (Model: Flash 1.5 & Pro 1.5) sebagai "Game Master".

---

## II. FITUR-FITUR RPG & MEKANIK UTAMA

### 1. Sistem Inisialisasi Karakter (Onboarding)
*   **Analisis Psikologis**: User menjawab serangkaian pertanyaan situasional. AI Gemini menganalisis jawaban tersebut untuk menentukan tipe kepribadian (Personality Type) dan statistik awal.
*   **Penentuan Statistik**: 5 dimensi utama yaitu **JIWA, RAGA, HARTA, ILMU, dan KARMA**. Nilai awal (20-90) ditentukan berdasarkan hasil analisis AI terhadap jawaban user.
*   **Penyimpanan Profil**: Data profil disimpan di tabel `character_profile` yang terhubung dengan tabel user utama melalui `user_id`.

### 2. Sistem Quest Harian & Mood Check-in
*   **Personalisasi Quest**: Quest dihasilkan setiap hari berdasarkan statistik terendah user untuk mendorong keseimbangan karakter.
*   **Mood Context**: Sebelum memulai hari, user melakukan *check-in* mood menggunakan emoji. AI akan menyesuaikan gaya bahasa dan tingkat kesulitan quest berdasarkan mood tersebut (misal: jika sedang sedih, quest dibuat lebih ringan dan menghibur).
*   **Mekanisme Refresh**: User memiliki jatah 1x refresh per hari jika quest yang diberikan kurang sesuai.
*   **Verifikasi AI**: Saat user menyelesaikan quest, mereka harus memberikan catatan (note). AI akan memverifikasi apakah catatan tersebut relevan dengan tugas yang diberikan sebelum memberikan reward XP.

### 3. Sistem Ketidakaktifan (Decay System)
*   **Pengecekan Inaktivitas**: Setiap kali user login, sistem menghitung selisih hari sejak aktivitas terakhir (`last_active_date`).
*   **Penalti Stat**: Jika user tidak aktif lebih dari 3 hari, statistik akan berkurang secara otomatis (penalti stat sebesar 2-5 poin per dimensi).
*   **Status Fatigue**: Pemain yang terlalu memaksakan diri atau terkena efek decay akan masuk ke status *Fatigue*, yang ditandai dengan banner peringatan di Dashboard.
*   **Recovery Session**: Jika terkena dampak decay, user dapat mengambil quest pemulihan khusus untuk mengembalikan statistik mereka ke kondisi normal.

### 4. Mekanik Evolusi
*   **Leveling System**: XP diperoleh dari penyelesaian quest. Setiap 1000 XP, user akan naik level.
*   **Cooldown Evolusi**: User dapat melakukan "Evolusi" (onboarding ulang untuk memperbarui profil) setiap 7 hari sekali. Sistem akan menghitung mundur sisa hari jika belum mencapai waktu evolusi.

---

## III. RIWAYAT BUG & PENANGANAN TEKNIS (DEBUGGING LOG)

Laporan ini mencatat bug-bug kritis yang berhasil diselesaikan selama proses pengembangan:

### 1. Error 400 - Bad Request (Supabase Selection)
*   **Masalah**: Query `select` meminta kolom `name_change_count` dan `last_name_change` yang ternyata belum dibuat di database Supabase (meskipun sudah ada di skema Prisma).
*   **Solusi**: Menghapus referensi kolom tersebut dari query inisialisasi di `App.tsx` dan `Settings.tsx` sampai migrasi database selesai dilakukan.

### 2. Error 406 - Not Acceptable (PGRST116)
*   **Masalah**: Penggunaan fungsi `.single()` pada query Supabase menyebabkan aplikasi crash jika hasil pencarian kosong (terutama untuk user baru).
*   **Solusi**: Mengganti `.single()` dengan pencarian biasa menggunakan `.limit(1)` dan mengambil indeks ke-0, serta menambahkan logika penanganan data `null`.

### 3. Error 500 - Internal Server Error (Vite/Duplicate)
*   **Masalah**: Terjadi duplikasi deklarasi fungsi `handleUpdateName` dan `generateInitialQuests` di dalam `App.tsx` akibat penggabungan kode yang kurang sempurna.
*   **Solusi**: Melakukan audit kode secara menyeluruh dan menghapus versi fungsi yang redundan, serta mempertahankan versi yang paling mutakhir.

### 4. Race Condition - Refresh Quest Spam
*   **Masalah**: User bisa menekan tombol refresh quest berkali-kali dalam waktu singkat, menyebabkan limit harian terlampaui atau data di database menjadi kacau.
*   **Solusi**: Implementasi `refreshLockRef` menggunakan `useRef` sebagai *mutex lock*. Tombol akan terkunci seketika setelah ditekan dan hanya akan terbuka kembali setelah proses server selesai.

### 5. Constraint Violation - Null ID
*   **Masalah**: Proses `upsert` data user gagal karena kolom `id` di database Supabase tidak terisi otomatis (melanggar batasan *not-null*).
*   **Solusi**: Menambahkan pembuatan ID manual di sisi klien menggunakan `crypto.randomUUID()` pada setiap proses pembuatan data user baru.

---

## IV. STATUS HALAMAN & NAVIGASI (SITEMAP)

1.  **Landing Page**: Gerbang utama, menampilkan branding Arutha dan tombol akses masuk.
2.  **Auth (Login/Register)**: Terintegrasi dengan email/password dan **Google Social Login**.
3.  **Onboarding**: Pengalaman naratif tes kepribadian berbasis AI.
4.  **Character Reveal**: Halaman transisi yang menampilkan hasil analisis kepribadian dan statistik awal.
5.  **Dashboard**: 
    *   Tampilan Radar Chart (Statistik).
    *   List Quest Harian.
    *   Banner Status (Decay/Fatigue).
    *   Akses ke Mood Check-in.
6.  **Profile**: Resume progres karakter, pencapaian level, dan ringkasan kepribadian.
7.  **Settings**:
    *   Perubahan Nama (dengan proteksi cooldown 3 hari).
    *   Manajemen Akun & Logout.
    *   Pengaturan Preferensi (Notifikasi & Suara).

---

## V. CATATAN PENGEMBANGAN MASA DEPAN
*   **RLS (Row Level Security)**: Mengaktifkan kebijakan keamanan di Supabase untuk memastikan setiap user hanya bisa mengakses datanya sendiri.
*   **Database Migration**: Menjalankan SQL untuk menambahkan kolom `name_change_count` dan `last_name_change` agar fitur ganti nama menjadi lebih canggih.
*   **Sistem Guild/Party**: Fitur sosial untuk menyelesaikan quest bersama teman.

---
**Status Terakhir (8 Mei 2026):** *Sistem dinyatakan STABLE. Semua error kritis telah diatasi. Aplikasi siap untuk pengujian user lebih lanjut.*
