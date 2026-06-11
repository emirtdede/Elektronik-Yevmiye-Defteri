# Güvenlik Kuralları

## Hassas Alanlar
Bu alanlara dokunurken ekstra dikkatli ol:
- `src/main/database/` — Veritabanı sorguları (Veri bütünlüğünün kalbi)
- `src/preload/index.js` — ContextBridge (Node.js yetkilerinin Frontend'e açıldığı kapı)

## Zorunlu Kurallar

### Electron IPC Güvenliği
- `nodeIntegration: false` olmak zorundadır. Frontend (React) hiçbir şekilde doğrudan Node.js modüllerine (`fs`, `path` vb.) erişemez.
- `contextIsolation: true` olmak zorundadır.
- Frontend'den gelen IPC çağrıları (invoke) körü körüne kabul edilmemeli, main process'te (backend) veri doğrulamasından geçmelidir.

### Veritabanı Güvenliği (SQL Injection)
- Uygulama sadece lokalde çalışıyor ve tek bir kişi kullanıyor olsa bile, tüm SQLite sorguları **Parameterized Query (Parametrik Sorgu)** ile yapılmalıdır. 
- Örnek YANLIŞ: `db.run("SELECT * FROM workers WHERE name = '" + userInput + "'")`
- Örnek DOĞRU: `db.run("SELECT * FROM workers WHERE name = ?", [userInput])`

### Denetim İzi (Audit Logging) ve Gözetlenebilirlik
- Veritabanında (ekleme, silme, güncelleme) yapılan tüm işlemler mutlaka `electron-log` kullanılarak "Human-Readable" Türkçe cümleler formatında (Örn: "Ahmet kişisi eklendi") kayıt altına alınmalıdır.
- Loglar `userData/logs/YYYY/MM/YYYY-MM-DD.log` şeklinde rotasyona tabi tutularak şişme engellenmelidir.

## Güvenlik Kontrol Listesi (Canlıya Geçmeden / Build Almadan)
- [ ] `nodeIntegration` kapalı mı?
- [ ] Tüm DB sorguları parametrik mi?