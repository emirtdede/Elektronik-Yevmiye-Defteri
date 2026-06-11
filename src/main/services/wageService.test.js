const { calculateWage } = require('./wageService');

describe('Wage Service (Puantaj Matematiği)', () => {
  it('should correctly calculate full day wage without overtime', () => {
    const result = calculateWage({
      daily_wage: 1000,
      multiplier: 1.0
    });
    expect(result).toBe(1000);
  });

  it('should correctly calculate half day wage', () => {
    const result = calculateWage({
      daily_wage: 1000,
      multiplier: 0.5
    });
    expect(result).toBe(500);
  });

  it('should correctly calculate full day wage WITH 2 hours overtime', () => {
    // 1000 daily wage, 8 std hours = 125 per hour
    // Overtime: 125 * 1.5 * 2 = 375
    // Total: 1000 + 375 = 1375
    const result = calculateWage({
      daily_wage: 1000,
      multiplier: 1.0,
      overtime_hours: 2,
      overtime_multiplier: 1.5,
      standard_hours: 8
    });
    expect(result).toBe(1375);
  });

  it('should correctly calculate unpaid leave (0.0 multiplier)', () => {
    const result = calculateWage({
      daily_wage: 1000,
      multiplier: 0.0
    });
    expect(result).toBe(0);
  });
});
