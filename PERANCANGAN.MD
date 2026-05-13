# PERANCANGAN SISTEM: ARUTHA

## 1. ALUR NARASI (NARRATIVE FLOW)
Arutha adalah aplikasi *mobile-first* yang mengubah pengembangan diri menjadi petualangan RPG. Saat pengguna baru membuka aplikasi, mereka disambut oleh antarmuka misterius dan harus melewati fase **Onboarding Psikologis**. AI akan memberikan serangkaian pertanyaan mendalam untuk menganalisis kepribadian mereka. Setelah selesai, sistem melakukan **Character Reveal**, menampilkan tipe kepribadian (MBTI-style) dan status awal mereka yang terbagi dalam 5 dimensi: JIWA, RAGA, HARTA, ILMU, dan KARMA.

Setelah itu, pengguna masuk ke **Dashboard Utama**. Alih-alih membuat to-do list sendiri, AI bertindak sebagai *Game Master* yang men-generate misi (Quest) Harian, Mingguan, dan Bulanan secara spesifik berdasarkan kelemahan dan kekuatan status pengguna. Saat pengguna menyelesaikan misi, mereka harus mengunggah bukti (teks/foto) yang akan **diverifikasi oleh AI**. Keberhasilan misi memberikan XP dan meningkatkan status. Jika XP penuh, pengguna akan **Level Up** dan mendapatkan poin untuk memilih **Bakat (Talent)** pasif.

Jika pengguna merasa lelah atau *burnout*, ada sistem **Decay & Recovery** di mana AI menyadari absennya pengguna dan memberikan Misi Pemulihan yang ringan. Selain itu, pengguna dapat berinteraksi dengan **Arbiter** (asisten sistem) dan **Soul Guard** (psikolog pribadi) melalui fitur obrolan khusus. Terdapat pula **Admin Sanctum** bagi pengelola untuk memantau aktivitas dan memberikan *Global Quest* (Misi Dunia) yang bisa diperebutkan oleh seluruh pahlawan.

---

## 2. DIAGRAM

| Nama Diagram | Link Diagram |
| :--- | :--- |
| ERD | `erd_arutha.jpg` |
| Usecase Diagram | `usecase_arutha.jpg` |
| Activity Diagram (Onboarding & Analisis AI) | `activity_onboarding.jpg` |
| Activity Diagram (Penyelesaian & Verifikasi Misi) | `activity_quest_verification.jpg` |

---

## 3. THIRD PARTY

| Layanan | Keterangan | Penggunaan |
| :--- | :--- | :--- |
| **Google Gemini API** | AI Model (`gemini-1.5-flash`, `gemini-1.5-pro`) | Pembuatan misi, analisis karakter, verifikasi bukti misi, sistem chat Arbiter & Soul Guard. |
| **Supabase** | Backend-as-a-Service | Database (PostgreSQL), Autentikasi (Auth), Storage (Foto bukti misi), dan keamanan data (Row Level Security). |
| **Vercel / Netlify** | Cloud Hosting | Hosting untuk frontend React (Vite). |
| **Firebase FCM** *(Future)* | Push Notification | Mengirim notifikasi pengingat misi harian atau streak. |
| **Midtrans** *(Future)* | Payment Gateway | Pembelian item kosmetik premium atau langganan Soul Guard Pro. |

---

## 4. FITUR

| Fitur | Deskripsi |
| :--- | :--- |
| **AI Psychological Onboarding** | Pembuatan karakter otomatis berdasarkan wawancara singkat dengan AI. |
| **Dynamic AI Quests** | Misi Harian (Rites), Mingguan (Trials), Bulanan (Sagas) yang di-generate AI berdasarkan kelemahan status user. |
| **AI Proof Verification** | Validasi bukti penyelesaian misi (teks/foto) menggunakan AI Vision & NLP untuk mencegah kecurangan. |
| **RPG Progression** | Sistem Level, XP, dan Status (JIWA, RAGA, HARTA, ILMU, KARMA) dengan visualisasi Radar Chart. |
| **Talent System (Bakat)** | Pengguna memilih bakat pasif (modifier XP/Status) setiap mencapai level milestone tertentu. |
| **AI Companions** | Chatbot pintar terintegrasi: *Arbiter* (Kalkulator sistem) dan *Soul Guard* (Dukungan psikologis). |
| **Fatigue & Recovery** | Deteksi *burnout* (tidak login beberapa hari) yang memicu misi pemulihan ringan agar status tidak turun. |
| **Admin Sanctum** | Dashboard khusus admin untuk mengelola user, membuat Global Quest (Misi Dunia), dan RLS bypass. |
| **Global Quests (Anomaly)** | Misi dunia yang dibuat admin dan bisa diklaim siapa saja, siapa cepat dia dapat. |

---

## 5. ENTITAS (DATABASE)

| Tabel | Deskripsi |
| :--- | :--- |
| `arutha_user` | Menyimpan data inti pengguna (level, xp, streak, talents, active_quests). |
| `character_profile` | Menyimpan hasil analisis psikologis (tipe kepribadian, nilai 5 dimensi stat, summary). |
| `stat_history` | Mencatat riwayat perubahan status pengguna setiap hari untuk grafik perkembangan. |
| `arutha_global_quests` | Menyimpan data Misi Dunia yang di-broadcast oleh admin. |
| `arutha_global_quest_submissions` | Menyimpan bukti pengajuan dari user untuk Global Quest yang menunggu approval admin. |
| `arutha_quest_log` | *(Baru)* Menyimpan riwayat penyelesaian misi personal (Daily/Weekly) beserta *feedback* AI. |

---

## 6. BREAKDOWN BACK-END

*   **Autentikasi:** Supabase Auth (Email/Password).
*   **Keamanan (RLS):** 
    *   Setiap user hanya bisa `SELECT`, `UPDATE`, `INSERT` data milik mereka sendiri (berdasarkan `supabase_id`).
    *   Admin memiliki *Policy* khusus berbasis verifikasi email (`aruthtale@gmail.com`) untuk `DELETE` atau moderasi data.
*   **Penyimpanan Cache AI:** Menyimpan hasil output JSON dari Gemini ke dalam JSONB PostgreSQL (`active_quests`, `talents`) untuk menghindari hit API yang redundan dan terkena `429 Too Many Requests`.
*   **Database Triggers (Supabase):** Trigger SQL otomatis untuk mengupdate kolom `updated_at` setiap kali ada baris data yang diubah.

---

## 7. UI MOBILE (TASK BREAKDOWN)

*Berikut adalah daftar layar/komponen UI beserta status penyelesaiannya. Bagian bawah berisi ide tambahan (Future Enhancements) untuk pengembangan ke depan.*

| No | UI / Screen | Keterangan | Status |
| :--- | :--- | :--- | :--- |
| **CORE SYSTEM & ONBOARDING** | | | |
| 1 | Pemasangan Template / Konfigurasi Tailwind | *Setup UI awal (rpg-theme)* | v (Complete) |
| 2 | Pembuatan Database (Supabase) | *Skema dan RLS* | v (Complete) |
| 3 | Splash Screen / Landing Page | *Gerbang masuk Arutha* | v (Complete) |
| 4 | Register / Login | *Supabase Auth* | v (Complete) |
| 5 | Onboarding Dialog (Tanya Jawab AI) | *Wawancara dengan AI* | v (Complete) |
| 6 | Character Reveal | *Animasi Radar Chart hasil Onboarding* | v (Complete) |
| 7 | Complete Profile | *Pengisian tanggal lahir, gender, zodiak* | v (Complete) |
| **DASHBOARD & QUESTS** | | | |
| 8 | Dashboard Utama (HUD) | *Menampilkan Level, XP, Streak, Radar* | v (Complete) |
| 9 | Misi Harian (Rites) | *Card misi dengan interaksi verifikasi* | v (Complete) |
| 10 | Misi Mingguan (Trials) | *Misi panjang berfase* | v (Complete) |
| 11 | Misi Bulanan (Sagas) | *Misi pencapaian besar* | v (Complete) |
| 12 | Misi Dunia (Anomaly / Global) | *Misi dari admin* | Ready for review |
| 13 | Verifikasi Modal (Upload Bukti) | *Popup kirim catatan & foto* | v (Complete) |
| 14 | Modal Level Up | *Notifikasi ketika XP penuh* | v (Complete) |
| 15 | Pemilihan Bakat (Talent Modal) | *Pilih pasif skill* | v (Complete) |
| **SOSIAL & PROFIL** | | | |
| 16 | Profil Pengguna | *Detail karakter dan inventory bakat* | v (Complete) |
| 17 | Grafik Riwayat Stat | *Line chart performa status* | v (Complete) |
| 18 | Chat Arbiter | *Chatbot asisten sistem* | v (Complete) |
| 19 | Chat Soul Guard | *Chatbot pendamping mental* | v (Complete) |
| **ADMINISTRATOR** | | | |
| 20 | Admin Sanctum (Dashboard) | *Pantau total user & log* | Ready for review |
| 21 | Manajemen Global Quest | *Buat & Hapus misi dunia* | Ready for review |
| 22 | Verifikasi Global Quest | *Terima/Tolak bukti user* | Ready for review |
| **FUTURE ENHANCEMENTS (Rencana Pengembangan)** | | | |
| 23 | Notifikasi Push (Pengingat Streak) | *Integrasi Firebase agar user login* | Planned |
| 24 | Sistem Item / Kosmetik | *Avatar frame atau tema aura berbeda* | Planned |
| 25 | Toko Premium (In-App Purchase) | *Integrasi Payment Gateway (Tripay)* | Planned |
| 26 | Sistem "Guild" (Grup) | *Komunitas antar pahlawan dengan stat mirip*| Planned |
| 27 | Leaderboard Bulanan | *Peringkat hero berdasarkan XP/Karma* | Planned |
| 28 | Analitik Mental Mendalam | *Laporan PDF hasil observasi Soul Guard* | Planned |
| 29 | Mode "Offline" Sementara | *Penyimpanan lokal dengan PWA Service Worker*| Planned |
| 30 | Integrasi Kalender/Kesehatan OS | *Menarik data step/tidur dari Google Fit/Apple Health*| Planned |
