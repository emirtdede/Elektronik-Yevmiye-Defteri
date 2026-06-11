# Ortam Yapılandırması

## Kurulum Adımları

# 1. Bağımlılıkları yükle
npm install

# 2. Geliştirme ortamını başlat (Electron + React aynı anda çalışır)
npm run dev

# 3. Üretime hazır uygulama (.exe vb.) oluştur
npm run build

## Environment Değişkenleri
Proje %100 yerel ve internetsiz (offline) çalıştığı için herhangi bir API anahtarı (Secret Key), veritabanı URL'si veya bulut entegrasyon şifresi içermez. Özel bir `.env` dosyasına şu an için ihtiyaç yoktur.

## Gereksinimler
- Node.js: v20.0 veya üzeri (Electron ve SQLite native modülleri için gereklidir).