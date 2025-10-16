export async function sendMessage(phone, message) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_WA_API}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, message }),
  });
  return await res.json();
}
