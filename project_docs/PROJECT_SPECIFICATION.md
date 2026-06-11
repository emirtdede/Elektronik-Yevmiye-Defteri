# Elektronik Yevmiye Defteri — Spesifikasyon

## Proje Amacı
Fiziksel yevmiye defterlerinin yerini alarak işçi puantaj, hak ediş ve avans takibini dijitalleştiren; resmi muhasebe sistemlerinden tamamen bağımsız, tamamen yerel (offline) çalışan, hatasız matematiksel hesaplama sağlayan, **Yıllarca yazılımcı müdahalesi gerektirmeyen (Zero-Maintenance), yapay zeka analizine hazır (AI-Ready) ve kendi kendini anlatan (Self-Explanatory) otonom bir Kurumsal Yazılımdır.**

## Hedef Kullanıcılar
- Şantiye Şefleri / Ekip Liderleri (Puantaj ve avans girenler)
- Ön Muhasebe Personeli / İnsan Kaynakları (Kasa çıkışlarını ve genel tabloyu kontrol edenler)
- Şirket Yöneticileri (Genel işçilik maliyetlerini analiz edenler)

## Temel Özellikler
- **İşçi Sicil ve Profil Yönetimi:** Her işçi için özel profil sayfası, günlük/aylık ücret tanımlamaları ve anlık bakiye gösterimi.
- **TC Kimlik ve Doğrulama:** İşçi kayıtlarında 11 haneli algoritma tabanlı TC Kimlik numarası doğrulaması zorunluluğu.
- **Gruplama Mimarisi (Esnek Ekipler):** "Elektrikçiler", "Demirciler" gibi alt yüklenici veya taşeron gruplarının dinamik olarak yönetimi ve personellerin gruplara atanması.
- **Dinamik Çalışma Tipleri ve Mesai:** "Tam Gün", "Yarım Gün", "Mesai" gibi puantaj türleri koda sabitlenmez (hardcode edilmez). Şirket, uygulama ayarlarından kendi çalışma tiplerini ve çarpanlarını (örn. Pazar Mesaisi: 2.0) sınırsızca belirleyebilir.
- **Puantaj ve Yevmiye Sistemi:** Günlük çalışma girişleri ve otomatik hak ediş hesaplaması.
- **Personel Cari (Avans/Kesinti) Takibi:** İşçilere elden verilen avansların, maaş ödemelerinin veya kesintilerin (yemek/yol vb.) borç olarak işlenmesi.
- **Kasa Takibi ve Otonomi:** İşçilere yapılan ödemelerin kasadan çıkışının yapılması. Avans kayıtları Kasa ve Cari tarafında otomatik eşleşir; biri silindiğinde veya güncellendiğinde diğeri de (kullanıcı onayıyla) senkronize olarak otonom temizlenir.
- **Gelişmiş Arama, Filtreleme ve Dinamik Takvim:** İsim, TC, telefon ve grup bazlı aramalar; Kasa ve Personel geçmişinde sadece aylık değil, "Başlangıç ve Bitiş Tarihi" (Date Range Picker) ve "İşlem Yönü" gibi çok boyutlu dinamik filtrelemeler.
- **Çoklu Dışa Aktarım (Multi-Format Export) ve Raporlama:** Filtrelenmiş veya tüm listelerin anında Excel (.xlsx), CSV, JSON (Yapay zeka uyumlu) ve görsel mutabakat için PDF formatında indirilebilmesi.
- **Grup Bazlı Raporlama:** Dashboard üzerinden grupların aylık hak ediş ve avans bakiye analizlerini detaylı şekilde görebilme.
- **Uluslararasılaştırma (i18n) ve Tema:** Çoklu dil desteği (İngilizce, Çince, İspanyolca, Fransızca, Arapça, Hintçe, Rusça, Portekizce, Almanca, Türkçe) ve Açık/Koyu tema yönetimi.
- **Veri Kurtarma ve Çöp Kutusu (Soft Delete):** Yanlışlıkla silinen kayıtlar kalıcı olarak yok edilmez. Her tablodaki kayıtlar bir "Çöp Kutusu" (Arşiv) yapısında tutulur ve arayüz üzerinden tek tıkla geri yüklenebilir.
- **Tam Yedekleme (Full Backup):** Ayarlar sayfasından uygulamanın tüm veritabanı dosyasının (.sqlite) tek tıkla doğrudan indirilerek tam güvence sağlanması.
- **İki Katmanlı Gelişmiş Loglama (Advanced Logging):** Sistem ve veritabanı logları sadece teknik JSON olarak değil, insan dilinde okunabilir (Human-Readable) Türkçe cümleler halinde kaydedilir. `electron-log` ile oluşturulan işletim sistemi tabanlı loglar günlük rotasyonla (YYYY/MM/YYYY-MM-DD.log) arşivlenerek şişme engellenir. Bu loglar arayüzdeki "Sistem Kayıtları" sayfasından filtrelenip .txt, .md (AI uyumlu), JSON, CSV ve Excel dâhil çoklu formatta dışa aktarılabilir.
- **Otonom Bakım ve Veri Güvenliği (Zero-Maintenance):** Sistem, "Sistemi Optimize Et" butonu ile arka planda SQLite VACUUM çalıştırarak veritabanını otonom temizler/hızlandırır. Toplu Excel aktarımı öncesinde otomatik geri yükleme noktası (Restore Point) alınarak 24 saat aktif "Son İşlemi Geri Al" imkanı sağlanır. Sistem kapatılırken kullanıcının belirlediği bir klasöre (örn: Google Drive yerel klasörü) otomatik, sessiz (.sqlite) bulut yedeği alır.
- **Sınırları Kaldıran Etiket (Tags) ve Anomali Sistemi:** Tüm kayıtlara (işçiler, işlemler, puantaj) sınırısız renkli etiket eklenebilir (#Şantiye-A). Bakiyesi eksiye düşen veya atıl duran personelleri tespit eden "Anomali Dedektörü (Sistem Uyarıları)" paneli Dashboard'da bulunur.
- **Kendi Kendini Anlatan UX (Self-Explanatory):** Tüm kritik işlemlerde, kullanıcının eğitim almadan anlayabileceği "Satır İçi Rehberlik" (Inline Help Text) ve eylemin tam sonucunu anlatan kırmızı tonlu Onay Modalları bulunur.
## İş Kuralları
- **Yerel ve İzole Çalışma (Offline-First):** Sistem hiçbir resmi kuruma (GİB vb.) veya dış API'ye bağlanmayacaktır. Tüm veriler kullanıcının makinesinde kalır.
- **Sıfır Kod Değişikliği (Zero-Code Change):** Uygulama derlendikten sonra şirket kurallarının (katsayılar, mesai hesaplamaları) değişmesi durumunda yazılımcıya ihtiyaç duyulmaz. Sistem yöneticisi, ayarlar ekranından parametreleri güncelleyerek sistemi tamamen yönetebilir.
- **Tarihsel Bütünlük (Değer Mühürleme):** Puantaj girildiğinde, o anki yevmiye ve çarpan oranı kopyalanarak veritabanına mühürlenir (Snapshot). Kullanıcı aylar sonra çarpan oranını değiştirse dahi, eski geçmiş hesaplamalar ve hak edişler ASLA bozulmaz.
- **Sıfır Bakım Gerektiren Bakiye Hesaplaması:** Hiçbir tabloda işçinin toplam bakiyesi sabit bir değer (hardcode bakiye) olarak tutulmaz. Bakiyeler daima ve anlık olarak girilmiş puantaj ve işlemlerin `SUM()` komutuyla dinamik hesaplanmasıyla elde edilir. Bu, geçmiş bir kaydın düzeltilmesi durumunda sistemin her zaman %100 tutarlı olmasını garantiler.
- **Veri Kaynağı Güvenilirliği:** PDF parse etme işleminin risklerinden kaçınılacak, yapılandırılmış veriler (Excel/CSV) kullanılacaktır.

## Yetki Sistemi
- **Standart Kullanıcı:** İşçi ekleyebilir, puantaj girebilir, avans/ödeme kaydedebilir ve PDF çıktısı alabilir.
- **Yönetici (Admin):** Tüm işlemleri yapabilir, geçmişe dönük hata düzeltmeleri yapabilir, dinamik ayarları (çalışma tipleri vb.) değiştirebilir, Excel/CSV ile toplu veri içe aktarabilir ve genel kasa/şirket analiz raporlarını görebilir.

## Monetizasyon
- Şirket içi kapalı kullanım (Açık kaynak veya ticari satış amacı şu an için yoktur).

## Teknik Gereksinimler
- **Çalışma Ortamı:** Yerel bilgisayar veya yerel ağ (İnternet bağlantısı zorunlu değildir).
- **Veritabanı Yapısı:** Kurulum ve sunucu maliyeti gerektirmeyen, dosya tabanlı, yerel SQLite veritabanı.
- **Entegrasyonlar:** Hiçbir dış API veya servis entegrasyonu yoktur.