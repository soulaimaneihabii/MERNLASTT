"use client"

import { useSelector } from "react-redux"
import { Card, Typography, Tag, Space, Divider } from "antd"

const { Text, Paragraph } = Typography

const AuthDebug = () => {
  const authState = useSelector((state) => state.auth)

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <Card
      title="🐛 Auth Debug Info"
      size="small"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 300,
        zIndex: 1000,
        opacity: 0.9,
      }}
    >
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <div>
          <Text strong>Authentication Status:</Text>
          <Tag color={authState.isAuthenticated ? "green" : "red"}>
            {authState.isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </Tag>
        </div>

        <div>
          <Text strong>Loading:</Text>
          <Tag color={authState.loading ? "orange" : "blue"}>{authState.loading ? "Loading" : "Ready"}</Tag>
        </div>

        {authState.user && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <div>
              <Text strong>User Role:</Text>
              <Tag color="purple">{authState.user.role}</Tag>
            </div>
            <div>
              <Text strong>User Name:</Text>
              <Text>{authState.user.name || "N/A"}</Text>
            </div>
            <div>
              <Text strong>User Email:</Text>
              <Text>{authState.user.email || "N/A"}</Text>
            </div>
          </>
        )}

        {authState.error && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <div>
              <Text strong>Error:</Text>
              <Paragraph style={{ margin: 0, fontSize: "12px", color: "red" }}>{authState.error}</Paragraph>
            </div>
          </>
        )}

        <Divider style={{ margin: "8px 0" }} />
        <div>
          <Text strong>Token:</Text>
          <Text style={{ fontSize: "10px" }}>
            {authState.token ? `${authState.token.substring(0, 20)}...` : "No token"}
          </Text>
        </div>
      </Space>
    </Card>
  )
}

export default AuthDebug
