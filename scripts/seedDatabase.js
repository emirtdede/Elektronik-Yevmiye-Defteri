const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const { fakerTR } = require('@faker-js/faker');
const chalk = require('chalk');

// Helper to generate a valid 11-digit TC Kimlik No
function generateTC() {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  // 1st digit cannot be 0
  if (digits[0] === 0) digits[0] = 1;
  
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  
  const d10 = (sumOdd * 7 - sumEven) % 10;
  const d11 = (digits.reduce((acc, val) => acc + val, 0) + d10) % 10;
  
  return digits.join('') + d10 + d11;
}

// Helper to generate a phone starting with 5xx
function generateTRPhone() {
  const providers = ['505', '506', '507', '530', '531', '532', '533', '534', '535', '536', '537', '538', '539', '541', '542', '543', '544', '545', '546', '549', '551', '552', '553', '554', '555', '559'];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  const part1 = String(Math.floor(Math.random() * 900) + 100);
  const part2 = String(Math.floor(Math.random() * 90) + 10);
  const part3 = String(Math.floor(Math.random() * 90) + 10);
  return `0${provider} ${part1} ${part2} ${part3}`;
}

async function seed() {
  const dbPath = path.join(__dirname, '../database.sqlite');
  const backupPath = path.join(__dirname, '../database_backup.sqlite');

  console.log(chalk.bold.blue('*** STRES TESTİ İÇİN DUMMY DATA SEEDER BAŞLADI ***\n'));

  // 1. Güvenlik Yedeklemesi
  if (fs.existsSync(dbPath)) {
    console.log(chalk.yellow(`Mevcut veritabanı yedeğe alınıyor...`));
    console.log(chalk.gray(`Kaynak: ${dbPath}`));
    console.log(chalk.gray(`Yedek: ${backupPath}`));
    
    // Backup exist check
    if (fs.existsSync(backupPath)) {
      try {
        fs.unlinkSync(backupPath);
      } catch (err) {
        // ignore
      }
    }
    try {
      fs.renameSync(dbPath, backupPath);
      console.log(chalk.green('Yedekleme BAŞARILI (Dosya taşındı).'));
    } catch (err) {
      if (err.code === 'EBUSY') {
        console.log(chalk.yellow('Veritabanı dosyası kilitli (EBUSY). Dosya kopyalanarak yedeklenecek ve tablolar temizlenecektir...'));
        try {
          fs.copyFileSync(dbPath, backupPath);
          console.log(chalk.green('Kopyalama ile yedekleme BAŞARILI.'));
        } catch (copyErr) {
          console.error(chalk.red('Yedek kopyası oluşturulamadı:'), copyErr);
        }
      } else {
        throw err;
      }
    }
  } else {
    console.log(chalk.cyan('Mevcut bir database.sqlite bulunamadı, sıfırdan başlanacak.'));
  }

  // Yeni DB bağlantısı
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Tabloları temizleme (EBUSY durumunda temiz başlangıç için)
  await db.exec(`
    DROP TABLE IF EXISTS timesheets;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS cash_register;
    DROP TABLE IF EXISTS workers;
    DROP TABLE IF EXISTS worker_groups;
    DROP TABLE IF EXISTS work_types;
    DROP TABLE IF EXISTS app_settings;
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS production_records;
    DROP TABLE IF EXISTS materials;
    DROP TABLE IF EXISTS daily_journals;
    DROP TABLE IF EXISTS quality_reports;
    DROP TABLE IF EXISTS subcontractor_ledgers;
  `);

  // Şema oluşturma
  console.log(chalk.yellow('\nYeni veritabanı şeması oluşturuluyor...'));
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
      isg_bitis_tarihi DATE,
      project_id INTEGER,
      tags TEXT,
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
      project_id INTEGER,
      tags TEXT,
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
      project_id INTEGER,
      tags TEXT,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      project_id INTEGER,
      tags TEXT
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
      tags TEXT,
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
      tags TEXT,
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
      tags TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

  console.log(chalk.green('Şema başarıyla oluşturuldu.'));

  // Default app settings
  await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['standard_daily_hours', '8', 'Standart günlük çalışma saati']);
  await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['overtime_multiplier', '1.5', 'Mesai saat ücreti çarpanı']);
  await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['theme', 'dark', 'Uygulama Teması (dark/light)']);
  await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['language', 'tr', 'Uygulama Dili (tr/en)']);
  await db.run("INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)", ['company_name', 'STRES TESTİ YAYINCILIK', 'Şirket/Kurum Adı']);

  // Default work types
  await db.run("INSERT INTO work_types (name, multiplier) VALUES (?, ?)", ['Tam Gün', 1.0]);
  await db.run("INSERT INTO work_types (name, multiplier) VALUES (?, ?)", ['Yarım Gün', 0.5]);
  await db.run("INSERT INTO work_types (name, multiplier) VALUES (?, ?)", ['Pazar Mesaisi', 2.0]);
  await db.run("INSERT INTO work_types (name, multiplier) VALUES (?, ?)", ['İzinli (Ücretsiz)', 0.0]);

  const workTypes = await db.all('SELECT id, name FROM work_types');
  const tamGunId = workTypes.find(t => t.name === 'Tam Gün')?.id || 1;
  const yarimGunId = workTypes.find(t => t.name === 'Yarım Gün')?.id || 2;
  const pazarId = workTypes.find(t => t.name === 'Pazar Mesaisi')?.id || 3;
  const izinliId = workTypes.find(t => t.name === 'İzinli (Ücretsiz)')?.id || 4;

  // 2. İşçi Grupları oluşturulması
  const groupNames = ['Kalıpçılar', 'Demirciler', 'Elektrikçiler', 'Boyacılar', 'Tesisatçılar', 'İSG Uzmanları', 'Kaynakçılar', 'Operatörler', 'İskeleciler', 'Beden İşçileri'];
  const groupIds = [];
  for (const name of groupNames) {
    const res = await db.run('INSERT INTO worker_groups (name) VALUES (?)', [name]);
    groupIds.push(res.lastID);
  }

  // 3. Şantiyeler (10 Adet)
  console.log(chalk.magenta('\n10 Adet Şantiye oluşturuluyor...'));
  const projectNames = [
    'Kadıköy Kentsel Dönüşüm',
    'Ataşehir Finans Plaza',
    'Bodrum Marina Genişletme',
    'Çatalca Viyadük İnşaatı',
    'Çankaya Metro İstasyonu',
    'Aliağa Rüzgar Santrali',
    'Beşiktaş Tünel Rehabilitasyonu',
    'Kartal TOKİ Toplu Konutları',
    'Esenyurt Lojistik Depo',
    'Tuzla Tersane Rıhtım Yapımı'
  ];
  const projectIds = [];
  for (const name of projectNames) {
    const res = await db.run('INSERT INTO projects (name, location, status) VALUES (?, ?, ?)', [
      name,
      fakerTR.location.city() + ' / Türkiye',
      'active'
    ]);
    projectIds.push(res.lastID);
  }
  console.log(chalk.green('10 Şantiye başarıyla oluşturuldu.'));

  // 4. Taşeron & Alt Yükleniciler (15 Adet)
  console.log(chalk.magenta('\n15 Adet Taşeron / Tedarikçi oluşturuluyor...'));
  const subcontractorIds = [];
  const serviceTypes = ['Hafriyat ve Kazı', 'Kalıp Kurulumu', 'Demir İşçiliği', 'Hazır Beton Tedariki', 'Kule Vinç Kiralama', 'Şantiye Yemek Hizmeti', 'Elektrik Altyapı', 'Mekanik Tesisat', 'Peyzaj ve Çevre'];
  const subNames = [];
  for (let i = 0; i < 15; i++) {
    const companyName = fakerTR.company.name() + ' İnş. San. Tic. A.Ş.';
    const service = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const phone = generateTRPhone();
    const dailyWage = 10000 + Math.floor(Math.random() * 30) * 1000; // 10.000 - 40.000 ₺
    const projId = projectIds[Math.floor(Math.random() * projectIds.length)];

    const res = await db.run(
      'INSERT INTO subcontractor_ledgers (project_id, name, service_type, phone, daily_wage, status, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projId, companyName, service, phone, dailyWage, 'active', service.split(' ')[0]]
    );
    subcontractorIds.push(res.lastID);
    subNames.push(companyName);
  }
  console.log(chalk.green('15 Taşeron oluşturuldu.'));

  // 5. 500 Personel / İşçi
  console.log(chalk.magenta('\n500 Adet Personel/İşçi oluşturuluyor...'));
  const workers = [];
  const tagsPool = ['Usta', 'Kalfa', 'Çırak', 'GeceVardiyası', 'Sertifikalı', 'İSG_Eğitimli', 'Kaynakçı', 'Operatör'];

  await db.run('BEGIN TRANSACTION');
  for (let i = 0; i < 500; i++) {
    const fullName = fakerTR.person.fullName();
    const tcNo = generateTC();
    const phone = generateTRPhone();
    const dailyWage = 1000 + Math.floor(Math.random() * 31) * 50; // 1000₺ - 2500₺ arası
    const groupId = groupIds[Math.floor(Math.random() * groupIds.length)];
    const projectId = projectIds[Math.floor(Math.random() * projectIds.length)];
    
    // Random 1-2 tags
    const numTags = 1 + Math.floor(Math.random() * 2);
    const wTags = [];
    for (let t = 0; t < numTags; t++) {
      const tag = tagsPool[Math.floor(Math.random() * tagsPool.length)];
      if (!wTags.includes(tag)) wTags.push(tag);
    }
    
    const isgDaysOffset = Math.floor(Math.random() * 60) - 10; // -10 ile +50 gün arası
    const isgDateObj = new Date();
    isgDateObj.setDate(isgDateObj.getDate() + isgDaysOffset);
    const isgDateStr = isgDateObj.toISOString().split('T')[0];

    const res = await db.run(
      'INSERT INTO workers (full_name, tc_no, phone, daily_wage, group_id, start_date, status, project_id, tags, isg_bitis_tarihi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [fullName, tcNo, phone, dailyWage, groupId, '2025-06-01', 'active', projectId, wTags.join(','), isgDateStr]
    );

    workers.push({
      id: res.lastID,
      fullName,
      dailyWage,
      projectId
    });
  }
  await db.run('COMMIT');
  console.log(chalk.green('500 İşçi başarıyla oluşturuldu.'));

  // 6. 20.000 Puantaj Kaydı
  console.log(chalk.magenta('\n20.000 Adet Puantaj (Timesheet) Kaydı oluşturuluyor...'));
  // Generate dates for the last 365 days
  const dateList = [];
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const dateObj = new Date();
    dateObj.setDate(today.getDate() - i);
    dateList.push(dateObj.toISOString().split('T')[0]);
  }

  await db.run('BEGIN TRANSACTION');
  let timesheetCount = 0;
  while (timesheetCount < 20000) {
    // Pick a random worker
    const worker = workers[Math.floor(Math.random() * workers.length)];
    // Pick a random date
    const dateStr = dateList[Math.floor(Math.random() * dateList.length)];
    
    // Choose work type
    const rand = Math.random();
    let typeId = tamGunId;
    let multiplier = 1.0;
    let overtime = 0;
    let notes = 'Normal çalışma';

    if (rand < 0.08) {
      typeId = yarimGunId;
      multiplier = 0.5;
      notes = 'Yarım gün çalışma';
    } else if (rand < 0.12) {
      typeId = izinliId;
      multiplier = 0.0;
      notes = 'Ücretsiz izin / raporlu';
    } else if (rand > 0.88) {
      overtime = Math.floor(Math.random() * 4) + 1; // 1-4 saat fazla mesai
      notes = `${overtime} saat fazla mesai yapıldı.`;
    }

    const earnedAmount = (worker.dailyWage * multiplier) + (worker.dailyWage / 8 * overtime * 1.5);

    await db.run(
      'INSERT INTO timesheets (worker_id, work_date, work_type_id, applied_wage, applied_multiplier, overtime_hours, earned_amount, notes, project_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [worker.id, dateStr, typeId, worker.dailyWage, multiplier, overtime, earnedAmount, notes, worker.projectId, overtime > 0 ? 'Mesai' : 'Normal']
    );
    timesheetCount++;
    
    if (timesheetCount % 5000 === 0) {
      console.log(chalk.gray(`... ${timesheetCount} puantaj yazıldı.`));
    }
  }
  await db.run('COMMIT');
  console.log(chalk.green(`20.000 Puantaj kaydı başarıyla eklendi.`));

  // 7. 5.000 Kasa İşlemi / Avans ve Taşeron Ödemeleri
  console.log(chalk.magenta('\n5.000 Adet Kasa İşlemi (Transaction / Cash) oluşturuluyor...'));
  
  await db.run('BEGIN TRANSACTION');
  let transactionCount = 0;
  
  // First, let's inject large starting budgets (Nakit Girişi) for each project
  for (const projId of projectIds) {
    await db.run(
      'INSERT INTO cash_register (trans_date, type, amount, description, project_id, tags) VALUES (?, ?, ?, ?, ?, ?)',
      ['2025-06-01', 'Nakit Girişi', 2500000, 'Merkez Proje Başlangıç Finansman Bütçesi', projId, 'Bütçe,Merkez']
    );
  }

  while (transactionCount < 5000) {
    // Decide if worker advance or subcontractor payment or generic cash expense/income
    const rand = Math.random();
    const randDate = dateList[Math.floor(Math.random() * dateList.length)];
    const projId = projectIds[Math.floor(Math.random() * projectIds.length)];

    if (rand < 0.60) {
      // 1. Worker Advance (Avans)
      const worker = workers[Math.floor(Math.random() * workers.length)];
      // Reasonable advance based on daily wage (e.g. 50% to 300% of daily wage)
      const multiplier = 0.5 + Math.random() * 2.5;
      const amount = Math.floor((worker.dailyWage * multiplier) / 50) * 50; // Rounded to 50 ₺
      
      const desc = `${worker.fullName} Nakit Avans Ödemesi`;

      // Create cash register entry (Nakit Çıkışı)
      const resCash = await db.run(
        'INSERT INTO cash_register (trans_date, type, amount, description, project_id, tags) VALUES (?, ?, ?, ?, ?, ?)',
        [randDate, 'Nakit Çıkışı', amount, desc, worker.projectId, 'Avans,Personel']
      );
      const cashId = resCash.lastID;

      // Create transaction entry for worker
      await db.run(
        'INSERT INTO transactions (worker_id, trans_date, trans_type, amount, notes, linked_cash_id, project_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [worker.id, randDate, 'advance', amount, 'Elden nakit ödeme', cashId, worker.projectId, 'Avans']
      );

    } else if (rand < 0.85) {
      // 2. Subcontractor Payment
      const subId = subcontractorIds[Math.floor(Math.random() * subcontractorIds.length)];
      const subName = subNames[subcontractorIds.indexOf(subId)];
      const amount = 5000 + Math.floor(Math.random() * 20) * 1000; // 5.000 - 25.000 ₺
      const desc = `${subName} Ara Hakediş Ödemesi`;

      await db.run(
        'INSERT INTO cash_register (trans_date, type, amount, description, project_id, tags) VALUES (?, ?, ?, ?, ?, ?)',
        [randDate, 'Nakit Çıkışı', amount, desc, projId, 'Taşeron,Ödeme']
      );

    } else {
      // 3. Generic Cash Income / Other Expenses
      const isIncome = Math.random() < 0.3;
      const type = isIncome ? 'Nakit Girişi' : 'Nakit Çıkışı';
      const amount = 500 + Math.floor(Math.random() * 40) * 250; // 500 - 10.500 ₺
      const description = isIncome
        ? 'Hurda/Atık Malzeme Geri Dönüşüm Satış Geliri'
        : 'Şantiye Ofis Kırtasiye ve Yemek Giderleri';
      
      await db.run(
        'INSERT INTO cash_register (trans_date, type, amount, description, project_id, tags) VALUES (?, ?, ?, ?, ?, ?)',
        [randDate, type, amount, description, projId, isIncome ? 'Gelir' : 'Gider']
      );
    }

    transactionCount++;
    if (transactionCount % 1000 === 0) {
      console.log(chalk.gray(`... ${transactionCount} kasa işlemi yazıldı.`));
    }
  }
  await db.run('COMMIT');
  console.log(chalk.green('5.000 Kasa/Transaction kaydı başarıyla eklendi.'));

  // 8. 500 Adet İrsaliye ve Tutanak (Quality Reports + Materials)
  console.log(chalk.magenta('\n500 Adet İrsaliye ve Tutanak (Materials & Quality Reports) oluşturuluyor...'));
  
  const suppliers = ['Lafarge Beton', 'Limak Çimento', 'Kalyon Çelik', 'Ege Seramik', 'Karabük Demir Çelik', 'Koçtaş Kurumsal', 'Polisan Boya', 'Fırat Plastik'];
  const materials = [
    { name: 'C30 Hazır Beton', unit: 'm³', tag: 'Beton' },
    { name: 'Nervürlü Donatı Demiri (Q16)', unit: 'ton', tag: 'Demir' },
    { name: 'Kalıp Kerestesi (Plywood)', unit: 'm²', tag: 'Ahşap' },
    { name: 'Püskürtme Şotkret Harcı', unit: 'm³', tag: 'Çimento' },
    { name: 'Dış Cephe Taşyünü Mantolama', unit: 'paket', tag: 'Yalıtım' },
    { name: 'Altyapı Koruge Boru (Q200)', unit: 'metre', tag: 'Tesisat' },
    { name: '10x20 Çevre Güvenlik Tuğlası', unit: 'adet', tag: 'Tuğla' }
  ];

  const qualityTitles = [
    'Beton Küp Kırımı Dayanım Testi',
    'Kule Vinç Periyodik Muayenesi',
    'Donatı Bağlantı ve Temizlik Muayenesi',
    'Kalıp İskelesi Güvenlik Denetimi',
    'İSG Kişisel Koruyucu Donanım Kontrolü',
    'Çatı Su Yalıtım Testi',
    'Şantiye Panosu Topraklama Ölçümü'
  ];

  const qualityDescs = [
    'Laboratuvar küp sonuçları standartların altında çıktı, düzeltici işlem açıldı.',
    'Vinç halatlarında yıpranma tespit edildi, değişim yapılana kadar çalışma durduruldu.',
    'Kolon demirlerinde pas lekeleri temizlendi, paspayı mesafeleri onaylandı.',
    'İskele korkuluklarında eksikler giderildi, yeşil kart takıldı.',
    'Baret ve emniyet kemeri takmayan 3 taşeron çalışanı sahada tespit edilip uyarıldı.',
    'Su yalıtım membran birleşim noktalarındaki açıklıklar nedeniyle nem sızıntısı görüldü.',
    'Ölçüm yapılan kazıkların topraklama direnci standartlara uygun bulundu.'
  ];

  await db.run('BEGIN TRANSACTION');
  for (let i = 0; i < 250; i++) {
    // 250 Materials (İrsaliye)
    const projId = projectIds[Math.floor(Math.random() * projectIds.length)];
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)] + ' A.Ş.';
    const mat = materials[Math.floor(Math.random() * materials.length)];
    const qty = 50 + Math.floor(Math.random() * 500);
    const receiptNo = `IRS-${200000 + i}`;
    const randDate = dateList[Math.floor(Math.random() * dateList.length)];
    
    await db.run(
      'INSERT INTO materials (project_id, supplier, material_type, quantity, unit, receipt_number, receipt_date, photo_path, notes, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [projId, supplier, mat.name, qty, mat.unit, receiptNo, randDate, '', 'Seeder otomatik sevkiyat logu', mat.tag]
    );

    // 250 Quality Reports (Tutanaklar)
    const qIndex = Math.floor(Math.random() * qualityTitles.length);
    const title = qualityTitles[qIndex];
    const desc = qualityDescs[qIndex];
    const status = Math.random() < 0.6 ? 'closed' : 'open';
    
    await db.run(
      'INSERT INTO quality_reports (project_id, title, description, status, photo_path, report_date, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projId, title, desc, status, '', randDate, title.split(' ')[0]]
    );
  }
  await db.run('COMMIT');
  console.log(chalk.green('500 İrsaliye ve Tutanak kaydı başarıyla eklendi.'));

  // Database Optimization
  console.log(chalk.yellow('\nVeritabanı optimize ediliyor (VACUUM)...'));
  await db.run('VACUUM');
  await db.close();

  console.log(chalk.bold.green('\n*** TOHUMLAMA BAŞARIYLA TAMAMLANDI! ***'));
  console.log(chalk.green('Toplam oluşturulan veri hacmi:'));
  console.log(chalk.white(' - Şantiyeler: 10 Adet'));
  console.log(chalk.white(' - Taşeronlar: 15 Adet'));
  console.log(chalk.white(' - Personel/İşçiler: 500 Adet'));
  console.log(chalk.white(' - Puantajlar: 20.000 Adet'));
  console.log(chalk.white(' - Kasa İşlemleri: 5.000 Adet'));
  console.log(chalk.white(' - İrsaliye ve Tutanaklar: 500 Adet'));
  console.log(chalk.cyan(`\nYedeklenen Orijinal DB: database_backup.sqlite`));
  console.log(chalk.cyan(`Aktif Stres Testi DB: database.sqlite`));
  console.log(chalk.yellow(`\nYedek veritabanınıza dönmek için uygulamanın kapalı olduğundan emin olun ve database_backup.sqlite dosyasının adını tekrar database.sqlite yapın.`));
}

seed().catch(err => {
  console.error(chalk.red('\nTohumlama başarısız oldu:'), err);
});
