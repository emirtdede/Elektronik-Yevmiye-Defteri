const { setupTestDB } = require('./testDb');
const { deleteTransactionAndCash, createTransactionAndCash } = require('./financialService');

describe('Financial Service (Cari ve Kasa Otonomisi)', () => {
  let db;

  beforeEach(async () => {
    db = await setupTestDB();
    
    // Seed some initial data
    await db.run("INSERT INTO workers (id, full_name, daily_wage) VALUES (1, 'Test İşçi', 1000)");
    
    // Create a cash register entry
    const cashResult = await db.run(
      "INSERT INTO cash_register (id, trans_date, amount, type) VALUES (1, '2026-06-11', 500, 'cikis')"
    );

    // Create a transaction linked to the cash register entry
    await db.run(
      "INSERT INTO transactions (id, worker_id, trans_date, amount, linked_cash_id) VALUES (1, 1, '2026-06-11', 500, 1)"
    );
  });

  it('should soft delete transaction AND linked cash_register entry', async () => {
    const result = await deleteTransactionAndCash(1, db);
    console.log(result);
    expect(result.success).toBe(true);

    // Verify transaction is soft deleted
    const trans = await db.get('SELECT is_deleted FROM transactions WHERE id = 1');
    expect(trans.is_deleted).toBe(1);

    // Verify cash_register is soft deleted
    const cash = await db.get('SELECT is_deleted FROM cash_register WHERE id = 1');
    expect(cash.is_deleted).toBe(1);
    
    // Verify audit logs were created
    const logs = await db.all('SELECT * FROM audit_logs');
    expect(logs.length).toBe(2);
    expect(logs[0].table_name).toBe('transactions');
    expect(logs[1].table_name).toBe('cash_register');
  });

  it('should FAIL gracefully when transaction not found for delete', async () => {
    const result = await deleteTransactionAndCash(999, db);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Transaction not found');
  });

  it('should CREATE transaction and linked cash_register entry automatically when trans_type is Avans', async () => {
    const data = {
      worker_id: 1,
      trans_date: '2023-10-15',
      trans_type: 'Avans',
      amount: 500,
      notes: 'Test Avans'
    };

    const result = await createTransactionAndCash(db, data);
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.linked_cash_id).toBeDefined();

    // Verify transaction was created
    const trans = await db.get('SELECT * FROM transactions WHERE id = ?', [result.id]);
    expect(trans.amount).toBe(500);
    expect(trans.linked_cash_id).toBe(result.linked_cash_id);

    // Verify cash_register was created
    const cash = await db.get('SELECT * FROM cash_register WHERE id = ?', [result.linked_cash_id]);
    expect(cash.amount).toBe(500);
    expect(cash.type).toBe('Nakit Çıkışı');

    // Verify audit logs
    const logs = await db.all('SELECT * FROM audit_logs WHERE action = ?', ['CREATE']);
    // Should have 2 CREATE logs: one for cash_register, one for transactions
    expect(logs.length).toBe(2);
    const tables = logs.map(l => l.table_name).sort();
    expect(tables).toEqual(['cash_register', 'transactions']);
  });
});
