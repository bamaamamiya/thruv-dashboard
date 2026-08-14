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
      `?fields=ad_id,ad_name,campaign_name,adset_name,spend,clicks,date_start` +
      `&level=ad` +
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
      const adId = item.ad_id;
      const spend = Number(item.spend || 0);

      if (!adId) continue;

      // Cari berdasarkan DATE + AD ID
      const existing = await getDocs(
        query(
          collection(db, "adSpends"),
          where("date", "==", date),
          where("metaAdId", "==", adId),
        ),
      );

      const adData = {
        platform: "Meta Ads",

        date,

        // Meta identification
        metaAdId: adId,
        adName: item.ad_name || "",

        campaignName: item.campaign_name || "",
        adsetName: item.adset_name || "",

        // Economics
        adSpend: spend,

        // nanti bisa kita isi
        clicks: Number(item.clicks || 0),

        source: "meta",
        updatedAt: Timestamp.now(),
      };

      if (!existing.empty) {
        await updateDoc(existing.docs[0].ref, adData);

        results.push({
          date,
          adId,
          adName: item.ad_name,
          spend,
          action: "updated",
        });
      } else {
        await addDoc(collection(db, "adSpends"), {
          ...adData,
          createdAt: Timestamp.fromDate(new Date(date)),
        });

        results.push({
          date,
          adId,
          adName: item.ad_name,
          spend,
          action: "created",
        });
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
