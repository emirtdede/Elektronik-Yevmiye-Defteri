# Görev Listesi (Şantiye İşletim Sistemi & Mini ERP)

## Aktif Görevler

### FAZ 1: VERİTABANI VE YENİ ERP MODÜLLERİ (Backend & DB)
- [x] **Şantiyeler (Lokasyon Yönetimi)**: `projects` tablosunun SQLite şemasına eklenmesi ve tüm kayıtların (personel, puantaj, kasa/malzeme vb.) bu ana projelere bağlanması.
- [x] **İmalat ve Metraj Takipi**: İmalat kalemleri, miktarlar, birimler (m², m³) için `production_records` tablosunun oluşturulması.
- [x] **İrsaliye ve Malzeme (Evrak Geçmişi)**: Malzeme girişleri ve beton fişleri için fotoğraf/dosya yolu destekli `materials` tablosunun oluşturulması.
- [x] **Günlük Jurnal & Otomatik Hava Durumu**: Şantiyenin konumuna göre OpenWeather API entegrasyonu ile otonom günlük durum ve sıcaklık kayıtlarının tutulacağı `daily_journals` tablosunun eklenmesi.
- [x] **Kalite Kontrol (Tutanak/Hatalı İmalat)**: Fotoğraflı ve Açık/Çözüldü durum takipli şantiye tutanakları için `quality_reports` tablosunun eklenmesi.
- [x] **Taşeron (Cari) Takibi**: Kepçeci, yemekçi gibi alt yükleniciler için cari bakiye tablosu (`subcontractor_ledgers`) ve cari işlemler alt yapısının kurulması.
- [x] **İSG Uyarıcısı (Anomali Dedektörü)**: `workers` tablosuna `isg_bitis_tarihi` eklenmesi; bitime 15 gün kala Dashboard'da kırmızı uyarı fırlatacak kontrolün yazılması.
- [x] **Medya Galerisi Backend**: İrsaliye, tutanak ve şantiye bazlı görsellerin listelenmesi için gerekli API ve IPC handler yapısının kurulması.

### FAZ 2: YEREL AĞ (LAN) MOBİL YÜKLEME VE VERİ GÜVENLİĞİ
- [x] **LAN Fotoğraf Yükleyicisi (QR Kod)**: Express.js yerel sunucu entegrasyonu, Multer yükleme motoru, QR kod üretimi ve arayüz entegrasyonu başarıyla tamamlandı.
- [x] **Tek Tıkla Export / Import (Sistem Geri Yükleme)**: SQLite dosyasını üzerine yazıp Electron'u otonom yeniden başlatan IPC handler'ı ve Ayarlar ekranındaki Drag & Drop UI alanı tamamlandı.
- [x] **Sessiz Bulut Yedekleme**: Uygulama kapanırken arkaplanda yedekleme klasörüne sessizce zaman damgalı kopyalama yapan algoritma tamamlandı ve aktifleştirildi.

### FAZ 3: "GOD-TIER" ARAYÜZ MİMARİSİ (UI/UX Redesign)
- [x] **Bento Box Dashboard**: Dashboard tasarımı Apple Widget tarzında asimetrik bento grid yapısına dönüştürüldü.
- [x] **Komuta Merkezi (Ctrl + K)**: Spotlight arama çubuğu entegrasyonu (hızlı arama, sayfalar arası yönlendirme, işçi ve şantiyeler arası hızlı geçiş) sağlandı.
- [x] **Bütünleşik Çalışma Alanı**: Sol navigasyon paneli, sağ dinamik sahne yapısı ve buzlu cam (Glassmorphism) modallar ile form alanları entegre edildi.
- [x] **Mikro Etkileşimler**: Pulsing Skeleton loader (iskelet yükleyiciler) ve butonlar için yaylanma fiziğine (spring animation) sahip micro-interaction geçişleri eklendi.

### FAZ 4: AKILLI YARDIM VE ARAMA MOTORLU SSS (FAQ)
- [x] **Arama Çubuğu (Searchable FAQ)**: Yardım sayfasındaki SSS bölümünün üstüne anlık sorgu yapabilen dinamik arama filtresi ve birinci sınıf sidebar navigasyonu eklendi.
- [x] **Tam Kapsamlı İçerik**: Format atma durumunda veri kaybı riski, yedekleme (Export/Import) adımları ve tüm ERP modüllerinin çalışma rehberi ile SSS içeriği zenginleştirildi.

### FAZ 5: BUGFIX VE STRES TESTİ İYİLEŞTİRMELERİ
- [x] **Kategori 1 (Veri İzolasyonu & Kritik Hatalar)**: Şantiye bazlı veri sızıntılarını önleme, drawer formunu bulanık modal içine alma, varsayılan çalışma çarpanını koruma ve sistem loglarındaki parametre uyuşmazlığını giderme.
- [x] **Kategori 2 (UI/UX ve Arayüz Düzenlemeleri)**: Menü sırası değişimi, tarih temizleyici butonları, silme modalı hizalaması, başlık daraltmaları, profil etiketleri, grup bazlı listeleme ve para birimi formatlamaları.
- [x] **Kategori 3 (Listeleme, Arama ve Sayfalama)**: İSG paneli revizyonu (sekmeleme, ilk 10 kayıt, dikey kaydırma), modül listelerine arama çubuğu ve sayfalama eklenmesi, gereksiz dönem özeti panelinin kaldırılması.
- [ ] **Kategori 4 (Medya, QR ve Zaman Kısıtlamaları)**: Önizleme panellerini birleştirme ve Lightbox zoom entegrasyonu, QR kod modalı, jurnallerde sadece aynı gün düzenleme kısıtı ve yüklenen görsellerin WebP formatında sıkıştırılması.
- [ ] **Kategori 5 (PDF ve Diğer Entegrasyonlar)**: Kılavuz ampul ikonları, PDF logo ve filtre onarımları, WhatsApp / E-Posta entegrasyonu ve i18n çevirileri.

---

## Tamamlananlar
- [x] Dahili Dil Paketi (Pre-bundled i18n): Uygulama kutudan çıktığı an 10 farklı dünya dilini destekleyecek şekilde ayarlandı.
- [x] PDF Modülü Onarımı ve Geliştirmesi: Ayarlar'dan çekilecek "Şirket Adı" ve "Logo" ile dinamik PDF anteti oluşturulması.
- [x] Uluslararasılaştırma ve Tema (i18n): i18next kurularak çoklu dil desteği (TR/EN) ve tema geçişi tamamlandı.
- [x] Grup Bazlı Raporlama: Dashboard ekranına grupların analizlerini detaylı gösteren tarih filtreli modül eklendi.
- [x] Excel İçe Aktarım Zaman Makinesi: Toplu aktarımlarda otonom snapshot alma ve toast ile Geri Al seçeneği eklendi.
- [x] Sistem Logları İleri Seviye Dışa Aktarım: Logların .xlsx, .csv, .json, .md ve .txt olarak dışa aktarılması tamamlandı.
- [x] TC Kimlik ve Doğrulama: 11 haneli algoritma tabanlı TC doğrulaması eklendi.
- [x] Kendi Kendini Anlatan UX: Silme işlemleri için `ConfirmationModal` entegrasyonu tamamlandı.
- [x] Sınırları Kaldıran Etiket ve Anomali Sistemi: `TagInput` bileşeni ve `AnomalyPanel` entegrasyonu tamamlandı.
- [x] İşçi Profil Sayfası (Hesap Ekstresi) Güncellemeleri: Tarih Aralığı, Kelime araması, Devreden Bakiye backend hesaplaması ve PDF/Excel antet desteği eklendi.
- [x] Otonom Bakım ve Veri Güvenliği: SQLite `VACUUM` motoru ve yedek alma özellikleri tamamlandı.
- [x] İki Katmanlı Gelişmiş Loglama: electron-log entegrasyonu ve Türkçe hata çevirileri tamamlandı.
- [x] Kısmi UX İyileştirmeleri: Kritik buton onayları ve inline rehberlik alanları eklendi.
- [x] Gelişmiş Arama, Filtreleme ve Dinamik Takvim tamamlandı.
- [x] Çoklu Dışa Aktarım (Multi-Format Export) tamamlandı.
- [x] Tam Yedekleme (Full Backup) tamamlandı.
- [x] Gruplama Mimarisi tamamlandı.
- [x] Raporlama V3 tamamlandı.
- [x] V2 Arayüzü tamamlandı.
- [x] V1 Arayüzü tamamlandı.
- [x] TDD altyapısı, Electron + Vite boilerplate kuruldu.
- [x] Proje gereksinim analizi yapıldı.