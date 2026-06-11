# Görev Listesi

## Aktif Görev
- [x] Tüm Ana Görevler Tamamlandı!

## Sıradaki

## Tamamlanan
- [x] Dahili Dil Paketi (Pre-bundled i18n): Uygulama kutudan çıktığı an (Out-of-the-box) 10 farklı dünya dilini (tr, en, zh, es, fr, ar, hi, ru, pt, de) destekleyecek şekilde ayarlandı. İşletim sistemi tespiti ile otomatik atama eklendi.
- [x] PDF Modülü Onarımı ve Geliştirmesi: Ayarlar'dan çekilecek "Şirket Adı" ve "Logo" ile dinamik PDF anteti oluşturulması.
- [x] Uluslararasılaştırma ve Tema (i18n): i18next kurularak çoklu dil desteği (TR/EN) ve Açık/Koyu tema geçişinin kalıcı ayar olarak eklenmesi tamamlandı.
- [x] Grup Bazlı Raporlama: Dashboard ekranına grupların aylık hak ediş ve avans bakiye analizlerini (Ayrıca Devreden Bakiye verisini) detaylı gösteren tarih filtreli modül eklenecek.
- [x] Excel İçe Aktarım (Import) Zaman Makinesi Entegrasyonu: Toplu Excel aktarımlarından hemen önce otonom snapshot alınması ve UI üzerinden "Son İşlemi Geri Al" seçeneği (15 saniye ekranda duran Toast) başarıyla eklendi.
- [x] Sistem Logları İleri Seviye Dışa Aktarım: Ayarlar -> Sistem Kayıtları sayfasından filtrelenen logların .xlsx, .csv, .json, .md ve .txt formatlarında dışa aktarılabilmesi tamamlandı.
- [x] TC Kimlik ve Doğrulama: İşçi ekleme/düzenleme formunda 11 haneli algoritma tabanlı TC Kimlik numarası doğrulaması zorunluluğu (boş bırakılabilir ama yazılırsa doğru olmalı) başarıyla eklendi.
- [x] Kendi Kendini Anlatan UX: Tüm bileşenlerde (İşçi Profili, Kasa) kritik silme işlemleri için yeni `ConfirmationModal` entegrasyonu tamamlandı.
- [x] Sınırları Kaldıran Etiket (Tag) ve Anomali Sistemi: `TagInput` bileşeni, tüm formlara etiket entegrasyonu, `AnomalyPanel` (eksi bakiye uyarıları) ve `crudService.js` `readRecord` soft-delete düzeltmesi tamamlandı.
- [x] İşçi Profil Sayfası (Hesap Ekstresi) Güncellemeleri: Dinamik Tarih Aralığı, Kelime araması, "Devreden Bakiye" backend hesaplaması ve dinamik PDF/Excel antet desteği eklendi.
- [x] Otonom Bakım ve Veri Güvenliği (Zero-Maintenance): SQLite `VACUUM` motoru, "Zaman Makinesi" `createSnapshot`/`restoreSnapshot` yedeği ve "Sessiz Bulut Yedekleme" (Kapanışta senkron) tamamlandı.
- [x] İki Katmanlı Gelişmiş Loglama (Advanced Logging): İşletim sistemi tabanlı (electron-log) tarih rotasyonlu loglama, "İnsan dilinde okuma (Türkçe cümleler)" çevirisi ve dışa aktarım seçenekleri tamamlandı.
- [x] Kendi Kendini Anlatan UX (Kısmi): Evrensel `ConfirmationModal` bileşeni yazıldı. "Ayarlar" sayfasındaki kritik butonlara Satır İçi Rehberlik (Inline Help) ve Onay modalları entegre edildi.
- [x] Gelişmiş Arama, Filtreleme ve Dinamik Takvim: Personel ve Kasa ekranlarına Başlangıç/Bitiş (Date Range) ve İşlem Yönü filtreleri eklendi.
- [x] Çoklu Dışa Aktarım (Multi-Format Export): Filtrelenmiş tablolar için .xlsx, .csv, .json, .md ve .txt export mekanizmaları eklendi.
- [x] Tam Yedekleme (Full Backup): Tüm veritabanının anında .sqlite olarak indirilmesi özelliği tamamlandı.
- [x] Gruplama Mimarisi: `worker_groups` tablosu, `group_id` foreign key altyapısı ve grup yönetimi ekranı kodlandı.
- [x] Raporlama V3 (Aylık Puantaj, PDF Çıktısı, Finansal Özet) tamamlandı.
- [x] V2 Arayüzü: Kasa, Personel Cari, Ayarlar ve Puantaj ekranlarının dizaynı yapıldı.
- [x] V1 Arayüzü: İşçi Yönetimi CRUD işlemleri ve IPC entegrasyonu kuruldu.
- [x] TDD altyapısı, Electron + Vite boilerplate ve IPC/SQLite bağlantıları kuruldu.
- [x] Proje gereksinim analizi, şema, kurallar ve mimari dosyalar oluşturuldu.

## Engellenen
- [ ] Yok