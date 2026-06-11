# Veritabanı Şeması

## Tablolar

### app_settings (Sistem Ayarları - Zero Code Change)
| Kolon        | Tip           | Özellik                |
|--------------|---------------|------------------------|
| id           | INTEGER       | PK, AUTOINCREMENT      |
| setting_key  | TEXT          | UNIQUE, NOT NULL       |
| setting_value| TEXT          | NOT NULL (JSON/String) |
| description  | TEXT          |                        |
| updated_at   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

### work_types (Dinamik Çalışma Tipleri)
| Kolon        | Tip           | Özellik                |
|--------------|---------------|------------------------|
| id           | INTEGER       | PK, AUTOINCREMENT      |
| name         | TEXT          | NOT NULL (örn: Pazar Mesaisi) |
| multiplier   | REAL          | NOT NULL (örn: 2.0)    |
| is_active    | BOOLEAN       | DEFAULT 1              |
| is_deleted   | BOOLEAN       | DEFAULT 0 (Çöp Kutusu) |
| deleted_at   | TIMESTAMP     |                        |
| created_at   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

### worker_groups (Dinamik İşçi Grupları)
| Kolon        | Tip           | Özellik                |
|--------------|---------------|------------------------|
| id           | INTEGER       | PK, AUTOINCREMENT      |
| name         | TEXT          | NOT NULL (örn: Elektrikçiler) |
| is_active    | BOOLEAN       | DEFAULT 1              |
| is_deleted   | BOOLEAN       | DEFAULT 0 (Çöp Kutusu) |
| deleted_at   | TIMESTAMP     |                        |
| created_at   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

### workers (İşçi Sicil ve Profilleri)
| Kolon        | Tip           | Özellik          |
|--------------|---------------|------------------|
| id           | INTEGER       | PK, AUTOINCREMENT|
| full_name    | TEXT          | NOT NULL         |
| tc_no        | TEXT          | 11 Haneli (Validasyonlu) |
| phone        | TEXT          |                  |
| daily_wage   | REAL          | NOT NULL         |
| group_id     | INTEGER       | FK → worker_groups.id |
| start_date   | DATE          |                  |
| status       | TEXT          | DEFAULT 'active' |
| extra_data   | TEXT          | JSON (Esnek Metadatalar) |
| is_deleted   | BOOLEAN       | DEFAULT 0 (Çöp Kutusu) |
| deleted_at   | TIMESTAMP     |                  |
| created_at   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

### timesheets (Puantaj / Günlük Yevmiye Kayıtları - Mühürleme)
| Kolon              | Tip           | Özellik                |
|--------------------|---------------|------------------------|
| id                 | INTEGER       | PK, AUTOINCREMENT      |
| worker_id          | INTEGER       | FK → workers.id        |
| work_date          | DATE          | NOT NULL               |
| work_type_id       | INTEGER       | FK → work_types.id     |
| applied_wage       | REAL          | NOT NULL (Snapshot)    |
| applied_multiplier | REAL          | NOT NULL (Snapshot)    |
| overtime_hours     | REAL          | DEFAULT 0              |
| earned_amount      | REAL          | NOT NULL (Hesaplanan)  |
| notes              | TEXT          |                        |
| is_deleted         | BOOLEAN       | DEFAULT 0 (Çöp Kutusu) |
| deleted_at         | TIMESTAMP     |                        |
| created_at         | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

### transactions (Personel Cari: Avans, Kesinti ve Ödemeler)
| Kolon          | Tip           | Özellik                |
|----------------|---------------|------------------------|
| id             | INTEGER       | PK, AUTOINCREMENT      |
| worker_id      | INTEGER       | FK → workers.id        |
| trans_date     | DATE          | NOT NULL               |
| trans_type     | TEXT          | 'avans', 'kesinti', 'odeme' |
| amount         | REAL          | NOT NULL               |
| notes          | TEXT          |                        |
| linked_cash_id | INTEGER       | FK → cash_register.id (Otonomi) |
| is_deleted     | BOOLEAN       | DEFAULT 0 (Çöp Kutusu) |
| deleted_at     | TIMESTAMP     |                        |
| created_at     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

### cash_register (Kasa Hareketleri)
| Kolon        | Tip           | Özellik                |
|--------------|---------------|------------------------|
| id           | INTEGER       | PK, AUTOINCREMENT      |
| trans_date   | DATE          | NOT NULL               |
| type         | TEXT          | 'giris', 'cikis'       |
| amount       | REAL          | NOT NULL               |
| description  | TEXT          |                        |
| is_deleted   | BOOLEAN       | DEFAULT 0 (Çöp Kutusu) |
| deleted_at   | TIMESTAMP     |                        |
| created_at   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

### audit_logs (İşlem Günlükleri - Güvenlik Katmanı)
| Kolon        | Tip           | Özellik                |
|--------------|---------------|------------------------|
| id           | INTEGER       | PK, AUTOINCREMENT      |
| table_name   | TEXT          | Hangi tabloda işlem yapıldı |
| record_id    | INTEGER       | İşlem gören kaydın ID'si |
| action       | TEXT          | 'CREATE', 'UPDATE', 'DELETE' |
| old_values   | TEXT          | JSON (Eski değerler)   |
| new_values   | TEXT          | JSON (Yeni değerler)   |
| created_at   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

## İlişkiler
- workers → timesheets (1:N)
- workers → transactions (1:N)
- work_types → timesheets (1:N)
- worker_groups → workers (1:N)
- cash_register ↔ transactions (1:1 Opsiyonel Kasa Otonomisi)

## İndeksler
- workers.group_id (Gruba göre filtreleme ve raporlama için)
- workers.tc_no (TC ile arama için)
- timesheets.worker_id (İşçinin puantajını hızlı getirmek için)
- timesheets.work_date (Tarihe göre yevmiye raporları için)
- transactions.worker_id (İşçinin avans/ödeme geçmişi için)
- transactions.trans_date (Aylık ödeme analizleri için)
- transactions.linked_cash_id (Otonom işlem silme için)
- audit_logs.table_name, audit_logs.record_id (Geçmiş aramaları için)