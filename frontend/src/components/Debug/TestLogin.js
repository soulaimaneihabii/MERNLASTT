"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { Button, Card, Space, notification } from "antd"
import { loginUser } from "../../store/slices/authSlice"

const TestLogin = () => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const testLogin = async (credentials) => {
    setLoading(true)
    try {
      const result = await dispatch(loginUser(credentials)).unwrap()
      notification.success({
        message: "Login Successful",
        description: `Logged in as ${result.user.role}: ${result.user.name}`,
      })
    } catch (error) {
      notification.error({
        message: "Login Failed",
        description: error,
      })
    } finally {
      setLoading(false)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <Card
      title="🧪 Test Login"
      size="small"
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        width: 250,
        zIndex: 1000,
        opacity: 0.9,
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Button
          type="primary"
          size="small"
          loading={loading}
          onClick={() => testLogin({ email: "admin@demo.com", password: "password" })}
          block
        >
          Test Admin Login
        </Button>
        <Button
          type="default"
          size="small"
          loading={loading}
          onClick={() => testLogin({ email: "doctor@demo.com", password: "password" })}
          block
        >
          Test Doctor Login
        </Button>
        <Button
          type="default"
          size="small"
          loading={loading}
          onClick={() => testLogin({ email: "patient@demo.com", password: "password" })}
          block
        >
          Test Patient Login
        </Button>
      </Space>
    </Card>
  )
}

export default TestLogin
