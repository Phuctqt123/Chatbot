import { GoogleGenAI } from "@google/genai";
export async function processText(text) {
  try {
    const ai = new GoogleGenAI({
      apiKey: "AIzaSyB3WqSTnwskAF16IMcTAFT0XNvYDFQyCZY", 
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: "Bạn tên là DemoAI, bạn là trợ lý thông minh cho người Việt",
        },
    });

    // ✅ Lấy text từ candidate đầu tiên
    const reply = response.candidates[0].content.parts[0].text;

    return reply;
  } catch (err) {
    console.error("Lỗi từ GoogleGenAI:", err);
    throw err;
  }
}

