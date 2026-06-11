const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function setupTestDB() {
  const db = await open({
    filename: ':memory:',
    driver: sqlite3.Database
  });

  // Zero-Code Change Schema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS work_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      multiplier REAL NOT NULL,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      daily_wage REAL NOT NULL,
      project_id INTEGER,
      isg_bitis_tarihi DATE,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER,
      work_date DATE NOT NULL,
      applied_wage REAL NOT NULL,
      applied_multiplier REAL NOT NULL,
      overtime_hours REAL DEFAULT 0,
      earned_amount REAL NOT NULL,
      project_id INTEGER,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER,
      trans_date DATE NOT NULL,
      trans_type TEXT NOT NULL DEFAULT 'Bakiye Devri',
      amount REAL NOT NULL,
      notes TEXT,
      linked_cash_id INTEGER,
      project_id INTEGER,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cash_register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trans_date DATE NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      project_id INTEGER,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT,
      record_id INTEGER,
      action TEXT,
      old_values TEXT,
      new_values TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'active',
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS production_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      notes TEXT,
      record_date DATE NOT NULL,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      supplier TEXT NOT NULL,
      material_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      receipt_number TEXT,
      receipt_date DATE NOT NULL,
      photo_path TEXT,
      notes TEXT,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      journal_date DATE NOT NULL,
      weather_temp REAL,
      weather_desc TEXT,
      weather_icon TEXT,
      notes TEXT,
      worker_count INTEGER,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, journal_date)
    );

    CREATE TABLE IF NOT EXISTS quality_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open',
      photo_path TEXT,
      report_date DATE NOT NULL,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subcontractor_ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      phone TEXT,
      daily_wage REAL NOT NULL,
      status TEXT DEFAULT 'active',
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

module.exports = { setupTestDB };
