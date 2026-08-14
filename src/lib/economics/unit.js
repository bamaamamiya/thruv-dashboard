export function calculateUnitEconomics({
  price = 0,
  cost = 0,
  shippingCost = 0,
  paymentFeePercent = 0,
  paymentFeeFixed = 0,
}) {
  const sellingPrice = Number(price) || 0;
  const cogs = Number(cost) || 0;
  const shipping = Number(shippingCost) || 0;
  const feePercent = Number(paymentFeePercent) || 0;
  const feeFixed = Number(paymentFeeFixed) || 0;

  // Total biaya produk sebelum payment fee
  const totalProductCost = cogs + shipping;

  // Payment processing fee
  const paymentFeePerOrder = sellingPrice * feePercent + feeFixed;

  // Profit setelah semua direct cost,
  // tetapi sebelum advertising
  const grossProfitPerUnit =
    sellingPrice - totalProductCost - paymentFeePerOrder;

  const grossMargin =
    sellingPrice > 0 ? (grossProfitPerUnit / sellingPrice) * 100 : 0;

  // CAC maksimum sebelum profit = 0
  const breakEvenCAC = Math.max(0, grossProfitPerUnit);

  // ROAS minimum agar BE
  const breakEvenROAS = breakEvenCAC > 0 ? sellingPrice / breakEvenCAC : 0;

  return {
    sellingPrice,
    cogs,
    shippingCost: shipping,

    totalProductCost,

    paymentFeePercent: feePercent,
    paymentFeeFixed: feeFixed,
    paymentFeePerOrder,

    grossProfitPerUnit,
    grossMargin,

    breakEvenCAC,
    breakEvenROAS,
  };
}
