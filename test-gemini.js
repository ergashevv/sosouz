const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There is no direct listModels in the common SDK, but we can try a known one
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent("test");
    console.log("Success with gemini-1.5-flash:", res.response.text());
  } catch (e) {
    console.error("Failed with gemini-1.5-flash:", e.message);
  }
}

list();
