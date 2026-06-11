const { ipcMain, dialog, app } = require('electron');
const { getDB } = require('./database/db');
const fs = require('fs');
const path = require('path');

// Initialize Handlers
async function setupHandlers() {
  const db = await getDB();

  // Helper function to log audit
  async function logAudit(table_name, record_id, action, old_values = null, new_values = null) {
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
    } catch (e) {
      console.error('Audit log error:', e);
    }
  }

  // --- GENERIC REST-LIKE API ---
  const { readRecord, createRecord, updateRecord, deleteRecord } = require('./services/crudService');

  // 1. READ (SELECT with is_deleted = 0)
  ipcMain.handle('db:read', async (_, { table, conditions = {} }) => {
    try {
      return await readRecord(db, table, conditions);
    } catch (error) {
      console.error(`Error reading from ${table}:`, error);
      return [];
    }
  });

  // 2. CREATE (INSERT)
  ipcMain.handle('db:create', async (_, { table, data }) => {
    try {
      return await createRecord(db, table, data);
    } catch (error) {
      console.error(`Error creating record in ${table}:`, error);
      return { success: false, message: error.message };
    }
  });

  // 3. UPDATE (UPDATE)
  ipcMain.handle('db:update', async (_, { table, id, data }) => {
    try {
      return await updateRecord(db, table, id, data);
    } catch (error) {
      console.error(`Error updating record in ${table}:`, error);
      return { success: false, message: error.message };
    }
  });

  // 4. DELETE (SOFT DELETE)
  ipcMain.handle('db:delete', async (_, { table, id }) => {
    try {
      return await deleteRecord(db, table, id);
    } catch (error) {
      console.error(`Error deleting record in ${table}:`, error);
      return { success: false, message: error.message };
    }
  });

  // --- FINANCE API ---
  const { deleteTransactionAndCash, createTransactionAndCash } = require('./services/financialService');

  ipcMain.handle('finance:delete-transaction', async (_, { id }) => {
    return await deleteTransactionAndCash(id, db);
  });

  ipcMain.handle('finance:create-advance', async (_, { data }) => {
    return await createTransactionAndCash(db, data);
  });

  // --- FINANCE API ---
  const { calculateWage } = require('./services/wageService');
  const { calculateWorkerBalance } = require('./services/balanceService');

  ipcMain.handle('finance:get-balance', async (_, { worker_id }) => {
    try {
      const balance = await calculateWorkerBalance(worker_id, db);
      return { success: true, balance };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('finance:calculate-wage', async (_, { daily_wage, multiplier, overtime_hours = 0 }) => {
    try {
      // Get settings from DB
      const settings = await db.all('SELECT setting_key, setting_value FROM app_settings');
      const settingsMap = {};
      settings.forEach(s => { settingsMap[s.setting_key] = s.setting_value });

      const standard_hours = Number(settingsMap['standard_daily_hours']) || 8;
      const overtime_multiplier = Number(settingsMap['overtime_multiplier']) || 1.5;

      const wage = calculateWage({
        daily_wage,
        multiplier,
        overtime_hours,
        overtime_multiplier,
        standard_hours
      });

      return { success: true, wage };
    } catch (error) {
      console.error('Error calculating wage:', error);
      return { success: false, message: error.message };
    }
  });

  // --- REPORTING API ---
  const { generateWorkerMonthlyReport, generateWorkerStatement, generateCompanyFinancialSummary, generateGroupStatement } = require('./services/reportService');

  ipcMain.handle('finance:worker-report', async (_, { worker_id, year, month }) => {
    return await generateWorkerMonthlyReport(db, worker_id, year, month);
  });

  ipcMain.handle('finance:worker-statement', async (_, { worker_id, start_date, end_date }) => {
    return await generateWorkerStatement(db, worker_id, start_date, end_date);
  });

  ipcMain.handle('finance:company-report', async (_, { year, month }) => {
    return await generateCompanyFinancialSummary(db, year, month);
  });

  ipcMain.handle('finance:group-statement', async (_, { start_date, end_date }) => {
    return await generateGroupStatement(db, start_date, end_date);
  });

  // --- SYSTEM API ---
  ipcMain.handle('system:backup-db', async (event) => {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      const dbPath = isDev 
        ? path.join(__dirname, '../../database.sqlite')
        : path.join(app.getPath('userData'), 'elektronik-yevmiye.sqlite');

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Veritabanını Yedekle',
        defaultPath: 'elektronik-yevmiye-backup.sqlite',
        filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
      });

      if (canceled || !filePath) {
        return { success: false, message: 'İşlem iptal edildi' };
      }

      fs.copyFileSync(dbPath, filePath);
      return { success: true, message: 'Yedekleme başarıyla tamamlandı!' };
    } catch (error) {
      console.error('Backup error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('system:read-logs', async (event, { startDate, endDate }) => {
    try {
      const logs = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      const userDataPath = app.getPath('userData');

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear().toString();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');

        const logPath = path.join(userDataPath, 'logs', year, month, `${year}-${month}-${day}.log`);
        
        if (fs.existsSync(logPath)) {
          const content = fs.readFileSync(logPath, 'utf8');
          const lines = content.split('\n').filter(l => l.trim() !== '');
          logs.push(...lines);
        }
      }
      return { success: true, logs };
    } catch (error) {
      console.error('Read logs error:', error);
      return { success: false, message: error.message, logs: [] };
    }
  });

  ipcMain.handle('system:vacuum-db', async () => {
    try {
      await db.run('VACUUM');
      return { success: true };
    } catch (error) {
      console.error('Vacuum error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('system:set-cloud-folder', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Sessiz Bulut Yedekleme Klasörünü Seç',
        properties: ['openDirectory']
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, message: 'İşlem iptal edildi' };
      }

      const folderPath = filePaths[0];

      // Upsert into app_settings
      const existing = await db.get("SELECT id FROM app_settings WHERE setting_key = 'cloud_sync_folder'");
      if (existing) {
        await db.run("UPDATE app_settings SET setting_value = ? WHERE id = ?", [folderPath, existing.id]);
      } else {
        await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", 
          ['cloud_sync_folder', folderPath, 'Sessiz Bulut Yedekleme Klasörü']);
      }

      return { success: true, folderPath };
    } catch (error) {
      console.error('Set cloud folder error:', error);
      return { success: false, message: error.message };
    }
  });
}

setupHandlers();
