const logger = require('../logger');

async function deleteTransactionAndCash(transaction_id, db) {
  try {
    await db.run('BEGIN TRANSACTION');
    
    const trans = await db.get('SELECT * FROM transactions WHERE id = ?', [transaction_id]);
    if (!trans) {
      await db.run('ROLLBACK');
      return { success: false, message: 'Transaction not found' };
    }

    // Soft Delete transaction
    await db.run('UPDATE transactions SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [transaction_id]);
    
    // Audit log
    await db.run(
      'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values) VALUES (?, ?, ?, ?, ?)',
      ['transactions', transaction_id, 'DELETE', JSON.stringify(trans), JSON.stringify({ is_deleted: 1 })]
    );
    logger.info(`[DB DELETE] [transactions] Bir avans/işlem iptal edildi. Tutar: ${trans.amount} TL`);
    
    // If linked to cash register, soft delete that too
    if (trans.linked_cash_id) {
      const cash = await db.get('SELECT * FROM cash_register WHERE id = ?', [trans.linked_cash_id]);
      if (cash) {
        await db.run('UPDATE cash_register SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [trans.linked_cash_id]);
        await db.run(
          'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values) VALUES (?, ?, ?, ?, ?)',
          ['cash_register', trans.linked_cash_id, 'DELETE', JSON.stringify(cash), JSON.stringify({ is_deleted: 1 })]
        );
        logger.info(`[DB DELETE] [cash_register] Kasadan bir işlem iptal edildi. Tutar: ${cash.amount} TL (${cash.type})`);
      }
    }
    
    await db.run('COMMIT');
    return { success: true, message: 'İşlem başarıyla iptal edildi.' };
  } catch (error) {
    await db.run('ROLLBACK');
    return { success: false, message: error.message };
  }
}

async function createTransactionAndCash(db, data) {
  try {
    await db.run('BEGIN TRANSACTION');

    const { worker_id, trans_date, trans_type, amount, notes, project_id } = data;
    
    // We only create cash out if it's an Avans (Cash Out / Nakit Çıkışı).
    // The user requirement says: "Kullanıcı bir işçiye 'Avans' verdiğinde... 'Kasa' tablosuna otomatik işlenmesi".
    // We will assume trans_type === 'Avans' means cash out.
    let linked_cash_id = null;

    if (trans_type === 'Avans') {
      // 1. Create cash_register record
      const cashQuery = `INSERT INTO cash_register (trans_date, type, amount, description, project_id) VALUES (?, ?, ?, ?, ?)`;
      // Cash out type: 'Çıkış' or 'Gider'
      const cashResult = await db.run(cashQuery, [trans_date, 'Nakit Çıkışı', amount, notes || 'Personel Avansı', project_id || null]);
      linked_cash_id = cashResult.lastID;

      // Audit log for cash_register
      await db.run(
        'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values) VALUES (?, ?, ?, ?, ?)',
        ['cash_register', linked_cash_id, 'CREATE', null, JSON.stringify({ trans_date, type: 'Nakit Çıkışı', amount, description: notes || 'Personel Avansı', project_id })]
      );
      logger.info(`[DB CREATE] [cash_register] Kasaya yeni işlem girildi. Tutar: ${amount} TL (Nakit Çıkışı)`);
    }

    // 2. Create transactions record
    const transQuery = `INSERT INTO transactions (worker_id, trans_date, trans_type, amount, notes, linked_cash_id, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const transResult = await db.run(transQuery, [worker_id, trans_date, trans_type, amount, notes, linked_cash_id, project_id || null]);
    const transaction_id = transResult.lastID;

    // Audit log for transactions
    await db.run(
      'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values) VALUES (?, ?, ?, ?, ?)',
      ['transactions', transaction_id, 'CREATE', null, JSON.stringify({ worker_id, trans_date, trans_type, amount, notes, linked_cash_id, project_id })]
    );
    logger.info(`[DB CREATE] [transactions] Yeni avans/işlem eklendi. Tutar: ${amount} TL`);

    await db.run('COMMIT');
    return { success: true, id: transaction_id, linked_cash_id, message: 'İşlem başarıyla eklendi.' };
  } catch (error) {
    await db.run('ROLLBACK');
    return { success: false, message: error.message };
  }
}

module.exports = { deleteTransactionAndCash, createTransactionAndCash };
