export const getProductDetail = (product, variantCode) => {
  if (!product) return null;

  // default (tanpa upsell)
  if (!variantCode) {
    return {
      title: product.title,
      price: product.pricing.price,
      cost: product.pricing.cost,
    };
  }

  const upsell = product.upsells.find(
    (u) => u.code === variantCode
  );

  if (!upsell) {
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