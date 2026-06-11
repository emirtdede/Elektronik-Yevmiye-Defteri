function calculateWage({ daily_wage, multiplier, overtime_hours = 0, overtime_multiplier = 1.5, standard_hours = 8 }) {
  const baseWage = daily_wage * multiplier;
  const hourlyWage = daily_wage / standard_hours;
  const overtimeWage = hourlyWage * overtime_multiplier * overtime_hours;
  
  return Number((baseWage + overtimeWage).toFixed(2));
}

module.exports = { calculateWage };
