const logger = require('../logger');

function generateHumanMessage(table_name, action, old_values, new_values) {
  const tMap = {
    'workers': 'Personel',
    'worker_groups': 'Grup',
    'timesheets': 'Puantaj',
    'transactions': 'Avans/İşlem',
    'cash_register': 'Kasa İşlemi',
    'work_types': 'Çalışma Tipi',
    'app_settings': 'Sistem Ayarı',
    'projects': 'Şantiye',
    'production_records': 'İmalat/Metraj',
    'materials': 'Malzeme/İrsaliye',
    'daily_journals': 'Günlük Jurnal',
    'quality_reports': 'Kalite Tutanak',
    'subcontractor_ledgers': 'Taşeron Cari'
  };
  const tName = tMap[table_name] || table_name;
  
  if (action === 'CREATE') {
    if (table_name === 'workers') return `Yeni personel eklendi: ${new_values.full_name}`;
    if (table_name === 'transactions') return `Yeni avans/işlem eklendi. Tutar: ${new_values.amount} TL`;
    if (table_name === 'cash_register') return `Kasaya yeni işlem girildi. Tutar: ${new_values.amount} TL (${new_values.type})`;
    if (table_name === 'timesheets') return `Yeni puantaj girildi. Tarih: ${new_values.work_date}, Tutar: ${new_values.earned_amount} TL`;
    return `Sisteme yeni bir ${tName} kaydı eklendi.`;
  }
  if (action === 'UPDATE') {
    if (table_name === 'workers') return `${new_values.full_name || (old_values && old_values.full_name) || 'Personel'} bilgileri güncellendi.`;
    if (table_name === 'app_settings') return `Sistem ayarı güncellendi. Yeni Değer: ${new_values.setting_value}`;
    return `Bir ${tName} kaydı güncellendi.`;
  }
  if (action === 'DELETE') {
    if (table_name === 'workers') return `${old_values.full_name} isimli personel silindi.`;
    if (table_name === 'transactions') return `Bir avans/işlem iptal edildi. Tutar: ${old_values.amount} TL`;
    if (table_name === 'cash_register') return `Kasadan bir işlem iptal edildi. Tutar: ${old_values.amount} TL (${old_values.type})`;
    if (table_name === 'timesheets') return `${old_values.work_date} tarihli puantaj iptal edildi. Tutar: ${old_values.earned_amount} TL`;
    return `Bir ${tName} kaydı silindi.`;
  }
  return `${action} işlemi gerçekleşti (${tName}).`;
}

// Helper function to log audit
async function logAudit(db, table_name, record_id, action, old_values = null, new_values = null) {
  try {
    await db.run(
      'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values) VALUES (?, ?, ?, ?, ?)',
      [
        table_name, 
        record_id, 
        action, 
        old_values ? JSON.stringify(old_values) : null, 
        new_values ? JSON.stringify(new_values) : null
      ]
    );

    const humanMsg = generateHumanMessage(table_name, action, old_values, new_values);
    logger.info(`[DB ${action}] [${table_name}] ${humanMsg}`);

  } catch (e) {
    console.error('Audit log error:', e);
    logger.error(`[DB ERROR] Audit log failed: ${e.message}`);
  }
}

async function readRecord(db, table, conditions = {}) {
  // Tables that do NOT have is_deleted column
  const tablesWithoutSoftDelete = ['app_settings', 'work_types', 'audit_logs', 'worker_groups'];
  const hasSoftDelete = !tablesWithoutSoftDelete.includes(table);

  let query = `SELECT * FROM ${table}`;
  const params = [];

  if (hasSoftDelete) {
    query += ' WHERE is_deleted = 0';
  }

  for (const [key, value] of Object.entries(conditions)) {
    query += hasSoftDelete || params.length > 0 ? ' AND ' : ' WHERE ';
    query += `${key} = ?`;
    params.push(value);
  }

  // Add default ordering
  if (table === 'workers') query += ' ORDER BY full_name ASC';
  else query += ' ORDER BY id DESC';

  const rows = await db.all(query, params);
  return rows;
}

async function createRecord(db, table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');
  
  const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const result = await db.run(query, values);
  
  await logAudit(db, table, result.lastID, 'CREATE', null, data);
  
  return { success: true, id: result.lastID, message: 'Kayıt başarıyla eklendi.' };
}

async function updateRecord(db, table, id, data) {
  // Get old record for audit
  const oldRecord = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  
  const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  await db.run(query, [...values, id]);
  
  await logAudit(db, table, id, 'UPDATE', oldRecord, data);
  
  return { success: true, message: 'Kayıt başarıyla güncellendi.' };
}

async function deleteRecord(db, table, id) {
  // Get old record for audit
  const oldRecord = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  
  const query = `UPDATE ${table} SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`;
  await db.run(query, [id]);
  
  await logAudit(db, table, id, 'DELETE', oldRecord, { is_deleted: 1 });
  
  return { success: true, message: 'Kayıt başarıyla çöp kutusuna taşındı.' };
}

module.exports = {
  readRecord,
  createRecord,
  updateRecord,
  deleteRecord
};
