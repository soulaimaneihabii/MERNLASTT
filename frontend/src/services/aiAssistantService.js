// services/aiAssistantService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // or your Flask port

export const getAISuggestions = async (patientId) => {
  console.log("Calling real AI backend for patient:", patientId);

  const response = await axios.post(`${API_BASE_URL}/ai/assist`, {
    patient_id: patientId,
  });

  if (response.data?.success) {
    return response.data.data;
  } else {
    throw new Error("AI suggestion failed");
  }
};
