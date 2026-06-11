const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let dbPromise;

async function getDB() {
  if (dbPromise) return dbPromise;

  const isDev = process.env.NODE_ENV === 'development';
  // Use appData in production. In dev, project root.
  // path.join(__dirname, '../../..') points to the project root
  const dbPath = isDev 
    ? path.join(__dirname, '../../../database.sqlite')
    : path.join(app.getPath('userData'), 'elektronik-yevmiye.sqlite');

  dbPromise = open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const db = await dbPromise;

  // Create tables (Zero-Code Change Architecture)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      multiplier REAL NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS worker_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      tc_no TEXT,
      phone TEXT,
      daily_wage REAL NOT NULL,
      group_id INTEGER,
      start_date DATE,
      status TEXT DEFAULT 'active',
      extra_data TEXT,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES worker_groups (id)
    );

    CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER,
      work_date DATE NOT NULL,
      work_type_id INTEGER,
      applied_wage REAL NOT NULL,
      applied_multiplier REAL NOT NULL,
      overtime_hours REAL DEFAULT 0,
      earned_amount REAL NOT NULL,
      notes TEXT,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers (id),
      FOREIGN KEY (work_type_id) REFERENCES work_types (id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER,
      trans_date DATE NOT NULL,
      trans_type TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      linked_cash_id INTEGER,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers (id)
    );

    CREATE TABLE IF NOT EXISTS cash_register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trans_date DATE NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      is_deleted BOOLEAN DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT,
      record_id INTEGER,
      action TEXT,
      old_values TEXT,
      new_values TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
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
      FOREIGN KEY (project_id) REFERENCES projects(id),
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

  // Migrations for existing DB
  try {
    await db.run('ALTER TABLE workers ADD COLUMN group_id INTEGER REFERENCES worker_groups(id)');
  } catch (err) {
    // Column might already exist, ignore
  }

  try {
    await db.run('ALTER TABLE workers ADD COLUMN tc_no TEXT');
  } catch (err) {
    // Column might already exist, ignore
  }

  // Project ID & ISG Date Migrations for existing tables
  const tablesWithProjectId = ['workers', 'timesheets', 'transactions', 'cash_register'];
  for (const t of tablesWithProjectId) {
    try {
      await db.run(`ALTER TABLE ${t} ADD COLUMN project_id INTEGER REFERENCES projects(id)`);
    } catch (err) {
      // Column might already exist, ignore
    }
  }

  try {
    await db.run('ALTER TABLE workers ADD COLUMN isg_bitis_tarihi DATE');
  } catch (err) {
    // Column might already exist, ignore
  }

  // Tags Migrations
  const tablesWithTags = ['workers', 'timesheets', 'transactions', 'cash_register', 'materials', 'quality_reports', 'subcontractor_ledgers'];
  for (const t of tablesWithTags) {
    try {
      await db.run(`ALTER TABLE ${t} ADD COLUMN tags TEXT`);
    } catch (err) {
      // Column might already exist, ignore
    }
  }

  // Seeder logic for initial default values
  const settingsCount = await db.get('SELECT COUNT(*) as count FROM app_settings');
  if (settingsCount.count === 0) {
    await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['standard_daily_hours', '8', 'Standart günlük çalışma saati']);
    await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['overtime_multiplier', '1.5', 'Mesai saat ücreti çarpanı']);
    await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['theme', 'dark', 'Uygulama Teması (dark/light)']);
    await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['language', 'tr', 'Uygulama Dili (tr/en)']);
    await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['company_name', '', 'Şirket/Kurum Adı']);
    await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['company_logo', '', 'Şirket Logosu (Base64)']);
  } else {
    // Migration for existing databases to ensure new settings exist
    const keys = await db.all('SELECT setting_key FROM app_settings');
    const existingKeys = keys.map(k => k.setting_key);
    
    if (!existingKeys.includes('company_name')) {
      await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['company_name', '', 'Şirket/Kurum Adı']);
    }
    if (!existingKeys.includes('company_logo')) {
      await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['company_logo', '', 'Şirket Logosu (Base64)']);
    }
    if (!existingKeys.includes('language')) {
      await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['language', 'tr', 'Uygulama Dili (tr/en)']);
    }
  }

  const workTypesCount = await db.get('SELECT COUNT(*) as count FROM work_types');
  if (workTypesCount.count === 0) {
    await db.run("INSERT INTO work_types (name, multiplier) VALUES (?, ?)", ['Tam Gün', 1.0]);
    await db.run("INSERT INTO work_types (name, multiplier) VALUES (?, ?)", ['Yarım Gün', 0.5]);
    await db.run("INSERT INTO work_types (name, multiplier) VALUES (?, ?)", ['Pazar Mesaisi', 2.0]);
    await db.run("INSERT INTO work_types (name, multiplier) VALUES (?, ?)", ['İzinli (Ücretsiz)', 0.0]);
  }
  return db;
}

// Zaman Makinesi (Restore Point) Snapshot Fonksiyonları
function getDBPath() {
  const isDev = process.env.NODE_ENV === 'development';
  return isDev 
    ? path.join(__dirname, '../../../database.sqlite')
    : path.join(app.getPath('userData'), 'elektronik-yevmiye.sqlite');
}

function createSnapshot(suffix = 'restore-point') {
  try {
    const dbPath = getDBPath();
    const backupPath = `${dbPath}.${suffix}`;
    fs.copyFileSync(dbPath, backupPath);
    return { success: true, backupPath };
  } catch (err) {
    console.error('Snapshot creation failed:', err);
    return { success: false, message: err.message };
  }
}

function restoreSnapshot(suffix = 'restore-point') {
  try {
    const dbPath = getDBPath();
    const backupPath = `${dbPath}.${suffix}`;
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, dbPath);
      return { success: true };
    }
    return { success: false, message: 'Restore point bulunamadı.' };
  } catch (err) {
    console.error('Restore failed:', err);
    return { success: false, message: err.message };
  }
}

module.exports = { getDB, createSnapshot, restoreSnapshot };
