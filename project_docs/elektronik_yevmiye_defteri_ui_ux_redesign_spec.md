UI/UX Master Redesign & Arayüz Mimari
Dokümanı
Proje Adı: Elektronik Yevmiye Defteri (FinTech Upgrade)
Rol: Senior UI/UX Architect & Lead Product Designer
Doküman Sürümü: V3.0 (Kapsamlı Yapısal Yenilenme Spesifikasyonu)
Mimari Tasarı Hedefi: Bu spesifikasyon dokümanı, mevcut arayüzdeki orantısız sayfa ölçeklemelerini,
dağınık panel yığınlarını, hizalama hatalarını ve görsel kaos yaratan bileşen parçalanmalarını tamamen
ortadan kaldırmak üzere yazılmıştır. Tasarım sistemi, "Unified FinTech Workspace" (Bütünleşik Finansal
Çalışma Alanı) felsefesiyle, 8px matematiksel grid tabanına oturtularak sıfırdan inşa edilmiştir. 
1. Global Tasarım Sistemi & Görsel Dil (Design System Framework)
Uygulamanın dağınık yapısını toparlamak ve kurumsal bir FinTech hissiyatı vermek adına tüm renk, boşluk ve
tipografi oranları katı kurallara bağlanmıştır. Sayfaların rastgele büyümesi engellenerek viewport bazlı esnek
ama hiyerarşik bir grid sistemi getirilmiştir.
1.1. Renk Paleti ve Kontrast Oranları (WCAG AAA Standartları)
Açık temadaki çerçevelerin kaybolması ve panellerin birbirine girmesi sorunu, arka plan ile kart yüzeyleri
arasına keskin kontrast farkları konularak çözülmüştür.
Tema Katmanı Açık Tema (Light
Mode)
Koyu Tema (Dark
Mode) Tasarım Fonksiyonu
Ana Arkaplan
(Body)
#F1F5F9 (Slate
100)
#0F172A (Slate
900)
Gözü yormayan, soğuk ve ferah taban
alan.
Kart/Panel
Yüzeyi
#FFFFFF (Pure
White)
#1E293B (Slate
800)
Arkaplandan keskin ayrılan, gölgeli ana
bloklar.
Sınırlar
(Borders)
#CBD5E1 (Slate
300)
#334155 (Slate
700)
Hizalamayı belirginleştiren net çerçeve
hatları.
Birincil Metin
(Text)
#0F172A (Slate
900)
#F8FAFC (Slate
50)
Maksimum okunabilirlik sağlayan finansal
veri yazı rengi.
Vurgu / Finans
Mavi
#2563EB (Blue
600)
#3B82F6 (Blue
500)
Aksiyon butonları ve birincil odak
noktaları.
Elektronik Yevmiye Defteri - Senior UI/UX Redesign Dokümanı 1 / 4

1.2. Tipografi ve Rakam Hiyerarşisi
Finansal tablolarda rakamların hizasız görünmesini engellemek için sistem fontu 'Inter' olarak sabitlenmiştir.
Rakamların basamak senkronizasyonu için monospaced sayı anatomisi kuralları uygulanacaktır.
Büyük Finansal Bakiyeler: 24pt, Extrabold, Sıkıştırılmış Harf Aralığı (tracking-tight)
Ekran Başlıkları (H1): 18pt, Bold, Koyu Slate Tonu
Bileşen ve Panel Başlıkları (H2): 13pt, Semibold, Tam Hizalı
Veri ve Açıklama Metinleri: 10pt, Regular, Slate 600
2. Layout & Bütünleşik Düzen Stratejisi (The Master Blueprint)
Mevcut tasarımdaki "ayrı ayrı paneller oluşturarak kalabalıklaşma" hatası tamamen reddedilmiştir. Sayfalar,
bağımsız kutuların havada uçuştuğu bir yapıdan çıkarılarak, Sabit Sol Navigasyon (Asymmetric Sidebar
Layout) ve Bütünleşik Sağ İçerik Sahnesi olmak üzere iki ana semantik sütuna bölünmüştür.
Master Layout Hiyerarşisi
Tüm ekranlar istisnasız olarak şu 3 katmanlı hizalama hiyerarşisine uymak zorundadır:
Sol Global Kenar Çubuğu (Width: 240px / Sabit): Navigasyon, dil seçimi, tema değiştirici ve sistem
sağlık ikonu bu alanda tek bir blok halinde hapsedilir. Ana sahneden 1px dikey çizgi ile ayrılır.
Üst Aksiyon Barı (Height: 70px / Esnek): Sayfa başlığı, filtreleme araçları, Excel/PDF dışa aktarma
butonları bu barda yan yana kusursuzca hizalanır. Ayrı bir panel olarak değil, sayfanın tavanı olarak
kurgulanır.
Ana Sahne Dinamik Grid (Genişlik: %100 - Fluid): İçerikler asla bağımsız dikey kutular halinde alt
alta yığılmaz. Sayfa genişliğine göre 2'li veya 3'lü kolon yapılarına (Table-cell veya Row mantığıyla)
bölünerek dikey akslar üzerinden tam hizalanır.
3. Ekran Bazlı Yeni Arayüz Anatomisi
Her bir ekranın dağınık panellerden arındırılarak nasıl tek parça kurumsal bir yapıya kavuşturulacağı aşağıda
spesifiye edilmiştir.
3.1. Dashboard / Ana Ekran (Bütünleşik Görünüm)
Mevcut tasarımdaki devasa, orantısız grup kartları yerine Apple Widget estetiğinde kompakt, yatay ve bölmeli
bir yapı kurulmuştur.
• 
• 
• 
• 
1. 
2. 
3. 
Elektronik Yevmiye Defteri - Senior UI/UX Redesign Dokümanı 2 / 4

DEMIRCILER
41.542 ₺
3 Personel | Hak Ediş: +50.300 ₺
KALIPÇILAR
58.331 ₺
3 Personel | Hak Ediş: +68.300 ₺
SISTEM ANOMALILERI
⚠️ 1 Personel Eksi
Bakiyede
2 Personel Pasif Durumda
Değişiklik Kuralı: Dashboard üst finansal durum paneli ile alt personel listesi kartları aynı dikey hizada (X
ekseninde milimetrik eşitlikte) başlamak zorundadır. Personel kartları grid yapısında yan yana 3'lü bloklar
halinde sıralanır; dikeyde uzayan listeler sayfa taşmasını engellemek için kendi içinde scroller'a (`max-h-
[60vh] overflow-y-auto`) sahip olacaktır.
3.2. İşçi Profil Sayfası & Cari Hesap Ekstresi
Mevcut tasarımdaki (Bkz. Görsel 4 ve 6) sol taraftaki devasa yuvarlak "A" harfi içeren profil kartı küçültülmüş,
sağ taraftaki form alanları ile tek bir bütünleşik tablo düzenine sokulmuştur. Sayfa iki asimetrik sütundan
oluşur:
Sol Cüzdan Kolonu (Genişlik: %30): İşçinin adı, TC'si, telefon numarası ve büyük puntolu "Güncel Net
Bakiyesi" tek bir kompakt kartta dikey olarak kilitlenir.
Sağ Ekstre Sahnesi (Genişlik: %70): Tarih aralığı filtresi, kelime arama çubuğu ve ana cari hesap
tablosu bu alandadır. Tablonun en üst satırında her zaman gri tonlamalı, belirgin bir "Devreden Bakiye"
hücresi yer alır.
Tarih İşlem Türü Açıklama / Not Tutar (₺)
--.--.---- DEVIR Seçilen Başlangıç Tarihinden Önceki Devreden Bakiye+0,00 ₺
01.06.2026 Puantaj Tam Gün Çalışma (Şantiye A) +1.500,00 ₺
06.06.2026 Avans Haftalık nakit harçlık ödemesi -3.000,00 ₺
3.3. Kasa Yönetimi Ekranı
Mevcut tasarımdaki (Bkz. Görsel 2 ve 7) sol taraftaki form kutularının havada asılı kalması ve sağ taraftaki
"Kasa Hareketleri" yazısının boşluğa düşmesi hatası tamamen revize edilmiştir. Kasa ekranı tek bir finansal
defter (ledger) görünümüne kavuşturulmuştur:
"Yeni Nakit İşlemi" formu, ekranı daraltan ayrı bir dikey blok olmak yerine, sağ üst köşedeki "Nakit Giriş/
Çıkış Ekle" butonuna basıldığında sağdan pürüzsüzce kayarak açılan modern bir Drawer (Slayt Panel)
içine yerleştirilmiştir.
Böylece Kasa Hareketleri tablosu ekranın %100 genişliğini kaplayarak, tarih aralığı filtreleri ve arama
çubuğu ile tam hizada, kesintisiz bir muhasebe defteri gibi okunabilir hale gelmiştir.
• 
• 
• 
• 
Elektronik Yevmiye Defteri - Senior UI/UX Redesign Dokümanı 3 / 4

4. Form Elemanları, Sınırlar ve Koruma Katmanı (UI Micro-Specs)
Kullanıcının uygulamayı kullanırken hata yapmasını engelleyen ve açık temada görünürlüğü maksimize eden
mikro tasarım kuralları:
4.1. Input Alanları ve Focus Anatomisi
Açık temada input sınırlarının kaybolma problemi şu CSS mimarisi ile çözülmüştür: İnput alanları her zaman
`--bg-surface`  (beyaz)  zeminine  oturacak,  etrafında  `1px  solid  #cbd5e1`  net  çizgi  bulunacaktır.  Kullanıcı
input'a tıkladığı an (Focus state), sınır rengi parlak maviye (`#2563eb`) dönecek ve inputun etrafında `4px`
genişliğinde yumuşak mavi bir hale parlayacaktır (`box-shadow: 0 0 0 4px rgba(37,99,235,0.15)`).
4.2. Kritik İşlemler İçin "Satır İçi Rehberlik" (Inline Help Text)
Kullanıcının  uygulamayı  tanımaması  riskine  karşı,  "Tüm  Veritabanını  Yedekle",  "Sistemi  Optimize  Et
(VACUUM)" veya "Personel Sil" gibi geri dönüşü olmayan kritik butonların tam altına kalıcı, silik ama okunaklı
bilgilendirme metinleri entegre edilecektir. 
Örnek Uygulama: "Sistemi Optimize Et" butonunun hemen altında kalıcı olarak şu metin yer alacaktır:  "Bu
işlem veritabanındaki boşlukları temizler, indeksleri onarır ve uygulamanın çalışma hızını ilk günkü haline
getirir. Veri kaybına yol açmaz."
4.3. Yumuşak Geçiş Animasyonları (Micro-Interactions)
Sayfalar arası geçişlerde panellerin ekranda küt diye belirmesi yerine, Tailwind CSS tabanlı `transition-all
duration-200  ease-in-out`  ve  `animate-fade-in`  (opaklığın  0'dan  1'e  pürüzsüz  yükselmesi)  kuralları
uygulanacaktır.  Hakkında  sayfasındaki  SSS  accordion  panelleri  açılırken  dikey  genişlik  (`max-height`)
pürüzsüz bir CSS animasyonuyla esneyecektir.
5. Doğrulama ve Redesign Akış Planı
Yapay zeka ajanı bu tasarım spesifikasyonunu uygularken kod tabanındaki fonksiyonel mantığı (State'leri,
IPC  kanallarını,  SQLite  sorgularını)  asla  değiştirmeyecektir.  Sadece  ve  sadece  bileşenlerin  döndürdüğü
(render)  HTML  iskeletini  ve  Tailwind  sınıflarını  (class  names)  bu  dokümandaki  hiyerarşiye  göre  baştan
örecektir.
Geliştirme tamamlandığında, açık temada (Light Mode) her kartın sınır çizgisi görünürlüğü ve koyu temadaki
kurumsal FinTech bütünlüğü Senior Designer tarafından piksel piksel denetlenecektir.
Elektronik Yevmiye Defteri - Senior UI/UX Redesign Dokümanı 4 / 4