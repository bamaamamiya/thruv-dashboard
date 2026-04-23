import {
  format,
  isWithinInterval,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
} from "date-fns";

// 🔹 Helper aman buat ambil Date dari createdAt
const getCreatedAtDate = (lead) => {
  if (!lead.createdAt) return null;
  if (lead.createdAt.toDate) return lead.createdAt.toDate(); // Firestore Timestamp asli
  if (lead.createdAt.seconds) return new Date(lead.createdAt.seconds * 1000); // object {seconds, nanos}
  if (typeof lead.createdAt === "string" || typeof lead.createdAt === "number")
    return new Date(lead.createdAt);
  return null;
};

// Filter ads berdasarkan rentang tanggal
export const filterAdsByDate = (ads, start, end) => {
  return ads.filter((ad) => {
    if (!ad.date) return false;
    const adDate = new Date(ad.date);
    return adDate >= start && adDate <= end;
  });
};

// Hitung total Ad Spend
export const calculateTotalAdSpend = (ads) => {
  return ads.reduce((sum, ad) => sum + (ad.adSpend || 0), 0);
};

// Filter leads berdasarkan rentang tanggal
export const filterLeadsByDate = (leads, start, end) => {
  return leads.filter((lead) => {
    const createdAt = getCreatedAtDate(lead);
    if (!createdAt) return false;
    return isWithinInterval(createdAt, { start, end });
  });
};

// 🧮 Hitung ringkasan data leads + metrik lanjutan
export const calculateSummary = (
  leads,
  totalAdSpend = 0,
  totalCustomers = 0,
  monthlyExpenses = 0
) => {
  // 🔹 STATUS GROUPING (single source of truth)
  const completed = leads.filter((l) => l.status === "complete");
  const pending = leads.filter((l) => l.status === "pending");
  const returns = leads.filter((l) => l.status === "rts");

  const totalOrders = leads.length;

  // 🔹 SAFE NUMBER HELPER
  const safe = (num) => Number(num || 0);

  // 🔹 DATA DASAR
  const totalSales = completed.reduce((s, l) => s + safe(l.price), 0);
  const totalPendingValue = pending.reduce((s, l) => s + safe(l.price), 0);

  const totalCost = completed.reduce(
    (s, l) => s + safe(l.costProduct),
    0
  );
  const pendingCost = pending.reduce(
    (s, l) => s + safe(l.costProduct),
    0
  );

  const totalReturnToSenderCost = returns.reduce(
    (s, l) => s + safe(l.rts),
    0
  );

  // 🔹 PROFIT
  const grossProfit = totalSales - totalCost;

  const netProfitReal =
    totalSales -
    totalCost -
    totalAdSpend -
    totalReturnToSenderCost -
    monthlyExpenses;

  const netProfitProjected =
    totalSales +
    totalPendingValue -
    totalCost -
    pendingCost -
    totalAdSpend -
    totalReturnToSenderCost -
    monthlyExpenses;

  // 🔹 PENDING PROFIT
  const pendingProfit = totalPendingValue - pendingCost;
  const netPendingProfit =
    pendingProfit - monthlyExpenses * 0.1;

  // 🔹 METRICS
  const avgOrderValue =
    completed.length > 0 ? totalSales / completed.length : 0;

  // ❗ CAC harus pakai COMPLETE (biar realistis)
  const cac =
    completed.length > 0
      ? totalAdSpend / completed.length
      : 0;

  const ltgpToCac =
    cac > 0 ? Number((avgOrderValue / cac).toFixed(2)) : 0;

  const rtsOrders = returns.length;

  const rtsPercentage =
    totalOrders > 0
      ? Number(((rtsOrders / totalOrders) * 100).toFixed(2))
      : 0;

  // 🔹 RATIOS
  const grossMargin =
    totalSales > 0
      ? Math.round((grossProfit / totalSales) * 100)
      : 0;

  const profitMargin =
    totalSales > 0
      ? Math.round((netProfitReal / totalSales) * 100)
      : 0;

  const conversionRate =
    totalOrders > 0
      ? Math.round((completed.length / totalOrders) * 100)
      : 0;

  return {
    totalOrders,
    completedOrders: completed.length,
    pendingOrders: pending.length,

    totalSales,
    totalPendingValue,

    totalCost,
    pendingCost,

    totalAdSpend,
    totalReturnToSenderCost,

    grossProfit,
    netProfitReal,
    netProfitProjected,

    pendingProfit,
    netPendingProfit,

    avgOrderValue,
    cac,
    ltgpToCac,

    grossMargin,
    profitMargin,
    conversionRate,

    rtsOrders,
    rtsPercentage,
  };
};

// Buat data chart berdasarkan filter waktu (per jam, per hari, per bulan)
export const generateChartData = (leads, selectedFilter, start, end) => {
  const getRevenue = (lead) => lead.price || 0;

  // TODAY / YESTERDAY
  if (selectedFilter === "today" || selectedFilter === "yesterday") {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const label = `${hour.toString().padStart(2, "0")}:00`;

      const complete = leads
        .filter((lead) => {
          const time = getCreatedAtDate(lead);
          return time && time.getHours() === hour && lead.status === "complete";
        })
        .reduce((sum, lead) => sum + getRevenue(lead), 0);

      const pending = leads
        .filter((lead) => {
          const time = getCreatedAtDate(lead);
          return time && time.getHours() === hour && lead.status === "pending";
        })
        .reduce((sum, lead) => sum + getRevenue(lead), 0);

      return { label, complete, pending };
    });
  }

  // WEEK
  if (selectedFilter === "week") {
    const map = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = format(new Date(d), "dd MMM");
      map[key] = { complete: 0, pending: 0 };
    }

    leads.forEach((lead) => {
      const time = getCreatedAtDate(lead);
      if (!time) return;
      const key = format(time, "dd MMM");

      if (map[key]) {
        if (lead.status === "complete") map[key].complete += getRevenue(lead);
        else if (lead.status === "pending")
          map[key].pending += getRevenue(lead);
      }
    });

    return Object.entries(map).map(([label, value]) => ({ label, ...value }));
  }

  // LAST WEEK
  if (selectedFilter === "lastWeek") {
    const lastWeekDate = subWeeks(new Date(), 1);
    const startOfLastWeek = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
    const endOfLastWeek = endOfWeek(lastWeekDate, { weekStartsOn: 1 });

    const map = {};
    for (
      let dt = new Date(startOfLastWeek);
      dt <= endOfLastWeek;
      dt.setDate(dt.getDate() + 1)
    ) {
      const key = format(new Date(dt), "dd MMM");
      map[key] = { complete: 0, pending: 0 };
    }

    leads.forEach((lead) => {
      const time = getCreatedAtDate(lead);
      if (!time) return;
      if (
        isWithinInterval(time, { start: startOfLastWeek, end: endOfLastWeek })
      ) {
        const key = format(time, "dd MMM");
        if (map[key]) {
          if (lead.status === "complete") map[key].complete += getRevenue(lead);
          else if (lead.status === "pending")
            map[key].pending += getRevenue(lead);
        }
      }
    });

    return Object.entries(map).map(([label, value]) => ({ label, ...value }));
  }

  // MONTH / LAST MONTH (group per day, biar mirip tampilan week)
  if (selectedFilter === "month" || selectedFilter === "lastMonth") {
    const map = {};
    const endDate = endOfMonth(start);

    for (let d = new Date(start); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = format(new Date(d), "dd MMM");
      map[key] = { complete: 0, pending: 0 };
    }

    leads.forEach((lead) => {
      const time = getCreatedAtDate(lead);
      if (!time) return;
      const key = format(time, "dd MMM");

      if (map[key]) {
        if (lead.status === "complete") map[key].complete += getRevenue(lead);
        else if (lead.status === "pending")
          map[key].pending += getRevenue(lead);
      }
    });

    return Object.entries(map).map(([label, value]) => ({
      label,
      ...value,
    }));
  }

  // ALL TIME (group per month)
  if (selectedFilter === "allTime") {
    const map = {};

    leads.forEach((lead) => {
      const time = getCreatedAtDate(lead);
      if (!time) return;
      const key = format(time, "yyyy-MM"); // pakai format aman untuk sort

      if (!map[key]) map[key] = { complete: 0, pending: 0 };
      if (lead.status === "complete") map[key].complete += getRevenue(lead);
      else if (lead.status === "pending") map[key].pending += getRevenue(lead);
    });

    // Urutkan berdasarkan tanggal
    const sortedKeys = Object.keys(map).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    // (Opsional) tampilkan hanya 12 bulan terakhir biar nggak terlalu padat
    const recentKeys = sortedKeys.slice(-12);

    return recentKeys.map((key) => ({
      label: format(new Date(key + "-01"), "MMM yyyy"), // tampilkan nama bulan
      ...map[key],
    }));
  }

  // CUSTOM
  if (selectedFilter === "custom") {
    const dayDiff = differenceInDays(end, start);

    if (dayDiff <= 31) {
      const map = {};
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = format(new Date(d), "dd MMM");
        map[key] = { complete: 0, pending: 0 };
      }

      leads.forEach((lead) => {
        const time = getCreatedAtDate(lead);
        if (!time) return;
        const key = format(time, "dd MMM");

        if (map[key]) {
          if (lead.status === "complete") map[key].complete += getRevenue(lead);
          else if (lead.status === "pending")
            map[key].pending += getRevenue(lead);
        }
      });

      return Object.entries(map).map(([label, value]) => ({ label, ...value }));
    }

    // Per minggu jika > 31 hari
    const weekMap = {};

    leads.forEach((lead) => {
      const time = getCreatedAtDate(lead);
      if (!time) return;
      if (!isWithinInterval(time, { start, end })) return;

      const startWeek = startOfWeek(time, { weekStartsOn: 1 });
      const key = format(startWeek, "'Week of' dd MMM");

      if (!weekMap[key]) weekMap[key] = { complete: 0, pending: 0 };

      if (lead.status === "complete") weekMap[key].complete += getRevenue(lead);
      else if (lead.status === "pending")
        weekMap[key].pending += getRevenue(lead);
    });

    return Object.entries(weekMap).map(([label, value]) => ({
      label,
      ...value,
    }));
  }

  return [];
};
