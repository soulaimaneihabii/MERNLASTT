import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { patientsAPI } from "../../services/api";

// Fetch patients
export const fetchPatients = createAsyncThunk(
  "patients/fetchPatients",
  async ({ doctorId }, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.getPatients({ doctorId });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch patients");
    }
  }
);

// Fetch patient by ID
export const fetchPatientById = createAsyncThunk(
  "patients/fetchPatientById",
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.getPatientById(patientId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch patient details");
    }
  }
);

// Fetch current patient (for current logged in user)
export const fetchCurrentPatient = createAsyncThunk(
  "patients/fetchCurrentPatient",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.getPatients({ userId });
      if (response.data && response.data.length > 0) {
        return response.data[0];
      } else {
        throw new Error("Patient not found for this user");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch current patient for Patient role (GET /patients/me)
export const fetchCurrentPatientForPatientRole = createAsyncThunk(
  "patients/fetchCurrentPatientForPatientRole",
  async (_, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.getCurrentPatient();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Export patient data
export const exportPatientData = createAsyncThunk(
  "patients/exportPatientData",
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.exportPatientData(patientId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to export patient data");
    }
  }
);

// Create patient
export const createPatient = createAsyncThunk(
  "patients/createPatient",
  async (patientData, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.createPatient(patientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create patient");
    }
  }
);

// Update patient
export const updatePatient = createAsyncThunk(
  "patients/updatePatient",
  async ({ id, patientData }, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.updatePatient(id, patientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update patient");
    }
  }
);

// Delete patient
export const deletePatient = createAsyncThunk(
  "patients/deletePatient",
  async (patientId, { rejectWithValue }) => {
    try {
      await patientsAPI.deletePatient(patientId);
      return patientId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete patient");
    }
  }
);

const patientsSlice = createSlice({
  name: "patients",
  initialState: {
    patients: [],
    currentPatient: null,
    total: 0,
    loading: false,
    error: null,
    currentPage: 1,
    pageSize: 10,
    exportLoading: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch patients
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = action.payload || [];
        state.total = state.patients.length;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch patient by ID
      .addCase(fetchPatientById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentPatient = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPatient = action.payload;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentPatient = null;
      })

      // Fetch current patient
      .addCase(fetchCurrentPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPatient = action.payload;
      })
      .addCase(fetchCurrentPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch current patient for patient role
      .addCase(fetchCurrentPatientForPatientRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentPatientForPatientRole.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPatient = action.payload;
      })
      .addCase(fetchCurrentPatientForPatientRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Export patient data
      .addCase(exportPatientData.pending, (state) => {
        state.exportLoading = true;
      })
      .addCase(exportPatientData.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportPatientData.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.payload;
      })

      // Create patient
      .addCase(createPatient.fulfilled, (state, action) => {
        state.patients.push(action.payload);
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.error = action.payload || "Something went wrong";
      })

      // Update patient
      .addCase(updatePatient.fulfilled, (state, action) => {
  const index = state.patients.findIndex((patient) => patient._id === action.payload._id);
  if (index !== -1) {
    state.patients[index] = action.payload;
  }
})

      // Delete patient
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.patients = state.patients.filter((patient) => patient.id !== action.payload);
      })
      .addCase(deletePatient.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentPatient, setPage } = patientsSlice.actions;
export default patientsSlice.reducer;
