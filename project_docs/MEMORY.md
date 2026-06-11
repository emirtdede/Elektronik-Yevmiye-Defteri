# Proje Hafızası

Son güncelleme: 2026-06-11

## Proje Özeti
Elektronik Yevmiye Defteri; internetsiz (offline) çalışan, işçi puantaj ve avans/cari takibini yerel veritabanında tutan, Electron + React tabanlı bir iç denetim yazılımıdır. Resmi muhasebe programı değildir.

## Teknik Özet
- Frontend: React.js (Tailwind CSS)
- Backend: Node.js (Electron IPC)
- DB: SQLite (Yerel)
- Auth: Tek Kullanıcı / Yerel Erişim (Giriş ekranı yok)

## Şu Anki Durum


## Son Yapılan İş

## Dikkat Edilmesi Gerekenler
- Tüm veriler kullanıcının kendi makinesinde (SQLite) tutulmalıdır.
- Hiçbir dış API veya bulut servisi kullanılmayacaktır (Offline-first).
- Excel/CSV parse işlemleri performansı etkilememesi için frontend'de değil, arka planda (Node.js/Electron) yapılmalıdır.