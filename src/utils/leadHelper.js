// utils/leadHelper.js
export const getLeadDisplay = (lead, products) => {
  // 🧓 OLD DATA
  if (!lead.productId) {
    return {
      title: lead.productTitle || "-",
      price: lead.price || 0,
      cost: lead.costProduct || 0,
    };
  }

  // 🆕 NEW DATA
  const product = products.find((p) => p.id === lead.productId);

  if (!product) {
    return {
      title: "Unknown Product",
      price: 0,
      cost: 0,
    };
  }

  const upsell = product.upsells?.find(
    (u) => u.code === lead.variant
  );

  // kalau tidak ambil upsell
  if (!lead.variant || !upsell) {
    return {
      title: product.title,
      price: product.pricing.price,
      cost: product.pricing.cost,
    };
  }

  return {
    title: `${product.title} + ${upsell.title}`,
    price: upsell.price,
    cost: upsell.cost,
  };
};