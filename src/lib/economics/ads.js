export function calculateAdEconomics({
  adSpend = 0,
  orders = 0,
  aov = 0,
  clicks = 0,
  grossProfitPerUnit = 0,
}) {
  const spend = Number(adSpend) || 0;
  const orderCount = Number(orders) || 0;
  const averageOrderValue = Number(aov) || 0;
  const clickCount = Number(clicks) || 0;
  const grossProfit = Number(grossProfitPerUnit) || 0;

  const revenue = averageOrderValue * orderCount;

  const cac =
    orderCount > 0
      ? spend / orderCount
      : 0;

  const roas =
    spend > 0
      ? revenue / spend
      : 0;

  const aovCacRatio =
    cac > 0
      ? averageOrderValue / cac
      : 0;

  const netProfitPerOrder =
    grossProfit - cac;

  const estimatedProfit =
    netProfitPerOrder * orderCount;

  const profitMargin =
    revenue > 0
      ? (estimatedProfit / revenue) * 100
      : 0;

  const conversionRate =
    clickCount > 0
      ? (orderCount / clickCount) * 100
      : 0;

  const cpc =
    clickCount > 0
      ? spend / clickCount
      : 0;

  return {
    adSpend: spend,
    orders: orderCount,
    aov: averageOrderValue,
    clicks: clickCount,

    revenue,

    cac,
    roas,
    aovCacRatio,

    netProfitPerOrder,
    estimatedProfit,
    profitMargin,

    conversionRate,
    cpc,
  };
}