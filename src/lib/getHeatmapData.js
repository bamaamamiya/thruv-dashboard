// lib/getHeatmapData.js
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import dayjs from "dayjs";

export async function getHeatmapData() {
  const snap = await getDocs(collection(db, "leads"));
  const result = {};

  snap.forEach((doc) => {
    const lead = doc.data();
    if (!lead.createdAt) return;

    const date = dayjs(lead.createdAt.toDate()).format("YYYY-MM-DD");
    if (!result[date]) {
      result[date] = { total: 0, complete: 0, cancel: 0, rts: 0 };
    }

    result[date].total += 1;
    result[date][lead.status] = (result[date][lead.status] || 0) + 1;
  });

  return Object.entries(result).map(([date, counts]) => ({
    date,
    count: counts.total, // untuk intensitas warna
    ...counts, // supaya nanti bisa dipakai di tooltip
  }));
}
