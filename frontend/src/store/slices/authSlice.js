import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { authAPI } from "../../services/api"

// Async thunks
export const loginUser = createAsyncThunk("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    console.log("🔐 Starting login process...")
    const response = await authAPI.login(credentials)
    console.log("✅ Login API response:", response.data)

    // Handle your backend's response format
    let token, user

    if (response.data.success && response.data.token) {
      token = response.data.token

      // Check if user data is in the 'data' field
      if (response.data.data) {
        user = response.data.data
      } else if (response.data.user) {
        user = response.data.user
      } else {
        throw new Error("No user data found in response")
      }
    } else {
      throw new Error("Invalid response format from server")
    }

    // Validate user data
    if (!user) {
      throw new Error("No user data received from server")
    }
    if (!user.role) {
      throw new Error("No user role received from server")
    }

    localStorage.setItem("token", token)
    console.log("💾 Token saved to localStorage")
    console.log("👤 User data:", user)

    return { token, user }
  } catch (error) {
    console.error("❌ Login failed:", error)
    return rejectWithValue(error.response?.data?.message || error.message || "Login failed")
  }
})

export const checkAuthStatus = createAsyncThunk("auth/checkAuthStatus", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    console.log("🔍 Checking auth status...")
    const response = await authAPI.verifyToken()
    console.log("✅ Auth verification response:", response.data)

    // Handle your backend's response format for token verification
    let user

    if (response.data.success && response.data.data) {
      user = response.data.data
    } else if (response.data.user) {
      user = response.data.user
    } else if (response.data.data) {
      user = response.data.data
    } else {
      throw new Error("No user data received from verification")
    }

    // Validate user data
    if (!user) {
      throw new Error("No user data received from verification")
    }

    return { user }
  } catch (error) {
    console.error("❌ Auth check failed:", error)
    localStorage.removeItem("token")
    return rejectWithValue(error.message || "Token invalid")
  }
})

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  console.log("🚪 Logging out user...")
  localStorage.removeItem("token")
  return null
})

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: false,
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
      // Login
      .addCase(loginUser.pending, (state) => {
        console.log("🔄 Login pending...")
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log("✅ Login fulfilled with payload:", action.payload)
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log("❌ Login rejected:", action.payload)
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        console.log("🔄 Auth check pending...")
        state.loading = true
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        console.log("✅ Auth check fulfilled with payload:", action.payload)
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        console.log("❌ Auth check rejected:", action.payload)
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        console.log("✅ Logout completed")
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
