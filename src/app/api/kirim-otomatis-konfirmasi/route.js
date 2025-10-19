// app/api/kirim-otomatis-konfirmasi/route.js
import { collection, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

const sendMessage = async (number, message) => {
  const response = await fetch("http://localhost:8000/send-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number, message }),
  });
  return response.json();
};

const formatPesan = (lead) => {
  const ongkirNormal = 40000;
  const total = lead.price + lead.ongkir;
  return `
Terima kasih sudah melakukan pemesanan 🙏  
Berikut detail pesanan Kakak:

Nama Produk: ${lead.productTitle}  
Harga Produk: ${lead.price / 1000}rb   
Ongkir: ~${ongkirNormal / 1000}rb~ ${lead.ongkir / 1000}rb  
Total Pembayaran: ${total / 1000}rb

Nama: ${lead.name}  
Alamat: ${lead.address}

Apakah alamat yang Kakak berikan sudah benar?  
Kami akan segera proses pesanan Kakak jika alamatnya sudah sesuai ya 🙏`;
};

export async function GET() {
  const snapshot = await getDocs(collection(db, "leads"));
  const leads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const now = Timestamp.now();
  const threeMinutesAgo = new Date(now.toDate().getTime() - 3 * 60 * 1000);

  const eligibleLeads = leads.filter((lead) => {
    const created = lead.createdAt?.toDate?.() || new Date();
    return lead.confirmation === "belum" && created <= threeMinutesAgo;
  });

  if (eligibleLeads.length === 0) {
    return new Response(JSON.stringify({ message: "No eligible leads yet" }), {
      status: 200,
    });
  }

  for (const lead of eligibleLeads) {
    // ✅ Versi normal: delay acak 10–30 detik
    // const randomDelay = Math.floor(Math.random() * (30000 - 10000)) + 10000;
    // console.log(`⏳ Menunggu ${randomDelay / 1000}s sebelum kirim ke ${lead.name}`);
    // await new Promise((resolve) => setTimeout(resolve, randomDelay));

    // ⚡ Versi cepat untuk testing
    console.log(`⚡ Testing fast send ke ${lead.name}`);
    
    try {
      const message = formatPesan(lead);
      await sendMessage(lead.whatsapp, message);
      await updateDoc(doc(db, "leads", lead.id), { confirmation: "sudah" });
      console.log(`✅ Pesan terkirim ke ${lead.name}`);
    } catch (err) {
      console.error(`❌ Gagal kirim ke ${lead.name}:`, err);
    }
  }

  return new Response(
    JSON.stringify({ message: "✅ Automation messages sent successfully (fast send)" }),
    { status: 200 }
  );
}
