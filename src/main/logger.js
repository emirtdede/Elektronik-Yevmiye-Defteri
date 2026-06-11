const log = require('electron-log');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Configure electron-log to resolve path dynamically based on current date
log.transports.file.resolvePathFn = () => {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const userDataPath = app ? app.getPath('userData') : path.join(__dirname, '../../test_data');
  const logDir = path.join(userDataPath, 'logs', year, month);
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return path.join(logDir, `${year}-${month}-${day}.log`);
};

// Customize the format
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// Disable default console logging if needed, or keep it
log.transports.console.level = 'info';
log.transports.file.level = 'info';

module.exports = log;
