# Dosya Yapısı

## Genel Bakış

```text
project-root/
├── src/
│   ├── main/                 # Electron Ana Süreci (Backend)
│   │   ├── index.js          # Electron giriş dosyası
│   │   ├── ipcHandlers.js    # IPC kanallarının dinlendiği yer
│   │   ├── database/         # SQLite bağlantı ve sorgu dosyaları
│   │   └── utils/            # Excel/PDF okuma-yazma yardımcıları
│   │
│   ├── preload/              # IPC ContextBridge (Güvenlik köprüsü)
│   │   └── index.js
│   │
│   └── renderer/             # React Uygulaması (Frontend)
│       ├── src/
│       │   ├── components/   # Ortak UI bileşenleri (Buton, Tablo vb.)
│       │   ├── pages/        # Ana sayfalar (İşçiler, Kasa, Ayarlar)
│       │   ├── context/      # Global state yönetimi
│       │   └── App.jsx
│       └── index.html
│
├── project_docs/             # Vibe Coding Belgeleri
└── package.json