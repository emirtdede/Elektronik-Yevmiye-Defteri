export const isValidTCKN = (tc) => {
  // If empty or falsy, we don't validate because it's optional
  if (!tc) return true;

  // Ensure it's a string, precisely 11 characters long, and consists only of digits
  if (typeof tc !== 'string' || !/^[1-9]\d{10}$/.test(tc)) {
    return false;
  }

  // TC Algorithm
  const digits = tc.split('').map(Number);
  
  // 1st Rule: Sum of 1st, 3rd, 5th, 7th, 9th digits multiplied by 7
  // minus sum of 2nd, 4th, 6th, 8th digits.
  // The mod 10 of this result should give the 10th digit.
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  
  const tenthDigit = ((sumOdd * 7) - sumEven) % 10;
  
  if (tenthDigit !== digits[9]) {
    return false;
  }
  
  // 2nd Rule: Sum of first 10 digits mod 10 should give the 11th digit.
  const sumFirstTen = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  const eleventhDigit = sumFirstTen % 10;
  
  if (eleventhDigit !== digits[10]) {
    return false;
  }
  
  return true;
};
