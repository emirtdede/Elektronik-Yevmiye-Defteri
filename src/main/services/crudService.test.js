const { setupTestDB } = require('./testDb');
const { readRecord, createRecord, updateRecord, deleteRecord } = require('./crudService');

describe('Generic CRUD Service (Veritabanı İşlemleri)', () => {
  let db;

  beforeEach(async () => {
    db = await setupTestDB();
    // Seed some active and deleted data
    await db.run("INSERT INTO workers (id, full_name, daily_wage, is_deleted) VALUES (1, 'Aktif İşçi', 1000, 0)");
    await db.run("INSERT INTO workers (id, full_name, daily_wage, is_deleted) VALUES (2, 'Silinmiş İşçi', 1000, 1)");
  });

  it('should READ only active (is_deleted = 0) records', async () => {
    const workers = await readRecord(db, 'workers');
    expect(workers.length).toBe(1);
    expect(workers[0].id).toBe(1);
    expect(workers[0].full_name).toBe('Aktif İşçi');
  });

  it('should CREATE record and log to audit_logs', async () => {
    const newData = { full_name: 'Yeni İşçi', daily_wage: 1500 };
    const result = await createRecord(db, 'workers', newData);
    
    expect(result.success).toBe(true);
    expect(result.id).toBe(3); // previous was 1 and 2

    // Verify audit log
    const logs = await db.all('SELECT * FROM audit_logs WHERE table_name = ? AND action = ?', ['workers', 'CREATE']);
    expect(logs.length).toBe(1);
    expect(logs[0].record_id).toBe(3);
    expect(logs[0].old_values).toBeNull();
    expect(JSON.parse(logs[0].new_values).daily_wage).toBe(1500);
  });

  it('should UPDATE record and log old/new values to audit_logs', async () => {
    const updateData = { daily_wage: 2000 };
    const result = await updateRecord(db, 'workers', 1, updateData);
    
    expect(result.success).toBe(true);

    // Verify database is updated
    const worker = await db.get('SELECT * FROM workers WHERE id = 1');
    expect(worker.daily_wage).toBe(2000);

    // Verify audit log
    const logs = await db.all('SELECT * FROM audit_logs WHERE table_name = ? AND action = ?', ['workers', 'UPDATE']);
    expect(logs.length).toBe(1);
    expect(logs[0].record_id).toBe(1);
    expect(JSON.parse(logs[0].old_values).daily_wage).toBe(1000);
    expect(JSON.parse(logs[0].new_values).daily_wage).toBe(2000);
  });

  it('should perform SOFT DELETE and log to audit_logs', async () => {
    const result = await deleteRecord(db, 'workers', 1);
    expect(result.success).toBe(true);

    // Verify database record has is_deleted = 1
    const worker = await db.get('SELECT is_deleted FROM workers WHERE id = 1');
    expect(worker.is_deleted).toBe(1);

    // Verify READ no longer returns it
    const activeWorkers = await readRecord(db, 'workers');
    expect(activeWorkers.length).toBe(0);

    // Verify audit log
    const logs = await db.all('SELECT * FROM audit_logs WHERE table_name = ? AND action = ?', ['workers', 'DELETE']);
    expect(logs.length).toBe(1);
    expect(JSON.parse(logs[0].new_values).is_deleted).toBe(1);
  });
});
