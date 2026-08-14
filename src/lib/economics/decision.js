export function calculateEconomicsDecision({
  sellingPrice = 0,
  contributionProfit = 0,
  targetNetProfitMargin = 22.5,
  actualCAC = null,
}) {
  const price = Number(sellingPrice) || 0;

  const contribution = Number(contributionProfit) || 0;

  const targetMargin = Number(targetNetProfitMargin) || 0;

  // =========================
  // TARGET NET PROFIT
  // =========================
  // Target net profit = % dari selling price
  const targetNetProfit = price > 0 ? price * (targetMargin / 100) : 0;

  // =========================
  // SCALE CAC
  // =========================
  // CAC maksimum agar target net margin
  // masih tercapai
  const scaleCAC = Math.max(0, contribution - targetNetProfit);

  // =========================
  // BREAK EVEN CAC
  // =========================
  // CAC maksimum sebelum profit = 0
  const breakEvenCAC = Math.max(0, contribution);

  // =========================
  // DECISION
  // =========================
  let status = "NO DATA";

  if (actualCAC !== null && actualCAC !== undefined) {
    const cac = Number(actualCAC) || 0;

    if (cac <= scaleCAC) {
      status = "SCALE";
    } else if (cac < breakEvenCAC) {
      status = "WATCH";
    } else {
      status = "STOP";
    }
  }

  return {
    sellingPrice: price,

    contributionProfit: contribution,

    targetNetProfitMargin: targetMargin,
    targetNetProfit,

    scaleCAC,
    breakEvenCAC,

    status,
  };
}
