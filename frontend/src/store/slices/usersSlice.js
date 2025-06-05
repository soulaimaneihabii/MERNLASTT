import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { usersAPI } from "../../services/api"

export const fetchUsers = createAsyncThunk("users/fetchUsers", async (params, { rejectWithValue }) => {
  try {
    console.log("🔍 Fetching users with params:", params)
    const response = await usersAPI.getUsers(params)
    console.log("✅ Users fetched successfully:", response.data)

    // Handle different response formats from your backend
    let users, total

    if (response.data.success) {
      // If your backend returns { success: true, data: [...], total: 100 }
      users = response.data.data || []
      total = response.data.total || users.length
    } else if (Array.isArray(response.data)) {
      // If your backend returns users array directly
      users = response.data
      total = users.length
    } else if (response.data.users) {
      // If your backend returns { users: [...], total: 100 }
      users = response.data.users
      total = response.data.total || users.length
    } else {
      // Fallback
      users = []
      total = 0
    }

    return { users, total }
  } catch (error) {
    console.error("❌ Failed to fetch users:", error)
    const errorMessage = error.response?.data?.message || "Failed to fetch users"
    return rejectWithValue(errorMessage)
  }
})

export const createUser = createAsyncThunk("users/createUser", async (userData, { rejectWithValue }) => {
  try {
    console.log("➕ Creating user:", userData)
    const response = await usersAPI.createUser(userData)
    console.log("✅ User created successfully:", response.data)

    // Handle different response formats
    if (response.data.success && response.data.data) {
      return response.data.data
    } else if (response.data.user) {
      return response.data.user
    } else {
      return response.data
    }
  } catch (error) {
    console.error("❌ Failed to create user:", error)
    // Extract the error message from the response
    const errorMessage = error.response?.data?.message || "Failed to create user"
    return rejectWithValue(errorMessage)
  }
})

export const updateUser = createAsyncThunk("users/updateUser", async ({ id, userData }, { rejectWithValue }) => {
  try {
    console.log("✏️ Updating user:", id, userData)
    const response = await usersAPI.updateUser(id, userData)
    console.log("✅ User updated successfully:", response.data)

    // Handle different response formats
    if (response.data.success && response.data.data) {
      return response.data.data
    } else if (response.data.user) {
      return response.data.user
    } else {
      return response.data
    }
  } catch (error) {
    console.error("❌ Failed to update user:", error)
    const errorMessage = error.response?.data?.message || "Failed to update user"
    return rejectWithValue(errorMessage)
  }
})

export const deleteUser = createAsyncThunk("users/deleteUser", async (id, { rejectWithValue }) => {
  try {
    console.log("🗑️ Deleting user:", id)
    await usersAPI.deleteUser(id)
    console.log("✅ User deleted successfully")
    return id
  } catch (error) {
    console.error("❌ Failed to delete user:", error)
    const errorMessage = error.response?.data?.message || "Failed to delete user"
    return rejectWithValue(errorMessage)
  }
})

const usersSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    total: 0,
    loading: false,
    error: null,
    currentPage: 1,
    pageSize: 10,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setPage: (state, action) => {
      state.currentPage = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload.users || []
        state.total = action.payload.total || 0
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.users = [] // Ensure users is always an array
        state.total = 0
      })
      .addCase(createUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          state.users.push(action.payload)
          state.total += 1
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          const index = state.users.findIndex((user) => user.id === action.payload.id)
          if (index !== -1) {
            state.users[index] = action.payload
          }
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false
        state.users = state.users.filter((user) => user.id !== action.payload)
        state.total = Math.max(0, state.total - 1)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, setPage } = usersSlice.actions
export default usersSlice.reducer
