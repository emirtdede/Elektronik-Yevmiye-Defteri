const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { app } = require('electron');

let serverInstance = null;
let currentPort = 5001;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      const family = typeof iface.family === 'string' ? iface.family : `IPv${iface.family}`;
      if (family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function startLANServer(mainWindow) {
  if (serverInstance) {
    return { success: true, port: currentPort, ip: getLocalIP() };
  }

  const expressApp = express();
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const projectId = req.query.projectId || 'default';
      const isDev = process.env.NODE_ENV === 'development';
      const baseDir = isDev 
        ? path.join(__dirname, '../../../media')
        : path.join(app.getPath('userData'), 'media');

      const projectDir = path.join(baseDir, `project_${projectId}`);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      cb(null, projectDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
      cb(null, uniqueName);
    }
  });

  const upload = multer({ storage: storage });

  expressApp.get('/', (req, res) => {
    const projectId = req.query.projectId || '';
    const projectName = req.query.projectName || 'Genel';
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şantiye Fotoğraf Yükleyici</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 1rem;
            box-sizing: border-box;
          }
          .card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
          }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #38bdf8; }
          p { font-size: 0.9rem; color: #94a3b8; margin-bottom: 2rem; }
          .file-input-label {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
            margin-bottom: 1rem;
            width: 100%;
            box-sizing: border-box;
          }
          .file-input-label:active { transform: scale(0.98); }
          input[type="file"] { display: none; }
          .btn-submit {
            background: #10B981;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: bold;
            width: 100%;
            cursor: pointer;
            margin-top: 1rem;
            display: none;
            box-sizing: border-box;
          }
          .status { margin-top: 1.5rem; font-size: 0.95rem; font-weight: 500; }
          .success { color: #34d399; }
          .error { color: #f87171; }
          .spinner {
            border: 4px solid rgba(255,255,255,0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #38bdf8;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-top: 1rem;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Şantiye Fotoğraf Yükle</h1>
          <p>Şantiye: <strong style="color:#fff">${projectName}</strong></p>
          <form id="uploadForm" enctype="multipart/form-data">
            <label class="file-input-label" id="fileLabel">
              📸 Fotoğraf Çek / Seç
              <input type="file" name="photo" accept="image/*" capture="environment" id="fileInput" required />
            </label>
            <div id="fileName" style="margin-bottom:1rem;font-size:0.85rem;color:#cbd5e1"></div>
            <button type="submit" class="btn-submit" id="submitBtn">Yüklemeyi Başlat</button>
          </form>
          <div id="loader" style="display:none;"><div class="spinner"></div></div>
          <div class="status" id="statusMsg"></div>
        </div>

        <script>
          const fileInput = document.getElementById('fileInput');
          const fileLabel = document.getElementById('fileLabel');
          const fileName = document.getElementById('fileName');
          const submitBtn = document.getElementById('submitBtn');
          const statusMsg = document.getElementById('statusMsg');
          const loader = document.getElementById('loader');

          fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
              const file = e.target.files[0];
              fileName.textContent = file.name;
              submitBtn.style.display = 'block';
            }
          });

          document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = fileInput.files[0];
            if (!file) return;

            submitBtn.style.display = 'none';
            fileLabel.style.display = 'none';
            loader.style.display = 'block';
            statusMsg.className = 'status';
            statusMsg.textContent = 'Görsel sıkıştırılıyor ve formatı optimize ediliyor...';

            try {
              const compressAndGetBlob = (inputFile) => {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      let width = img.width;
                      let height = img.height;
                      const maxWidth = 1200;
                      if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                      }
                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(img, 0, 0, width, height);
                      canvas.toBlob((blob) => {
                        resolve(blob || inputFile);
                      }, 'image/webp', 0.8);
                    };
                    img.onerror = () => reject(new Error('Görsel yüklenemedi.'));
                    img.src = event.target.result;
                  };
                  reader.onerror = () => reject(new Error('Dosya okunamadı.'));
                  reader.readAsDataURL(inputFile);
                });
              };

              const webpBlob = await compressAndGetBlob(file);
              const formData = new FormData();
              formData.append('photo', webpBlob, 'mobile_photo.webp');

              statusMsg.textContent = 'Yükleniyor...';

              const res = await fetch('/upload?projectId=' + '${projectId}', {
                method: 'POST',
                body: formData
              });
              const data = await res.json();
              loader.style.display = 'none';
              if (data.success) {
                statusMsg.className = 'status success';
                statusMsg.textContent = '✓ Fotoğraf başarıyla yüklendi!';
                setTimeout(() => {
                  fileLabel.style.display = 'inline-block';
                  fileName.textContent = '';
                  fileInput.value = '';
                }, 3000);
              } else {
                statusMsg.className = 'status error';
                statusMsg.textContent = 'Hata: ' + data.message;
                submitBtn.style.display = 'block';
                fileLabel.style.display = 'inline-block';
              }
            } catch (err) {
              loader.style.display = 'none';
              statusMsg.className = 'status error';
              statusMsg.textContent = 'Bağlantı hatası: ' + err.message;
              submitBtn.style.display = 'block';
              fileLabel.style.display = 'inline-block';
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  expressApp.post('/upload', upload.single('photo'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Fotoğraf dosyası bulunamadı.' });
      }

      const projectId = req.query.projectId || 'default';
      const relativePath = `project_${projectId}/${req.file.filename}`;
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('lan:photo-uploaded', {
          projectId,
          filename: req.file.filename,
          relativePath
        });
      }

      res.json({ success: true, relativePath });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  serverInstance = expressApp.listen(currentPort, '0.0.0.0', () => {
    console.log(`LAN upload server running at http://0.0.0.0:${currentPort}`);
  });

  return { success: true, port: currentPort, ip: getLocalIP() };
}

function stopLANServer() {
  if (serverInstance) {
    serverInstance.close();
    serverInstance = null;
  }
}

module.exports = { startLANServer, stopLANServer, getLocalIP };
