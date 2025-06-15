import axios from "axios";

export const getAISuggestions = async (patientId, token) => {
  const response = await axios.post(
    "http://localhost:3001/api/ai/suggest", // ← NodeJS endpoint
    { patientId },
    {
      headers: {
        Authorization: `Bearer ${token}`, // If needed
      },
    }
  );

  if (response.data?.success) {
    return response.data;
  } else {
    throw new Error(response.data?.error || "AI suggestion failed");
  }
};
