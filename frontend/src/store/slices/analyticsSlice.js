import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { analyticsAPI } from "../../services/api"

export const fetchDoctorDashboardStats = createAsyncThunk(
  "analytics/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
     const res = await analyticsAPI.getDashboardStats();  // Uses your configured api instance

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
  }
);
export const fetchDoctorDashboardStatse = createAsyncThunk(
  "analytics/fetchDoctorDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsAPI.getDoctorDashboardStats();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    dashboardStats: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        console.log("✅ analytics Stats Payload:", action.payload); 
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDoctorDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
        .addCase(fetchDoctorDashboardStatse.pending, state => {
        state.loading = true;
      })
      .addCase(fetchDoctorDashboardStatse.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDoctorDashboardStatse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default analyticsSlice.reducer;
