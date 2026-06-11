# Mimari Kararlar

## ADR-001 — Çatı Teknolojisi Olarak Electron.js Seçimi
Tarih: 2026-06-11
Durum: Aktif

Karar: Masaüstü uygulaması geliştirmek için C#/.NET veya Java yerine Electron.js (React + Node.js) tercih edildi.

Sebep: 
Geliştirme hızının yüksek olması, modern web arayüzlerinin (Tailwind/React) gücünden faydalanılmak istenmesi ve gerektiğinde Windows/Mac/Linux platformlarına kolayca çıktı (build) alınabilmesi.

Alternatifler değerlendirildi:
- .NET / C#: Windows için harika ama çapraz platform desteği ve modern UI tasarımı React kadar esnek değil.
- Sadece Web (Tarayıcı + Yerel Sunucu): Kullanıcının arka planda bir sunucu çalıştırmasını gerektirir, son kullanıcı için kurulumu zordur.

Sonuç: Tek bir `.exe` ile kurulabilen Electron.js tercih edildi.

---

## ADR-002 — PDF İçeri Aktarımının (Import) Reddedilmesi
Tarih: 2026-06-11
Durum: Aktif

Karar: Dış sistemlerden veri alırken PDF dosyalarının taranıp parse edilmesi fikri iptal edildi, sadece Excel (.xlsx) ve CSV desteklenecek.

Sebep: 
PDF yapılandırılmış bir veri formatı değildir. Satır ve sütunlardaki en ufak bir kayma, yanlış finansal hesaplamalara (işçinin alacağının eksik/fazla çıkmasına) yol açarak projenin "matematiksel güvenilirlik" amacını zedeler.