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
  async ({ doctorId, page = 1, limit = 1000 }, { rejectWithValue }) => {
    try {
      const response = await predictionsAPI.getPredictions({ doctorId, page, limit });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch predictions"
      );
    }
  }
);
//fetchprediction slice
export const fetchPredictionStats = createAsyncThunk(
  "predictions/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await predictionsAPI.getStats();
      console.log("API Stats Response:", res.data); // 👈 Add this line
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Error fetching prediction stats");
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
  stats: {}, // ✅ must be here
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

    .addCase(createPrediction.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createPrediction.fulfilled, (state, action) => {
      state.loading = false;
      state.predictions = [action.payload, ...state.predictions];
    })
    .addCase(createPrediction.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    .addCase(fetchPredictionHistory.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchPredictionHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.predictionHistory = action.payload.data;
    })
    .addCase(fetchPredictionHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    // ✅ FIX HERE: properly handle fetchPredictionStats
    .addCase(fetchPredictionStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
 .addCase(fetchPredictionStats.fulfilled, (state, action) => {
  state.loading = false;
  console.log("✅ Prediction Stats Payload:", action.payload); // <-- Add this!
  state.stats = action.payload || {};
})
    .addCase(fetchPredictionStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
},
});

export const { clearError, setCurrentPrediction, setPage } = predictionsSlice.actions;

export default predictionsSlice.reducer;

