import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { appointmentsAPI } from "../../services/api"

export const fetchAppointments = createAsyncThunk(
  "appointments/fetchAppointments",
  async (params, { rejectWithValue }) => {
    try {
      const response = await appointmentsAPI.getAppointments(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch appointments")
    }
  },
)

export const createAppointment = createAsyncThunk(
  "appointments/createAppointment",
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await appointmentsAPI.createAppointment(appointmentData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create appointment")
    }
  },
)

export const updateAppointment = createAsyncThunk(
  "appointments/updateAppointment",
  async ({ id, appointmentData }, { rejectWithValue }) => {
    try {
      const response = await appointmentsAPI.updateAppointment(id, appointmentData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update appointment")
    }
  },
)

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState: {
    appointments: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false
        state.appointments = action.payload.appointments
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.appointments.push(action.payload)
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex((app) => app.id === action.payload.id)
        if (index !== -1) {
          state.appointments[index] = action.payload
        }
      })
  },
})

export const { clearError } = appointmentsSlice.actions
export default appointmentsSlice.reducer
