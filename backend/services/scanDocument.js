import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function scanDocument(filePath) {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));
  formData.append("language", "eng");

  const API_KEY = "YOUR_API_KEY";

  try {
    const response = await axios.post("https://api.ocr.space/parse/image", formData, {
      headers: {
        apikey: API_KEY,
        ...formData.getHeaders(),
      },
    });

    const parsedText = response.data?.ParsedResults?.[0]?.ParsedText || "";

    console.log("✅ Extracted:", parsedText.substring(0, 200));

    return parsedText;
  } catch (error) {
    console.error("❌ OCR Error:", error.response?.data || error.message);
    throw new Error("Failed to scan document");
  }
}
