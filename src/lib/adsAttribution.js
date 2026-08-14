export function calculateProductAttribution({
  ads = [],
  leads = [],
}) {
  const map = {};

  const createProduct = (productId) => {
    if (!map[productId]) {
      map[productId] = {
        productId,
        adSpend: 0,
        orders: 0,
        revenue: 0,
        productCost: 0,
        grossProfit: 0,
      };
    }

    return map[productId];
  };

  // ========================================
  // 1. AD SPEND
  // ========================================

  ads.forEach((ad) => {
    if (!ad.productId) return;

    const item = createProduct(ad.productId);

    item.adSpend += Number(ad.adSpend || 0);
  });

  // ========================================
  // 2. ORDERS
  // ========================================

  leads.forEach((lead) => {
    if (!lead.productId) return;

    const item = createProduct(lead.productId);

    // IMPORTANT:
    // Ambil price + costProduct dari SNAPSHOT order.
    // Jangan ambil ulang dari product DB.

    const price = Number(lead.price || 0);
    const cost = Number(lead.costProduct || 0);

    item.orders += 1;

    item.revenue += price;

    item.productCost += cost;

    item.grossProfit += price - cost;
  });

  // ========================================
  // 3. CALCULATE METRICS
  // ========================================

  return Object.values(map).map((item) => {
    const cac =
      item.orders > 0
        ? item.adSpend / item.orders
        : null;

    const aov =
      item.orders > 0
        ? item.revenue / item.orders
        : 0;

    const grossProfitPerOrder =
      item.orders > 0
        ? item.grossProfit / item.orders
        : 0;

    const ltgpToCac =
      cac !== null && cac > 0
        ? grossProfitPerOrder / cac
        : null;

    const contributionAfterAds =
      item.grossProfit - item.adSpend;

    const contributionPerOrder =
      item.orders > 0
        ? contributionAfterAds / item.orders
        : 0;

    const grossMargin =
      item.revenue > 0
        ? (item.grossProfit / item.revenue) * 100
        : 0;

    return {
      ...item,

      cac,
      aov,
      grossProfitPerOrder,

      ltgpToCac,

      contributionAfterAds,
      contributionPerOrder,

      grossMargin,
    };
  });
}