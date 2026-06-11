const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// IPC Handlers'ı dahil et
require('./ipcHandlers');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Geliştirme ortamında Vite dev server'a bağlan, üretimde dosyayı yükle
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    try {
      const { getDB } = require('./database/db');
      const db = await getDB();
      const setting = await db.get("SELECT setting_value FROM app_settings WHERE setting_key = 'cloud_sync_folder'");
      
      if (setting && setting.setting_value) {
        const fs = require('fs');
        const isDev = process.env.NODE_ENV === 'development';
        const dbPath = isDev 
          ? path.join(__dirname, '../../database.sqlite')
          : path.join(app.getPath('userData'), 'elektronik-yevmiye.sqlite');
          
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const destPath = path.join(setting.setting_value, `elektronik-yevmiye-backup-${timestamp}.sqlite`);
        fs.copyFileSync(dbPath, destPath);
        console.log('Cloud sync backup completed:', destPath);
      }
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
    app.quit();
  }
});
