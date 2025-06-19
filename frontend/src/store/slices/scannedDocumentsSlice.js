// store/slices/scannedDocumentsSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// Async Thunk: Extract and store scanned medical data
export const extractScannedData = createAsyncThunk(
  "scannedDocuments/extract",
  async ({ patientId, file, fileTypeCategory, doctorId, token }, thunkAPI) => {
    try {
      const { uid, name, type, ocrText } = file;

      console.log("📤 [Thunk] Sending extract request for:", {
        patientId,
        fileUid: uid,
        fileName: name,
        fileTypeCategory,
        ocrTextPreview: ocrText?.substring(0, 50), // For debug
        doctorId,
      });

      const response = await api.post(
        "/documents/extract-fields",
        {
          patientId,
          fileUid: uid,
          fileName: name,
          fileTypeCategory,
          ocrText,
          doctorId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ [Thunk] Extract success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [Thunk] Extract failed:", error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const fetchScannedDocuments = createAsyncThunk(
  "scannedDocuments/fetchByPatient",
  async (patientId, thunkAPI) => {
    try {
      const response = await api.get(`/documents/by-patient/${patientId}`); // ✅ FIXED endpoint
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch scanned documents");
    }
  }
);

// Slice definition
const scannedDocumentsSlice = createSlice({
  name: "scannedDocuments",
  initialState: {
    extracted: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(extractScannedData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(extractScannedData.fulfilled, (state, action) => {
        state.loading = false;
        state.extracted.push(action.payload); // Store extracted result
      })
      .addCase(extractScannedData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Extraction failed";
      })
       .addCase(fetchScannedDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScannedDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchScannedDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default scannedDocumentsSlice.reducer;
