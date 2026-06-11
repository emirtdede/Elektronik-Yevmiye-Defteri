# API / IPC Spesifikasyonu

Proje yerel çalıştığı için HTTP istekleri yerine Electron IPC (invoke/handle) yapısı kullanılmaktadır.

## İşçi Yönetimi (Workers)

### Kanal: `workers:getAll`
Açıklama: Sistemdeki tüm işçileri listeler.
Parametreler: Yok
Dönen Değer: `Array<{ id, full_name, phone, daily_wage, status }>`

### Kanal: `workers:getById`
Açıklama: Tek bir işçinin detaylarını getirir.
Parametreler: `{ id: number }`
Dönen Değer: `{ id, full_name, phone, daily_wage, start_date, status }`

### Kanal: `workers:create`
Açıklama: Yeni bir işçi kaydeder.
Parametreler: `{ full_name, phone, daily_wage, start_date }`
Dönen Değer: `{ success: boolean, id: number, message: string }`

## Puantaj ve Yevmiye (Timesheets)

### Kanal: `timesheets:add`
Açıklama: İşçiye günlük puantaj girer ve hak edişi otomatik hesaplar.
Parametreler: `{ worker_id, work_date, work_type, notes }`
Dönen Değer: `{ success: boolean, earned_amount: number }`

### Kanal: `timesheets:getByWorker`
Açıklama: İşçinin belirli bir tarih aralığındaki puantaj dökümünü getirir.
Parametreler: `{ worker_id, start_date, end_date }`
Dönen Değer: `Array<{ id, work_date, work_type, earned_amount }>`

## Dışa / İçe Aktarım (Import / Export)

### Kanal: `import:parseExcel`
Açıklama: Seçilen Excel/CSV dosyasını okuyup ham veri olarak frontend'e gönderir. Eşleştirme işlemi arayüzde yapılır.
Parametreler: `{ filePath: string }`
Dönen Değer: `Array<Object> (Satır ve Sütun Verileri)`

### Kanal: `export:generatePDF`
Açıklama: Verilen işçi hesap ekstresini PDF'e dönüştürüp bilgisayara kaydeder.
Parametreler: `{ worker_id, htmlContent, month }`
Dönen Değer: `{ success: boolean, filePath: string }`