async function generateWorkerMonthlyReport(db, worker_id, year, month) {
  try {
    const monthStr = month.toString().padStart(2, '0');
    const monthPrefix = `${year}-${monthStr}`;
    const dateThreshold = `${year}-${monthStr}-01`;

    // 1. Fetch timesheets and transactions for the specified month
    const timesheets = await db.all(
      `SELECT * FROM timesheets WHERE worker_id = ? AND is_deleted = 0 AND work_date LIKE ? ORDER BY work_date ASC`,
      [worker_id, `${monthPrefix}%`]
    );

    const transactions = await db.all(
      `SELECT * FROM transactions WHERE worker_id = ? AND is_deleted = 0 AND trans_date LIKE ? ORDER BY trans_date ASC`,
      [worker_id, `${monthPrefix}%`]
    );

    let monthEarned = 0;
    timesheets.forEach(ts => monthEarned += ts.earned_amount);

    let monthAdvance = 0;
    transactions.forEach(tr => monthAdvance += tr.amount);

    // 2. Fetch all previous timesheets and transactions (before this month) to calculate devreden bakiye
    const prevTimesheets = await db.all(
      `SELECT SUM(earned_amount) as total FROM timesheets WHERE worker_id = ? AND is_deleted = 0 AND work_date < ?`,
      [worker_id, dateThreshold]
    );
    const prevTransactions = await db.all(
      `SELECT SUM(amount) as total FROM transactions WHERE worker_id = ? AND is_deleted = 0 AND trans_date < ?`,
      [worker_id, dateThreshold]
    );

    const prevEarned = prevTimesheets[0]?.total || 0;
    const prevAdvance = prevTransactions[0]?.total || 0;
    const devredenBakiye = prevEarned - prevAdvance;

    const aylikNetBakiye = monthEarned - monthAdvance;
    const yeniBakiye = devredenBakiye + aylikNetBakiye;

    // Get worker details
    const worker = await db.get('SELECT * FROM workers WHERE id = ?', [worker_id]);

    return {
      success: true,
      worker,
      month: monthPrefix,
      timesheets,
      transactions,
      summary: {
        devredenBakiye,
        monthEarned,
        monthAdvance,
        aylikNetBakiye,
        yeniBakiye
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function generateWorkerStatement(db, worker_id, start_date, end_date) {
  try {
    if (new Date(start_date) > new Date(end_date)) {
      const temp = start_date;
      start_date = end_date;
      end_date = temp;
    }
    // 1. Fetch timesheets and transactions within the date range
    const timesheets = await db.all(
      `SELECT * FROM timesheets WHERE worker_id = ? AND is_deleted = 0 AND work_date >= ? AND work_date <= ? ORDER BY work_date ASC`,
      [worker_id, start_date, end_date]
    );

    const transactions = await db.all(
      `SELECT * FROM transactions WHERE worker_id = ? AND is_deleted = 0 AND trans_date >= ? AND trans_date <= ? ORDER BY trans_date ASC`,
      [worker_id, start_date, end_date]
    );

    let periodEarned = 0;
    timesheets.forEach(ts => periodEarned += ts.earned_amount);

    let periodAdvance = 0;
    transactions.forEach(tr => periodAdvance += tr.amount);

    // 2. Fetch previous balance (before start_date)
    const prevTimesheets = await db.all(
      `SELECT SUM(earned_amount) as total FROM timesheets WHERE worker_id = ? AND is_deleted = 0 AND work_date < ?`,
      [worker_id, start_date]
    );
    const prevTransactions = await db.all(
      `SELECT SUM(amount) as total FROM transactions WHERE worker_id = ? AND is_deleted = 0 AND trans_date < ?`,
      [worker_id, start_date]
    );

    const prevEarned = prevTimesheets[0]?.total || 0;
    const prevAdvance = prevTransactions[0]?.total || 0;
    const previous_balance = prevEarned - prevAdvance;

    const netPeriodBalance = periodEarned - periodAdvance;
    const new_balance = previous_balance + netPeriodBalance;

    const worker = await db.get('SELECT * FROM workers WHERE id = ?', [worker_id]);

    return {
      success: true,
      worker,
      start_date,
      end_date,
      timesheets,
      transactions,
      summary: {
        previous_balance,
        periodEarned,
        periodAdvance,
        netPeriodBalance,
        new_balance
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function generateCompanyFinancialSummary(db, year, month) {
  try {
    const monthStr = month.toString().padStart(2, '0');
    const monthPrefix = `${year}-${monthStr}`;

    // 1. Total wages earned by ALL workers in this month
    const timesheets = await db.all(
      `SELECT SUM(earned_amount) as total FROM timesheets WHERE is_deleted = 0 AND work_date LIKE ?`,
      [`${monthPrefix}%`]
    );
    const totalWageCost = timesheets[0]?.total || 0;

    // 2. Total Cash Inflows and Outflows in this month
    const cashRegister = await db.all(
      `SELECT type, SUM(amount) as total FROM cash_register WHERE is_deleted = 0 AND trans_date LIKE ? GROUP BY type`,
      [`${monthPrefix}%`]
    );

    let totalCashIn = 0;
    let totalCashOut = 0;

    cashRegister.forEach(c => {
      if (c.type === 'Nakit Girişi') totalCashIn += c.total;
      else if (c.type === 'Nakit Çıkışı') totalCashOut += c.total;
    });

    const netCashFlow = totalCashIn - totalCashOut;

    return {
      success: true,
      month: monthPrefix,
      summary: {
        totalWageCost,
        totalCashIn,
        totalCashOut,
        netCashFlow
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function generateGroupStatement(db, start_date, end_date, project_id) {
  try {
    if (new Date(start_date) > new Date(end_date)) {
      const temp = start_date;
      start_date = end_date;
      end_date = temp;
    }
    const groups = await db.all('SELECT * FROM worker_groups');
    
    let workersQuery = 'SELECT * FROM workers WHERE is_deleted = 0';
    const params = [];
    if (project_id) {
      workersQuery += ' AND project_id = ?';
      params.push(project_id);
    }
    const workers = await db.all(workersQuery, params);
    
    // We will build an array of group summaries
    const groupSummaries = [];

    // Also include workers with no group
    const allGroups = [...groups, { id: null, name: 'Grupsuz Personeller' }];

    for (const group of allGroups) {
      const groupWorkers = workers.filter(w => w.group_id === group.id);
      
      let periodEarned = 0;
      let periodAdvance = 0;
      let previousBalance = 0;
      let absoluteBalance = 0;

      for (const w of groupWorkers) {
        // 1. Fetch timesheets and transactions within the date range
        let tsQuery = `SELECT SUM(earned_amount) as total FROM timesheets WHERE worker_id = ? AND is_deleted = 0 AND work_date >= ? AND work_date <= ?`;
        let tsParams = [w.id, start_date, end_date];
        let trQuery = `SELECT SUM(amount) as total FROM transactions WHERE worker_id = ? AND is_deleted = 0 AND trans_date >= ? AND trans_date <= ?`;
        let trParams = [w.id, start_date, end_date];

        if (project_id) {
          tsQuery += ` AND (project_id = ? OR (project_id IS NULL AND ?))`;
          tsParams.push(project_id, project_id);
          trQuery += ` AND (project_id = ? OR (project_id IS NULL AND ?))`;
          trParams.push(project_id, project_id);
        }

        const timesheets = await db.all(tsQuery, tsParams);
        const transactions = await db.all(trQuery, trParams);

        periodEarned += timesheets[0]?.total || 0;
        periodAdvance += transactions[0]?.total || 0;

        // 2. Fetch previous balance (before start_date)
        let prevTsQuery = `SELECT SUM(earned_amount) as total FROM timesheets WHERE worker_id = ? AND is_deleted = 0 AND work_date < ?`;
        let prevTsParams = [w.id, start_date];
        let prevTrQuery = `SELECT SUM(amount) as total FROM transactions WHERE worker_id = ? AND is_deleted = 0 AND trans_date < ?`;
        let prevTrParams = [w.id, start_date];

        if (project_id) {
          prevTsQuery += ` AND (project_id = ? OR (project_id IS NULL AND ?))`;
          prevTsParams.push(project_id, project_id);
          prevTrQuery += ` AND (project_id = ? OR (project_id IS NULL AND ?))`;
          prevTrParams.push(project_id, project_id);
        }

        const prevTimesheets = await db.all(prevTsQuery, prevTsParams);
        const prevTransactions = await db.all(prevTrQuery, prevTrParams);

        const prevEarned = prevTimesheets[0]?.total || 0;
        const prevAdvance = prevTransactions[0]?.total || 0;
        previousBalance += (prevEarned - prevAdvance);

        // 3. Fetch absolute total balance (up to infinity/today)
        let allTsQuery = `SELECT SUM(earned_amount) as total FROM timesheets WHERE worker_id = ? AND is_deleted = 0`;
        let allTsParams = [w.id];
        let allTrQuery = `SELECT SUM(amount) as total FROM transactions WHERE worker_id = ? AND is_deleted = 0`;
        let allTrParams = [w.id];

        if (project_id) {
          allTsQuery += ` AND (project_id = ? OR (project_id IS NULL AND ?))`;
          allTsParams.push(project_id, project_id);
          allTrQuery += ` AND (project_id = ? OR (project_id IS NULL AND ?))`;
          allTrParams.push(project_id, project_id);
        }

        const allTimesheets = await db.all(allTsQuery, allTsParams);
        const allTransactions = await db.all(allTrQuery, allTrParams);
        
        const allEarned = allTimesheets[0]?.total || 0;
        const allAdvance = allTransactions[0]?.total || 0;
        absoluteBalance += (allEarned - allAdvance);
      }

      const netPeriodBalance = periodEarned - periodAdvance;
      const newBalance = previousBalance + netPeriodBalance;

      // Only add to summary if they have workers or financial activity
      if (groupWorkers.length > 0 || periodEarned > 0 || periodAdvance > 0 || absoluteBalance !== 0) {
        groupSummaries.push({
          group_id: group.id,
          group_name: group.name,
          worker_count: groupWorkers.length,
          period_earned: periodEarned,
          period_advance: periodAdvance,
          previous_balance: previousBalance,
          net_period_balance: netPeriodBalance,
          new_balance: newBalance,
          absolute_balance: absoluteBalance
        });
      }
    }

    return {
      success: true,
      start_date,
      end_date,
      groups: groupSummaries
    };

  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  generateWorkerMonthlyReport,
  generateWorkerStatement,
  generateCompanyFinancialSummary,
  generateGroupStatement
};
