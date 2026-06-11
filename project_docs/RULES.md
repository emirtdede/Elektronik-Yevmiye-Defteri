# Proje Kuralları

## Kesin Yasaklar
Bu kurallar kullanıcı açıkça izin vermedikçe geçerlidir:
- Dosya silme yasak.
- SQLite dışında farklı bir veritabanına veya ağır bir ORM karmaşasına geçmek yasak.
- Uygulamaya dışarıdan veri çekecek herhangi bir web isteği (fetch/axios ile dış API'ye) eklemek kesinlikle yasak (offline-first kuralı ihlal edilemez).
- Çalışan sistemi yeniden yazma yasak.
- Onaysız refactor yasak.
- Çoklu modülü aynı anda değiştirme yasak.

## Zorunlu Kurallar
- Büyük görevleri küçük adımlara böl.
- Önce mevcut kodu oku, sonra değiştir.
- Her değişiklik minimum etki prensibi ile yapılmalı.
- Belirsiz durumda tahmin etme, kullanıcıya sor.
- Yeni bir IPC (Inter-Process Communication) kanalı açıldığında mutlaka API_SPECIFICATION.md güncellenmeli.
- MEMORY.md güncellenmeden görev bitmez.
- **Görev Takibi (TASKS.md):** Yeni bir özellik eklendiğinde veya bir düzenleme istendiğinde, anında ilk iş olarak `TASKS.md` dosyası güncellenmelidir.
- **Test ve Raporlama (TESTING_STATUS.md):** Tamamlanan her görevin (task) sonunda mutlaka testleri gerçekleştirilmeli ve bu test sonuçları `TESTING_STATUS.md` dosyasına güncel olarak işlenmelidir.

## Kod Standartları
- Mimari: Frontend ve Backend (Electron ana süreci) bağımlılıkları net bir şekilde ayrılmalı.
- İsimlendirme (Naming Convention): Değişkenler `camelCase`, veritabanı kolonları `snake_case`.
- Yorum Dili: Türkçe.
- Tarih Formatı: Tüm sistemde ve veritabanında ISO 8601 (YYYY-MM-DD) standardı kullanılmalı.