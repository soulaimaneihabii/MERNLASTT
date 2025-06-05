import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

/**
 * Get disease prediction from AI service using patient object (server-side internal usage)
 * @param {Object} patient - Patient object with all medical data
 * @returns {Object} Prediction result
 * 
 */
export const getPrediction = async (patient) => {
  try {
    const predictionData = patient.getAIPredictionData();

    console.log("Sending prediction request for patient:", patient.fullName);
    console.log("Prediction data:", predictionData);

    const response = await axios.post(`${AI_SERVICE_URL}/predict`, predictionData, {
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.AI_API_KEY || "medical-ai-key",
      },
    });

    const prediction = response.data;

    if (!prediction.success) {
      throw new Error(prediction.message || "AI service returned unsuccessful response");
    }

    const formattedResult = {
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      risk_level: prediction.risk_level,
      chronic_disease_types: prediction.chronic_disease_types || [],
      probability_scores: prediction.probability_scores || {},
      recommendations: prediction.recommendations || [],
      timestamp: prediction.timestamp || new Date().toISOString(),
    };

    console.log("AI Prediction Result:", formattedResult);
    return formattedResult;
  } catch (error) {
    console.error("Error getting AI prediction:", error.message);

    if (error.code === "ECONNREFUSED") {
      throw new Error("AI service is not available. Please try again later.");
    } else if (error.response) {
      const errorMessage = error.response.data?.message || "AI service error";
      throw new Error(`AI service error: ${errorMessage}`);
    } else if (error.request) {
      throw new Error("AI service did not respond. Please check the service status.");
    } else {
      throw new Error(`Prediction error: ${error.message}`);
    }
  }
};

/**
 * NEW → Get prediction from medicalData (React / Frontend flow)
 * @param {Object} medicalData - Medical data object from frontend
 * @returns {Object} Prediction result
 * @param {Object} medicalData - Patient medical data (raw)
 * @returns {Object} AI response
 */
export const getPredictionFromFlask = async (medicalData) => {
    try {
        // PREPARE DATA PAYLOAD
        const payload = {
            ...medicalData
        }

        // PATCH field: A1Cresult → A1C_result
        if (payload.A1Cresult !== undefined) {
            payload.A1C_result = payload.A1Cresult
            delete payload.A1Cresult
        }

        // PATCH diabetesMed → backend expects 0/1
        if (payload.diabetesMed !== undefined) {
            if (String(payload.diabetesMed).toLowerCase() === "yes") {
                payload.diabetesMed = 1
            } else {
                payload.diabetesMed = 0
            }
        }

        console.log("Sending AI prediction with data:", payload)

        const response = await axios.post(`${AI_SERVICE_URL}/predict`, payload, {
            timeout: 15000, // 15 sec timeout
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.AI_API_KEY || "medical-ai-key",
            },
        })

        if (!response.data || !response.data.success) {
            throw new Error(response.data.error || "AI service error")
        }

        console.log("AI service response:", response.data)
        return response
    } catch (error) {
        console.error("AI service error:", error.message)
        throw new Error(`AI service error: ${error.message}`)
    }
}


/**
 * Batch predictions
 */
export const getBatchPredictions = async (patients) => {
  try {
    const predictionPromises = patients.map((patient) =>
      getPrediction(patient).catch((error) => ({
        patientId: patient._id,
        error: error.message,
      }))
    );

    const results = await Promise.all(predictionPromises);
    return results;
  } catch (error) {
    console.error("Error getting batch predictions:", error);
    throw new Error("Failed to process batch predictions");
  }
};

/**
 * Validate prediction data
 */
export const validatePredictionData = (patientData) => {
  const requiredFields = [
    "time_in_hospital",
    "number_inpatient",
    "number_outpatient",
    "number_emergency",
    "num_lab_procedures",
    "num_procedures",
    "num_medications",
    "max_glu_serum",
    "A1Cresult",
    "insulin",
    "metformin",
    "diabetesMed",
    "diag_1",
    "diag_2",
    "diag_3"
  ];

  const missingFields = requiredFields.filter(
    (field) => patientData[field] === undefined || patientData[field] === null
  );

  const isValid = missingFields.length === 0;

  return {
    isValid,
    missingFields,
    message: isValid
      ? "Patient data is valid for AI prediction"
      : `Missing required fields: ${missingFields.join(", ")}`,
  };
};

/**
 * AI service health check
 */
export const getAIServiceHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    return {
      status: "healthy",
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Export all
export default {
  getPrediction,
  getPredictionFromFlask,
  getBatchPredictions,
  validatePredictionData,
  getAIServiceHealth,
};
