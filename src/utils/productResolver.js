export const resolveProduct = (lead, products) => {
  // 🔥 CASE 1: data baru
  if (lead.productId && lead.variantCode) {
    const product = products.find((p) => p.id === lead.productId);

    if (!product) {
      return { title: lead.productTitle || "Unknown Product" };
    }

    const variant = product.upsells?.find(
      (u) => u.code === lead.variantCode
    );

    if (!variant) {
      return { title: product.title };
    }

    return {
      title: `${product.title} ${variant.title}`,
      price: variant.price,
      cost: variant.cost,
    };
  }

  // 🔥 CASE 2: legacy
  return {
    title: lead.productTitle || "Unknown Product",
    price: lead.price,
    cost: lead.costProduct,
  };
};