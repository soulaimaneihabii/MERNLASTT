import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./slices/authSlice"
import usersSlice from "./slices/usersSlice"
import patientsSlice from "./slices/patientsSlice"
import predictionsSlice from "./slices/predictionsSlice"
import appointmentsSlice from "./slices/appointmentsSlice"
import analyticsSlice from "./slices/analyticsSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    users: usersSlice,
    patients: patientsSlice,
    predictions: predictionsSlice,
    appointments: appointmentsSlice,
    analytics:analyticsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})
