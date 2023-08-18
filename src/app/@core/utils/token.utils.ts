function generateOrderBookOptions(decimals: number): number[] {
  const options = [];
  let divisor = 10;

  for (let i = 0; i < decimals; i++) {
    options.push(1 / divisor);
    divisor *= 10;
  }

  return options;
}

export const MAXIMUM_PRICE_PRECISION = 6;
export const MAXIMUM_ORDER_BOOK_ROWS = 9;

// if MAXIMUM_PRICE_PRECISION = 6, then ORDER_BOOK_OPTIONS = [0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001]
export const ORDER_BOOK_OPTIONS = generateOrderBookOptions(MAXIMUM_PRICE_PRECISION);
