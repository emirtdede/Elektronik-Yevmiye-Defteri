---

### `TESTING_STATUS.md`
*(Test süreçlerinin takibi)*

```markdown
# Test Durumu

## TDD (Test-Driven Development) Vizyonu
Projede backend ve finansal iş kuralları kodlanırken **TDD** benimsenmiştir. Hiçbir UI geliştirilmesine, backend iş mantıkları `%100` başarıyla geçmeden başlanmaz.

## Birim Testler
| Modül                         | Durum         | Kapsam / Senaryolar                                      |
|-------------------------------|---------------|---------------------------------------------------------|
|✅ **Güncel Başarı Oranı:** %100 (16 / 16 Test Başarılı)

## Kapsanan Senaryolar (Test Suites)

### 1. Puantaj Matematiği (`wageService.js`)
- [x] Tam gün (1.0 çarpan) standart hesaplama.
- [x] Yarım gün (0.5 çarpan) hesaplama.
- [x] Mesaili gün (1.0 çarpan + saatlik mesai) hak ediş hesaplama.
- [x] Ücretsiz izin (0.0 çarpan) kontrolü.

### 2. Kasa/Cari Otonomisi (`financialService.js`)
- [x] Personel carisinden bir avans silindiğinde, kasaya bağlı (linked) nakit çıkışının da otonom şekilde "Soft Delete" edilmesi.
- [x] Bulunamayan işlemler için çökme önleyici (Graceful Failure) koruma testi.
- [x] Personel carisine bir "Avans" eklendiğinde, kasada anında "Nakit Çıkışı" oluşması ve `linked_cash_id` bağı ile kilitlenmesi.

### 3. Dinamik Bakiye (`balanceService.js`)
- [x] İşçinin tüm puantajlarının `SUM` alınarak, aldığı tüm avansların çıkarılması ve net anlık bakiyenin hesaplanması.
- [x] Sadece `is_deleted = 0` (silinmemiş) olan kayıtların toplama dâhil edilmesi.
- [x] Kaydı olmayan işçiler için sıfır (0) bakiye koruması.

### 4. Raporlama Analitiği (`reportService.js`)
- [x] Aylık raporlarda geçmiş aylardan "Devreden Bakiye" matematiğinin eksiksiz hesaplanması.
- [x] İlgili aya ait "Hak ediş" ve "Avans" toplamlarının filtrelenerek raporlanması.
- [x] Şirket geneli aylık Kasa özetinin Nakit Girişi, Nakit Çıkışı ve İşçilik Maliyeti olarak üç koldan hesaplanması.
- [x] **Cari Hesap Ekstresi:** `generateWorkerStatement` fonksiyonunun dinamik tarih aralıklarında çalışması, filtre öncesi geçmiş kayıtları "Devreden Bakiye" olarak güvenle sum alması ve sonuçları döndürmesi.

### 5. Geriye Dönük Temel Veritabanı (CRUD) Testleri (`crudService.js`)
- [x] **READ Güvenliği:** `is_deleted = 1` olan kayıtların listeleme fonksiyonunda (readRecord) filtrelenmesi.
- [x] **CREATE Otonomisi:** Yeni kayıt eklendiğinde `audit_logs` tablosuna CREATE mührünün vurulması.
- [x] **UPDATE Değişim Kaydı:** Bir kayıt güncellendiğinde, eski (old_values) ve yeni (new_values) verilerin loglanması.
- [x] **SOFT-DELETE Kontrolü:** Fiziksel silme yerine `is_deleted = 1` ve `deleted_at` mührünün başarılı şekilde çalışması.

### 6. İki Katmanlı Gelişmiş Loglama (Advanced Logging)
- [x] **Human-Readable Dönüşüm:** Veritabanı teknik işlemlerinin (Örn: CREATE transactions) "Yeni avans eklendi" gibi Türkçe ve insan odaklı loglara (string) dönüştürülmesi.
- [x] **Akıllı Klasörleme (Daily Rotation):** `electron-log` konfigürasyonunun her gün için yeni bir `logs/YIL/AY/YYYY-MM-DD.log` dosyası oluşturmasının doğrulanması.
- [x] **Arayüz (UI) Besleme:** IPC (`system:read-logs`) kullanılarak filtrelenen tarih aralığındaki güncel log satırlarının eksiksiz okunması.

### 7. Otonom Bakım ve Veri Güvenliği (Zero-Maintenance)
- [x] **Veritabanı Optimizasyonu:** `VACUUM` komutunun SQLite defragmantasyonunu hata fırlatmadan başardığının doğrulanması.
- [x] **Zaman Makinesi (Restore Point):** `createSnapshot` metodunun `.sqlite.restore-point` uzantılı bir yedek dosyası oluşturduğu ve `restoreSnapshot` metodunun bu yedeği aktif `.sqlite` dosyasına eksiksiz geri yazdığının testi.
- [x] **Sessiz Bulut Yedekleme:** `cloud_sync_folder` app ayarının, `window-all-closed` hook'u içinde okunup belirtilen dizine zaman damgalı kopyalama işleminin yapıldığının manuel doğrulanması.

### 8. Etiket (Tag) Sistemi ve CRUD Güvenliği
- [x] **Worker Tags:** `workers` tablosuna JSON formatında etiket kaydedilip doğru şekilde parse edilmesi.
- [x] **Timesheet Tags:** `timesheets` tablosuna etiket kaydedilip okunması.
- [x] **Transaction Tags:** `transactions` tablosuna etiket kaydedilip okunması.
- [x] **Cash Register Tags:** `cash_register` tablosuna etiket kaydedilip okunması.
- [x] **readRecord Soft Delete Farkındalığı:** `app_settings`, `work_types` gibi `is_deleted` sütunu olmayan tabloların hatasız okunması.
- [x] **readRecord Standart:** `workers` gibi `is_deleted` sütunu olan tabloların filtreli okunması.

### 9. Kendi Kendini Anlatan UX (Self-Explanatory)
- [x] **ConfirmationModal:** `WorkerProfile` (Puantaj/Avans), `App` (İşçi Silme) ve `CashRegister` (Kasa Silme) bileşenlerinde native `confirm` yerine evrensel Modal entegrasyonu başarılı.
- [x] **TC Kimlik Algoritması:** 11 haneli Checksum matematiği test edildi (Doğru ve yanlış TC kombinasyonları ile doğrulandı). Formda hata mesajı gösterimi doğrulandı.

### 10. Excel İçe Aktarım (Zaman Makinesi Entegrasyonu)
- [x] **Excel Parse:** `.xlsx` formatındaki personel listelerinin (Ad, TC, Telefon, Yevmiye) sütun esnekliği ile `xlsx` paketi üzerinden okunması ve hatalı TC'lerin tespit edilip kullanıcıya reddedilerek bildirilmesi test edildi.
- [x] **Otonom Snapshot:** Toplu veri kaydedilmeden önce `window.api.system.createSnapshot` API'sinin tetiklendiği doğrulandı.
- [x] **UI Geri Al (Undo) Mekanizması:** Başarılı aktarım sonrası 15 saniyelik "İşlemi Geri Al" uyarısının (Toast) çıkması ve tıklandığında `window.api.system.restoreSnapshot` çağrısı ile veritabanının geri sarılıp arayüzün yenilenmesi test edildi.

### 11. Grup Bazlı Raporlama ve Analitik
- [x] **Backend Veri Analizi (`generateGroupStatement`):** Seçili tarih aralığındaki tüm işçilerin gruplarına göre ayrılıp, o döneme ait hak ediş/avans ve geçmişten devreden net bakiye toplamlarının eksiksiz hesaplandığı test edildi (Örn: Grupsuz personeller).
- [x] **Arayüz Entegrasyonu (`GroupReportPanel`):** Tarih filtresine ve dinamik UI kartlarına sahip olan panelin anasayfaya oturtulması ve çoklu formatta dışa aktarım (Excel, JSON) desteği başarıyla çalıştırıldı.

### 12. Dinamik PDF ve Şirket Anteti
- [x] **Şirket Bilgileri (Ayarlar):** Ayarlar sekmesinde "Şirket Adı" ve "Logo" giriş alanları oluşturuldu, logo Base64'e dönüştürülüp veritabanına yazıldı.
- [x] **Kurumsal PDF Çıktısı:** Seçilen logo ve isim; İşçi Cari Hesap Ekstresi (WorkerProfile), Kasa Raporu (CashRegister) ve Grup Finansal Raporu (GroupReportPanel) PDF dökümlerinin Header kısmına otomatik antet olarak basıldı.

### 13. Otonom UX İyileştirmeleri
- [x] **Sistem Dili Tespiti:** Veritabanı boş olduğunda otomatik `navigator.language` tespiti ve işletim sistemine uygun dil ataması sağlandı.
- [x] **Akıllı Tarih Takası (Auto-Swap):** Hatalı tarih seçimi `start_date > end_date` durumunda backend'in hata vermek yerine tarihleri takas edip raporu doğru ürettiği test edildi.

## Entegrasyon Testleri
| Akış              | Durum         | Notlar                |
|-------------------|---------------|-----------------------|
| IPC Haberleşmesi  | ✅ Başarılı   | `vitest` unit testleri ve React UI testleri sayesinde DB-Renderer haberleşmesi (db:read, db:create vb.) 16/16 başarılı şekilde tamamlandı. |

## Test Ortamı
- **Framework:** `Vitest`
- **DB İzolasyonu:** Bütün birim testler `:memory:` bellek-içi (RAM) izole bir SQLite veritabanında çalışmaktadır. Gerçek dosyalar hiçbir zaman etkilenmez.
```