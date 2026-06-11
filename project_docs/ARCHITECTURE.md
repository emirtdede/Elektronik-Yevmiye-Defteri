# Mimari

## Stack

| Katman        | Teknoloji          | Versiyon | Sebep                      |
|---------------|--------------------|----------|----------------------------|
| Masaüstü Çatı | Electron.js        | 28.x+    | Web teknolojileriyle internetsiz, bağımsız ve kurulabilir bir masaüstü (.exe/.dmg) uygulaması yaratmak. |
| Frontend      | React.js           | 18.x+    | Hızlı, bileşen tabanlı kullanıcı arayüzü ve modern, akıcı bir deneyim sunmak. |
| Backend       | Node.js (IPC)      | 20.x+    | Yerel dosya sistemine erişim (Excel/CSV okuma) ve SQLite veritabanı sorguları için Electron'un yerleşik Node.js gücünü kullanmak. |
| Veritabanı    | SQLite             | 3.x+     | Sunucu kurulumu gerektirmeyen, hafif, tek dosya halinde yerel veri depolama. Projenin kalbine en uygun çözüm. |
| Veri Aktarımı | SheetJS (xlsx)     | —        | Dışarıdan yüklenen Excel ve CSV dosyalarını hatasız ayrıştırıp sisteme aktarmak. |
| PDF Üretimi   | pdfmake / jsPDF    | —        | İşçiler için oluşturulacak mutabakat ve bilgi fişlerinin hızlıca PDF'e dönüştürülmesi. |

## Klasör Mimarisi
Modüler Yapı (Electron + React): Projenin kullanıcı arayüzü (frontend) ile veritabanı/dosya okuma işlemleri (backend) aynı klasörde tutulacak ancak güvenlik ve performans için Electron IPC (Inter-Process Communication) köprüsü ile birbirinden izole çalışacaktır.

## Önemli Kısıtlamalar
- **Offline-First (İnternetsiz Çalışma):** Uygulama hiçbir dış API'ye, bulut veritabanına veya resmi e-Devlet servisine bağlanmamalıdır.
- **Yerel Veri Güvenliği:** SQLite veritabanı dosyası, kullanıcının bilgisayarında kolayca yedekleyebileceği bir dizinde (örn. Belgelerim klasörü altında) tutulmalıdır.
- **Çıktı Formatı:** Sistemden alınan PDF çıktılar, resmi belge numaralandırma kurallarına tabi olmamalı, sadece "İç Denetim / Bilgi Fişi" formatında tasarlanmalıdır.

## 4 Ana Sütun (Nihai Mimari)
### Sütun 1: Otonom Bakım ve Veri Güvenliği (Zero-Maintenance)
- **Veritabanı Optimizasyonu (Self-Healing):** `VACUUM` komutu ile SQLite defragmantasyonu yapılarak sistemin otonom hızlanması sağlanır.
- **Zaman Makinesi (Restore Point):** Toplu aktarımlar öncesi (Import) otomatik snapshot alınarak 24 saat aktif "Son İşlemi Geri Al" imkanı.
- **Sessiz Bulut Yedekleme:** Uygulama kapanırken `.sqlite` yedeği, timestamp ile birlikte belirlenen senkronize klasörüne (Google Drive, vb.) atılır.

### Sütun 2: İnsan ve AI Odaklı Log Mimarisi
- **Klasör Hiyerarşisi:** `electron-log` günlük olarak rotasyona girer (`logs/YYYY/MM/YYYY-MM-DD.log`).
- **İnsan Odaklı Çeviri:** Veritabanı sorguları ve teknik CRUD işlemleri "Ahmet Yılmaz'ın avans kaydı eklendi" gibi Türkçe cümlelere çevrilir.
- **Log Dışa Aktarım:** .xlsx, .csv, .json, .md ve .txt formatlarında dışa aktarılabilir log modülü.

### Sütun 3: Sınırları Kaldıran Etiket ve Anomali Sistemi
- **Esnek Etiketler (Tags):** İşçi, Puantaj ve Kasaya eklenecek `#Şantiye-A` gibi renkli ve dinamik filtreleme sağlayan metadata yapısı.
- **Anomali Dedektörü:** Eksi bakiyesi olan işçileri veya pasif personelleri saptayan proaktif bir "Sistem Uyarıları" engine'i.

### Sütun 4: Kendi Kendini Anlatan UI/UX Kuralları
- **İşlem Öncesi Rehberlik (Inline Help Text):** Kritik işlemlerin kalıcı, açık ve okunaklı, gri alt bilgi metni (text-sm text-gray-500).
- **İşlem Sırası Onay Modalı (Confirmation):** Silme, vakumlama gibi kalıcı operasyonlarda kırmızı uyarılar barındıran, işlemi ve sonuçlarını anlatan katı onay penceresi.