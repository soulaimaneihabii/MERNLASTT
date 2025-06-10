export async function scanDocumentWithOCR(file) {
  const formData = new FormData();
  formData.append("apikey", "K89139290688957"); // Replace with your OCR.space API key
  formData.append("file", file.originFileObj);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "true");

  if (file.type === "application/pdf") {
    formData.append("OCREngine", "2");
  }

  try {
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    console.log("OCR API response:", data);

    if (data?.IsErroredOnProcessing) {
      throw new Error(data?.ErrorMessage?.[0] || "OCR processing error");
    }

    const extractedText = data?.ParsedResults?.[0]?.ParsedText || "";

    return extractedText;
  } catch (err) {
    console.error("OCR error:", err);
    throw err;
  }
}
