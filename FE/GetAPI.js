// GetAPI.js
export async function sendMessage(text) {
  try {
    const res = await fetch("http://localhost:3000/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();
    return data.reply;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}