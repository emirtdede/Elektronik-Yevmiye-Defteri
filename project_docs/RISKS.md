# Risk Kaydı

## Yüksek Risk
- **Veri Kaybı (Local DB):** Veriler kullanıcının fiziksel diskinde tutulacağı için diskin bozulması veya bilgisayarın çalınması durumunda veriler kaybolur.
  *Çözüm Adımı:* Uygulama içine "Veritabanını Dışa Aktar / Yedekle" butonu çok belirgin şekilde eklenmeli ve kullanıcılar sık sık uyarılmalı.

## Orta Risk
- **Kullanıcının Veritabanı Dosyasını Kurcalaması:** `.sqlite` dosyası şifresiz olduğu için yetkisiz bir personel DB tarayıcılarla dosyayı açıp rakamları değiştirebilir.
  *Çözüm Adımı:* Kurulum dizini AppData gibi gizli/sistem klasörlerinde tutulabilir veya ileri aşamada SQLite şifrelemesi (SQLCipher) kullanılabilir.

## Düşük Risk
- **Excel Aktarım Hataları:** Kullanıcının hatalı veri tipi (sayı yerine harf) içeren Excel yüklemesi programı çökertebilir.
  *Çözüm Adımı:* Node.js (SheetJS) tarafında katı veri validasyonları (try-catch mekanizmaları) kurulmalı.