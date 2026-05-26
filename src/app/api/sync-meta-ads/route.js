// src/app/api/sync-meta-ads/route.js
import { db } from "@/lib/firebaseClient";
import {
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

export async function POST(req) {
  try {
    const body = await req.json();
    const { since, until } = body;

    const token = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    // ← tambah ini
    console.log("Token exists:", !!token);
    console.log("Token preview:", token?.slice(0, 20));
    console.log("Ad Account ID:", adAccountId);

    if (!token || !adAccountId) {
      return Response.json(
        { error: "Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID in .env" },
        { status: 500 },
      );
    }

    // 🔥 Default: kemarin saja. Kalau ada since/until → sync range
    const defaultDate = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    const sinceDate = since || defaultDate;
    const untilDate = until || defaultDate;

    // 🔥 Fetch dari Meta API per hari
    const url =
      `https://graph.facebook.com/v25.0/${adAccountId}/insights` +
      `?fields=spend,date_start` +
      `&time_range={"since":"${sinceDate}","until":"${untilDate}"}` +
      `&time_increment=1` +
      `&access_token=${token}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("Meta API response:", JSON.stringify(data, null, 2)); // ← tambah ini

    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 400 });
    }

    if (!data.data || data.data.length === 0) {
      return Response.json({
        message: "No spend data for this range",
        range: { sinceDate, untilDate },
      });
    }

    // 🔥 Simpan atau update setiap hari
    const results = [];

    for (const item of data.data) {
      const date = item.date_start;
      const spend = Number(item.spend);

      // cek apakah sudah ada
      const existing = await getDocs(
        query(
          collection(db, "adSpends"),
          where("date", "==", date),
          where("platform", "==", "Meta Ads"),
        ),
      );

      if (!existing.empty) {
        // update jika sudah ada
        await updateDoc(existing.docs[0].ref, {
          adSpend: spend,
          updatedAt: Timestamp.now(),
        });
        results.push({ date, spend, action: "updated" });
      } else {
        // insert baru
        await addDoc(collection(db, "adSpends"), {
          platform: "Meta Ads",
          date,
          adSpend: spend,
          source: "auto",
          createdAt: Timestamp.fromDate(new Date(date)),
        });
        results.push({ date, spend, action: "created" });
      }
    }

    return Response.json({
      success: true,
      synced: results.length,
      results,
    });
  } catch (err) {
    console.error("Meta sync error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
