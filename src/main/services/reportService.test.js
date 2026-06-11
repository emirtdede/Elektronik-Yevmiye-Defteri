const { setupTestDB } = require('./testDb');
const { generateWorkerMonthlyReport, generateCompanyFinancialSummary } = require('./reportService');

describe('Reporting Service (Raporlama V3 TDD)', () => {
  let db;

  beforeAll(async () => {
    db = await setupTestDB();

    // 1. Seed Worker
    await db.run(`INSERT INTO workers (id, full_name, daily_wage) VALUES (1, 'Veli Rapor', 1000)`);

    // 2. Seed PREVIOUS month data (August 2023)
    // Timesheet in August: Earned 3000
    await db.run(`INSERT INTO timesheets (worker_id, work_date, applied_wage, applied_multiplier, earned_amount) VALUES (1, '2023-08-15', 1000, 1.0, 3000)`);
    // Advance in August: 1000
    await db.run(`INSERT INTO transactions (worker_id, trans_date, trans_type, amount) VALUES (1, '2023-08-20', 'Avans', 1000)`);
    // Expected Devreden Bakiye into September: 3000 - 1000 = +2000 ₺

    // 3. Seed CURRENT month data (September 2023)
    // Timesheet in September: Earned 2500
    await db.run(`INSERT INTO timesheets (worker_id, work_date, applied_wage, applied_multiplier, earned_amount) VALUES (1, '2023-09-05', 1000, 1.0, 2500)`);
    // Advance in September: 1500
    await db.run(`INSERT INTO transactions (worker_id, trans_date, trans_type, amount) VALUES (1, '2023-09-10', 'Avans', 1500)`);
    
    // 4. Seed Cash Register data for September 2023
    await db.run(`INSERT INTO cash_register (trans_date, type, amount, description) VALUES ('2023-09-01', 'Nakit Girişi', 10000, 'Sermaye')`);
    await db.run(`INSERT INTO cash_register (trans_date, type, amount, description) VALUES ('2023-09-10', 'Nakit Çıkışı', 1500, 'Veli Avans')`);
    await db.run(`INSERT INTO cash_register (trans_date, type, amount, description) VALUES ('2023-09-12', 'Nakit Çıkışı', 500, 'Fatura')`);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should correctly calculate Worker Monthly Report with Devreden Bakiye (Rollover Balance)', async () => {
    // Generate report for September 2023
    const report = await generateWorkerMonthlyReport(db, 1, 2023, 9);
    
    expect(report.success).toBe(true);
    expect(report.month).toBe('2023-09');
    
    // Timesheets and Transactions in Sept should be 1 each
    expect(report.timesheets.length).toBe(1);
    expect(report.transactions.length).toBe(1);

    // Devreden Bakiye check: Aug earned(3000) - Aug adv(1000) = 2000
    expect(report.summary.devredenBakiye).toBe(2000);
    
    // Month check: Sept earned(2500), Sept adv(1500)
    expect(report.summary.monthEarned).toBe(2500);
    expect(report.summary.monthAdvance).toBe(1500);
    expect(report.summary.aylikNetBakiye).toBe(1000); // 2500 - 1500
    
    // Total New Balance: 2000 + 1000 = 3000
    expect(report.summary.yeniBakiye).toBe(3000);
  });

  it('should correctly summarize Company Financials for the month', async () => {
    const report = await generateCompanyFinancialSummary(db, 2023, 9);

    expect(report.success).toBe(true);
    expect(report.month).toBe('2023-09');

    // Total Wage Cost in Sept: 2500 (Veli's timesheet)
    expect(report.summary.totalWageCost).toBe(2500);

    // Cash In: 10000
    expect(report.summary.totalCashIn).toBe(10000);

    // Cash Out: 1500 + 500 = 2000
    expect(report.summary.totalCashOut).toBe(2000);

    // Net Cash Flow: 10000 - 2000 = 8000
    expect(report.summary.netCashFlow).toBe(8000);
  });
});
