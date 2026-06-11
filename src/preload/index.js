const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Generic DB Operations (Zero-Code Change Architecture)
  db: {
    read: (table, conditions = {}) => ipcRenderer.invoke('db:read', { table, conditions }),
    create: (table, data) => ipcRenderer.invoke('db:create', { table, data }),
    update: (table, id, data) => ipcRenderer.invoke('db:update', { table, id, data }),
    delete: (table, id) => ipcRenderer.invoke('db:delete', { table, id }),
    transactionDelete: (id) => ipcRenderer.invoke('db:transaction:delete', { id })
  },
  finance: {
    getBalance: (worker_id) => ipcRenderer.invoke('finance:get-balance', { worker_id }),
    calculateWage: (params) => ipcRenderer.invoke('finance:calculate-wage', params),
    deleteTransaction: (id) => ipcRenderer.invoke('finance:delete-transaction', { id }),
    createAdvance: (data) => ipcRenderer.invoke('finance:create-advance', { data }),
    workerReport: (worker_id, year, month) => ipcRenderer.invoke('finance:worker-report', { worker_id, year, month }),
    workerStatement: (params) => ipcRenderer.invoke('finance:worker-statement', params),
    companyReport: (year, month) => ipcRenderer.invoke('finance:company-report', { year, month }),
    groupStatement: (params) => ipcRenderer.invoke('finance:group-statement', params)
  },
  system: {
    backupDB: () => ipcRenderer.invoke('system:backup-db'),
    readLogs: (params) => ipcRenderer.invoke('system:read-logs', params),
    vacuumDB: () => ipcRenderer.invoke('system:vacuum-db'),
    setCloudFolder: () => ipcRenderer.invoke('system:set-cloud-folder'),
    getWeather: (params) => ipcRenderer.invoke('system:get-weather', params),
    startLANServer: (params) => ipcRenderer.invoke('system:start-lan-server', params),
    stopLANServer: () => ipcRenderer.invoke('system:stop-lan-server'),
    restoreDBFile: (params) => ipcRenderer.invoke('system:restore-db-file', params),
    onPhotoUploaded: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('lan:photo-uploaded', subscription);
      return () => {
        ipcRenderer.removeListener('lan:photo-uploaded', subscription);
      };
    }
  },
  media: {
    selectPhoto: () => ipcRenderer.invoke('media:select-photo'),
    savePhoto: (params) => ipcRenderer.invoke('media:save-photo', params),
    readPhoto: (params) => ipcRenderer.invoke('media:read-photo', params)
  }
});
