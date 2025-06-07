import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { predictionsAPI } from "../../services/api";

export const createPrediction = createAsyncThunk(
  "predictions/createPrediction",
  async ({ patientId, medicalData, doctorId }, { rejectWithValue }) => {
    try {
      console.log("API Request: POST /predictions", {
        patientId,
        medicalData,
        doctorId,
      });

      // ✅ CORRECTION ICI — utiliser predictionsAPI.createPrediction()
      const response = await predictionsAPI.createPrediction({
        patientId,
        medicalData,
        doctorId,
      });

      console.log("API Response:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("API Error:", error.response?.data?.error || error.message);
      return rejectWithValue(
        error.response?.data?.error || "Failed to create prediction"
      );
    }
  }
);

export const fetchPredictions = createAsyncThunk(
  "predictions/fetchPredictions",
  async ({ doctorId }, { rejectWithValue }) => {
    try {
      const response = await predictionsAPI.getPredictions({ doctorId }); // ✅ utiliser getPredictions()
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch predictions"
      );
    }
  }
);

export const fetchPredictionHistory = createAsyncThunk(
  "predictions/fetchPredictionHistory",
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await predictionsAPI.getPredictionHistory(patientId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch prediction history"
      );
    }
  }
);

const predictionsSlice = createSlice({
  name: "predictions",
  initialState: {
    predictions: [],
    predictionHistory: [],
    currentPrediction: null,
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    pageSize: 10,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPrediction: (state, action) => {
      state.currentPrediction = action.payload;
    },
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    clearPredictionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPredictions
      .addCase(fetchPredictions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPredictions.fulfilled, (state, action) => {
        state.loading = false;
        state.predictions = action.payload;
      })
      .addCase(fetchPredictions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createPrediction
      .addCase(createPrediction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPrediction.fulfilled, (state, action) => {
        state.loading = false;
        // prepend new prediction
        state.predictions = [action.payload, ...state.predictions];
      })
      .addCase(createPrediction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchPredictionHistory
      .addCase(fetchPredictionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPredictionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.predictionHistory = action.payload;
      })
      .addCase(fetchPredictionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentPrediction, setPage } =
  predictionsSlice.actions;
export default predictionsSlice.reducer;
