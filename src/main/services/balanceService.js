async function calculateWorkerBalance(worker_id, db) {
  // 1. Earned amounts from timesheets (Alacaklar)
  const timesheets = await db.get(
    'SELECT SUM(earned_amount) as total_earned FROM timesheets WHERE worker_id = ? AND is_deleted = 0',
    [worker_id]
  );
  
  // 2. Given amounts from transactions (Borçlar/Avanslar)
  const transactions = await db.get(
    'SELECT SUM(amount) as total_given FROM transactions WHERE worker_id = ? AND is_deleted = 0',
    [worker_id]
  );
  
  const earned = timesheets.total_earned || 0;
  const given = transactions.total_given || 0;
  
  return Number((earned - given).toFixed(2));
}

module.exports = { calculateWorkerBalance };
