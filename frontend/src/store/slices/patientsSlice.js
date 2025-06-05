import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { patientsAPI } from "../../services/api"

export const fetchPatients = createAsyncThunk("patients/fetchPatients", async (params, { rejectWithValue }) => {
  try {
    const response = await patientsAPI.getPatients(params)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch patients")
  }
})

export const createPatient = createAsyncThunk("/patients/createPatient", async (patientData, { rejectWithValue }) => {
  try {
    const response = await patientsAPI.createPatient(patientData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create patient")
  }
})

export const updatePatient = createAsyncThunk(
  "patients/updatePatient",
  async ({ id, patientData }, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.updatePatient(id, patientData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update patient")
    }
  },
)

export const deletePatient = createAsyncThunk(
  "patients/deletePatient",
  async (patientId, { rejectWithValue }) => {
    try {
      await patientsAPI.deletePatient(patientId)
      return patientId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete patient")
    }
  }
)

export const exportPatientData = createAsyncThunk(
  "patients/exportPatientData",
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.exportPatientData(patientId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to export patient data")
    }
  },
)

export const fetchCurrentPatient = createAsyncThunk(
  "patients/fetchCurrentPatient",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.getPatients({ userId });
      if (response.data && response.data.length > 0) {
        return response.data[0]; // premier patient trouvé
      } else {
        throw new Error("Patient not found for this user");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
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
export const fetchPatientById = createAsyncThunk(
  "patients/fetchPatientById",
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.getPatientById(patientId)
      return response.data.data // assuming your API returns { success, data: patient }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch patient details")
    }
  }
)




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
      state.error = null
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload
    },
    setPage: (state, action) => {
      state.currentPage = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false
        // 🔥 CORRECTION IMPORTANTE : utiliser "data" et PAS "patients"
        state.patients = action.payload.data || []
        state.total = action.payload.total || 0
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.patients.push(action.payload)
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.error = action.payload || "Something went wrong"
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        const index = state.patients.findIndex((patient) => patient.id === action.payload.id)
        if (index !== -1) {
          state.patients[index] = action.payload
        }
      })
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.patients = state.patients.filter((patient) => patient.id !== action.payload)
      })
      .addCase(deletePatient.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(exportPatientData.pending, (state) => {
        state.exportLoading = true
      })
      .addCase(exportPatientData.fulfilled, (state) => {
        state.exportLoading = false
      })
      .addCase(exportPatientData.rejected, (state, action) => {
        state.exportLoading = false
        state.error = action.payload
      })
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
.addCase(fetchPatientById.pending, (state) => {
        state.loading = true
        state.error = null
        state.currentPatient = null
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.loading = false
        state.currentPatient = action.payload
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.currentPatient = null
      })
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


  },
})

export const { clearError, setCurrentPatient, setPage } = patientsSlice.actions
export default patientsSlice.reducer
