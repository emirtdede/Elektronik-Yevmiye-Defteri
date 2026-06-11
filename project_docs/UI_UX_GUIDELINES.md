# UI/UX Kılavuzu

## Tema
- Açık / Koyu Mod: Destekleniyor.
- Varsayılan: Açık Mod (Şantiye/Ofis ortamında okunabilirliği artırmak için).

## Stil
- Genel Konsept: Kurumsal, temiz, veriye odaklı (Data-heavy). Kullanıcıyı gereksiz grafiklerle yormayan, tabloların geniş ve okunaklı olduğu bir yapı.
- CSS Framework: Tailwind CSS (Hızlı ve tutarlı bileşenler için).

## Renk Paleti
| İsim          | Değer     | Kullanım          |
|---------------|-----------|-------------------|
| primary       | #2563EB   | Ana Butonlar, Aktif Sekmeler, Vurgular |
| secondary     | #F1F5F9   | Sidebar, Üst Menü, Tablo Başlıkları |
| background    | #FFFFFF   | Uygulama ana arka planı |
| text-main     | #1E293B   | Genel metinler, Tablo verileri |
| text-muted    | #64748B   | Alt yazılar, Yardımcı metinler |
| success       | #10B981   | "Tam Gün" puantaj, Alacak bakiyesi, Kasa Girişi |
| error         | #EF4444   | "Devamsızlık", Kasa Çıkışı, Borç / Avans |

## Tipografi
- Font: Inter veya Roboto (Tablolardaki rakamların okunaklı olması kritik).
- Tablo Verisi: 14px, Satır yüksekliği geniş.
- Başlıklar: Semibold (Yarı Kalın), 18px-24px.

## Bileşen Kuralları
- **Tablolar:** Excel benzeri bir deneyim sunmalı. Satırlar arası hover (üzerine gelince renk değişimi) efekti mutlaka olmalı.
- **Formlar:** Puantaj ve avans girişleri pop-up (Modal) yerine ekranın sağından açılan bir çekmece (Drawer) veya doğrudan tablo üzeri (Inline) düzenleme şeklinde olmalı. Hız esastır.
- **Açılır Menüler (Select/Dropdown):** İşletim sisteminin ve tarayıcıların varsayılan stilleri açık/koyu mod geçişlerinde "beyaz üzerine beyaz metin" (veya okunmaz renkler) hatasına yol açabildiğinden, `<select>` ve özellikle `<option>` etiketlerinin arka plan (`background-color`) ve metin (`color`) renkleri her zaman açıkça CSS dosyasında (örn. `index.css`) tanımlanmalı ve sabitlenmelidir.

## Erişilebilirlik
- Tablolarda yön tuşlarıyla (Aşağı/Yukarı) gezinme desteği olmalıdır (Hızlı puantaj girişi için).

## Kendi Kendini Anlatan UX (Self-Explanatory) Kuralları
- **İşlem Öncesi Rehberlik (Inline Help Text):** Kritik işlemlerin (Toplu Silme, Veritabanı Vakumlama, Log Temizleme vb.) butonlarının hemen altında/yanında, o işlemin ne işe yaradığını anlatan okunaklı, gri bilgilendirme metinleri (örn. `text-sm text-gray-500`) doğrudan görünür olmalıdır. Sadece hover ile çalışan Tooltip'lere güvenilmemelidir.
- **İşlem Sırası Onay Modalı (Confirmation):** Kullanıcı kritik butona tıkladığında doğrudan işlem yapılmaz. Kırmızı renk tonlarıyla desteklenmiş, eylemin sonuçlarını net bir şekilde açıklayan (Örn: "Bu işlem 1500 TL'lik avansı kasadan da silecektir") bir Onay Penceresi (Modal) çıkmalıdır.