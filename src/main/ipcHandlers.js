const { ipcMain, dialog, app, BrowserWindow } = require('electron');
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

  // --- RECYCLE BIN / UNDO API ---
  ipcMain.handle('db:read-deleted', async () => {
    try {
      const rows = await db.all(`
        SELECT r.*, p.name as project_name
        FROM recycle_bin r
        LEFT JOIN projects p ON r.project_id = p.id
        ORDER BY r.deleted_at DESC
      `);
      return rows.map(r => ({
        id: r.id, // recycle_bin id
        table: r.table_name,
        original_id: r.record_id,
        title: r.title,
        deleted_at: r.deleted_at,
        is_deleted: r.is_restored ? 0 : 1, // map to is_deleted for frontend compatibility
        project_id: r.project_id,
        project_name: r.project_name
      }));
    } catch (error) {
      console.error('Error in db:read-deleted:', error);
      return [];
    }
  });

  ipcMain.handle('db:read-all-projects', async () => {
    try {
      return await db.all("SELECT * FROM projects ORDER BY name ASC");
    } catch (error) {
      console.error('Error in db:read-all-projects:', error);
      return [];
    }
  });

  ipcMain.handle('db:restore', async (_, { table, id }) => {
    try {
      // id is the recycle_bin.id
      const binItem = await db.get("SELECT * FROM recycle_bin WHERE id = ?", [id]);
      if (!binItem) {
        return { success: false, message: 'Çöp kutusu kaydı bulunamadı.' };
      }

      // 1. Mark as restored in recycle_bin table
      await db.run("UPDATE recycle_bin SET is_restored = 1, restored_at = datetime('now', 'localtime') WHERE id = ?", [id]);

      // 2. Set is_deleted = 0 in the original table
      await db.run(`UPDATE ${binItem.table_name} SET is_deleted = 0 WHERE id = ?`, [binItem.record_id]);
      
      // Cascade restore if transaction has linked cash
      if (binItem.table_name === 'transactions') {
        const trans = await db.get('SELECT * FROM transactions WHERE id = ?', [binItem.record_id]);
        if (trans && trans.linked_cash_id) {
          await db.run('UPDATE cash_register SET is_deleted = 0 WHERE id = ?', [trans.linked_cash_id]);
        }
      }

      // If the restored item is a project, cascade restore all related records
      if (binItem.table_name === 'projects') {
        const childTables = ['workers', 'timesheets', 'transactions', 'cash_register', 'production_records', 'materials', 'daily_journals', 'quality_reports', 'subcontractor_ledgers'];
        for (const t of childTables) {
          await db.run(`UPDATE ${t} SET is_deleted = 0 WHERE project_id = ? AND is_deleted = 1`, [binItem.record_id]);
        }
      }
      
      return { success: true, message: 'Kayıt başarıyla geri yüklendi.' };
    } catch (error) {
      console.error(`Error restoring record via recycle bin item ${id}:`, error);
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

  ipcMain.handle('finance:group-statement', async (_, { start_date, end_date, project_id }) => {
    return await generateGroupStatement(db, start_date, end_date, project_id);
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
      const userDataPath = app.getPath('userData');
      const logsDir = path.join(userDataPath, 'logs');

      if (!startDate || !endDate) {
        // Read all logs recursively
        const getAllLogFiles = (dir) => {
          let results = [];
          if (!fs.existsSync(dir)) return results;
          const list = fs.readdirSync(dir);
          list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
              results = results.concat(getAllLogFiles(filePath));
            } else if (file.endsWith('.log')) {
              results.push(filePath);
            }
          });
          return results;
        };

        const logFiles = getAllLogFiles(logsDir);
        // Sort files chronologically (by filename)
        logFiles.sort();

        for (const logPath of logFiles) {
          if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf8');
            const lines = content.split('\n').filter(l => l.trim() !== '');
            logs.push(...lines);
          }
        }
      } else {
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const year = d.getFullYear().toString();
          const month = (d.getMonth() + 1).toString().padStart(2, '0');
          const day = d.getDate().toString().padStart(2, '0');

          const logPath = path.join(logsDir, year, month, `${year}-${month}-${day}.log`);
          
          if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf8');
            const lines = content.split('\n').filter(l => l.trim() !== '');
            logs.push(...lines);
          }
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

  // --- NEW WEATHER AND MEDIA IPC HANDLERS ---
  ipcMain.handle('system:get-weather', async (_, { location, lang }) => {
    try {
      if (!location) {
        return { success: false, message: 'Lokasyon belirtilmedi.' };
      }
      
      const apiKeySetting = await db.get("SELECT setting_value FROM app_settings WHERE setting_key = 'weather_api_key'");
      const apiKey = apiKeySetting ? apiKeySetting.setting_value : '895284fb665f874747e05a1216616b51'; 
      
      const openWeatherLangMap = {
        ar: 'ar',
        cs: 'cz',
        da: 'da',
        de: 'de',
        es: 'es',
        fr: 'fr',
        hi: 'hi',
        it: 'it',
        ja: 'ja',
        ko: 'kr',
        nl: 'nl',
        no: 'no',
        pl: 'pl',
        pt: 'pt',
        ru: 'ru',
        sv: 'sv',
        zh: 'zh_cn',
        tr: 'tr',
        en: 'en'
      };
      const apiLang = openWeatherLangMap[lang] || 'tr';

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=${apiLang}`
      ).catch(() => null);

      if (!response || !response.ok) {
        // Fallback to simulated weather if offline or API key invalid
        const weatherSimulations = {
          tr: ['Güneşli', 'Parçalı Bulutlu', 'Bulutlu', 'Yağmurlu', 'Rüzgarlı'],
          en: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Windy'],
          ar: ['مشمس', 'غائم جزئيا', 'غائم', 'ممطر', 'عاصف'],
          cs: ['Slunečno', 'Polojasno', 'Zataženo', 'Deštivo', 'Větrno'],
          da: ['Solrigt', 'Delvist skyet', 'Overskyet', 'Regnfuldt', 'Blæsende'],
          de: ['Sonnig', 'Teils bewölkt', 'Bewölkt', 'Regnerisch', 'Windig'],
          es: ['Soleado', 'Parcialmente nublado', 'Nublado', 'Lluvioso', 'Ventoso'],
          fr: ['Ensoleillé', 'Partiellement nuageux', 'Nuageux', 'Pluvieux', 'Venteux'],
          hi: ['धूप', 'आंशिक रूप से बादल छाए रहेंगे', 'बादल छाए रहेंगे', 'बरसात', 'हवादार'],
          it: ['Soleggiato', 'Parzialmente nuvoloso', 'Nuvoloso', 'Piovoso', 'Ventoso'],
          ja: ['晴れ', '晴れのち曇り', '曇り', '雨', '風が強い'],
          ko: ['맑음', '구름 조금', '흐림', '비', '바람 불어'],
          nl: ['Zonnig', 'Half bewolkt', 'Bewolkt', 'Regenachtig', 'Winderig'],
          no: ['Solfylt', 'Delvis skyet', 'Overskyet', 'Regnfullt', 'Vindfullt'],
          pl: ['Słonecznie', 'Częściowo zachmurzenie', 'Pochmurno', 'Deszczowo', 'Wietrznie'],
          pt: ['Ensolarado', 'Parcialmente nublado', 'Nublado', 'Chuvoso', 'Ventoso'],
          ru: ['Ясно', 'Переменная облачность', 'Пасмурно', 'Дождливо', 'Ветрено'],
          sv: ['Soligt', 'Delvis molnigt', 'Mulet', 'Regnigt', 'Blåsigt'],
          zh: ['晴朗', '多云', '阴天', '下雨', '有风']
        };
        const conditions = weatherSimulations[lang] || weatherSimulations['tr'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        const randomTemp = Math.floor(Math.random() * 15) + 15; // 15-30 degrees
        return {
          success: true,
          temp: randomTemp,
          desc: randomCondition,
          icon: '01d',
          simulated: true
        };
      }

      const weatherData = await response.json();
      return {
        success: true,
        temp: Math.round(weatherData.main.temp),
        desc: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        simulated: false
      };
    } catch (error) {
      console.error('Weather fetching error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('media:select-photo', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Fotoğraf Seç',
        properties: ['openFile'],
        filters: [{ name: 'Görseller', extensions: ['jpg', 'jpeg', 'png'] }]
      });
      if (canceled || filePaths.length === 0) return { success: false };
      return { success: true, filePath: filePaths[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('media:save-photo', async (_, { projectId, filePath }) => {
    try {
      if (!filePath) return { success: false, message: 'Dosya seçilmedi' };
      
      const isDev = process.env.NODE_ENV === 'development';
      const baseDir = isDev 
        ? path.join(__dirname, '../../media')
        : path.join(app.getPath('userData'), 'media');

      const projectDir = path.join(baseDir, `project_${projectId}`);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      const ext = path.extname(filePath);
      const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
      const destPath = path.join(projectDir, uniqueName);

      fs.copyFileSync(filePath, destPath);

      return { success: true, relativePath: `project_${projectId}/${uniqueName}` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('media:save-photo-base64', async (_, { projectId, base64Data }) => {
    try {
      if (!base64Data) return { success: false, message: 'Veri boş' };

      const isDev = process.env.NODE_ENV === 'development';
      const baseDir = isDev 
        ? path.join(__dirname, '../../media')
        : path.join(app.getPath('userData'), 'media');

      const projectDir = path.join(baseDir, `project_${projectId}`);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      // base64Data: "data:image/webp;base64,..."
      const commaIdx = base64Data.indexOf(',');
      const cleanBase64 = commaIdx !== -1 ? base64Data.slice(commaIdx + 1) : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');

      const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 10000)}.webp`;
      const destPath = path.join(projectDir, uniqueName);

      fs.writeFileSync(destPath, buffer);

      return { success: true, relativePath: `project_${projectId}/${uniqueName}` };
    } catch (error) {
      console.error('Save photo base64 error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('media:read-photo', async (_, { relativePath }) => {
    try {
      if (!relativePath) return { success: false, message: 'Dosya belirtilmedi' };
      
      const isDev = process.env.NODE_ENV === 'development';
      const baseDir = isDev 
        ? path.join(__dirname, '../../media')
        : path.join(app.getPath('userData'), 'media');
      
      const filePath = path.resolve(baseDir, relativePath);
      if (!filePath.startsWith(baseDir)) {
        return { success: false, message: 'Geçersiz dosya yolu' };
      }
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'base64');
        const ext = path.extname(filePath).toLowerCase();
        let mime = 'image/jpeg';
        if (ext === '.png') mime = 'image/png';
        return { success: true, base64: `data:${mime};base64,${content}` };
      }
      return { success: false, message: 'Dosya bulunamadı' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // --- LAN MOBILE UPLOAD & DB RESTORE HANDLERS ---
  const { startLANServer, stopLANServer } = require('./services/lanServer');
  const QRCode = require('qrcode');

  ipcMain.handle('system:start-lan-server', async (event, { projectId, projectName }) => {
    try {
      const webContents = event.sender;
      const window = BrowserWindow.fromWebContents(webContents);
      
      const result = startLANServer(window);
      if (result.success) {
        const url = `http://${result.ip}:${result.port}?projectId=${projectId || ''}&projectName=${encodeURIComponent(projectName || 'Genel')}`;
        const qrCodeDataUrl = await QRCode.toDataURL(url);
        return { success: true, url, qrCodeDataUrl };
      }
      return { success: false, message: 'Sunucu başlatılamadı.' };
    } catch (error) {
      console.error('Start LAN server error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('system:stop-lan-server', async () => {
    stopLANServer();
    return { success: true };
  });

  ipcMain.handle('system:restore-db-file', async (_, { filePath }) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return { success: false, message: 'Geçersiz dosya yolu.' };
      }
      
      const isDev = process.env.NODE_ENV === 'development';
      const dbPath = isDev 
        ? path.join(__dirname, '../../database.sqlite')
        : path.join(app.getPath('userData'), 'elektronik-yevmiye.sqlite');

      if (db && typeof db.close === 'function') {
        await db.close();
      }
      
      fs.copyFileSync(filePath, dbPath);

      app.relaunch();
      app.exit(0);

      return { success: true };
    } catch (error) {
      console.error('DB Restore error:', error);
      return { success: false, message: error.message };
    }
  });

}

setupHandlers();
