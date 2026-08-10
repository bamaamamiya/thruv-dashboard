export function calculateProductEconomics(price, cost) {
  const sellingPrice = Number(price) || 0;
  const productCost = Number(cost) || 0;

  const contributionProfit =
    sellingPrice - productCost;

  const contributionMargin =
    sellingPrice > 0
      ? (contributionProfit / sellingPrice) * 100
      : 0;

  const breakEvenCAC =
    contributionProfit;

  return {
    sellingPrice,
    productCost,

    contributionProfit,
    contributionMargin,

    breakEvenCAC,
    maxProfitableCAC: breakEvenCAC,
  };
}

export function calculateCACResult(
  price,
  cost,
  cac,
) {
  const economics = calculateProductEconomics(
    price,
    cost,
  );

  const actualCAC = Number(cac) || 0;

  const profitAfterCAC =
    economics.contributionProfit - actualCAC;

  const profitMargin =
    economics.sellingPrice > 0
      ? (profitAfterCAC /
          economics.sellingPrice) *
        100
      : 0;

  let status = "profitable";

  if (actualCAC >= economics.breakEvenCAC) {
    status =
      actualCAC === economics.breakEvenCAC
        ? "break-even"
        : "loss";
  }

  return {
    ...economics,
    actualCAC,
    profitAfterCAC,
    profitMargin,
    status,
  };
}