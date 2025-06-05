"use client"

import { useState } from "react"
import { Card, Button, Select, Typography, Space, Alert, Collapse } from "antd"
import { PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons"
import { createTestData, testWebSocketConnection } from "../../utils/testHelpers"

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Panel } = Collapse

const ApiTester = () => {
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)

  const testData = createTestData()

  const runApiTest = async (endpoint, method = "GET", data = null) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        ...(data && { body: JSON.stringify(data) }),
      })

      const result = await response.json()
      const success = response.ok

      setTestResults((prev) => ({
        ...prev,
        [endpoint]: { success, data: result, status: response.status },
      }))

      return { success, data: result }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [endpoint]: { success: false, error: error.message },
      }))
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const testWebSocket = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      await testWebSocketConnection(process.env.REACT_APP_WS_URL, token)
      setTestResults((prev) => ({
        ...prev,
        websocket: { success: true, message: "WebSocket connection successful" },
      }))
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        websocket: { success: false, error: error.message },
      }))
    } finally {
      setLoading(false)
    }
  }

  const renderTestResult = (key) => {
    const result = testResults[key]
    if (!result) return null

    return (
      <Alert
        type={result.success ? "success" : "error"}
        icon={result.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        message={result.success ? "Test Passed" : "Test Failed"}
        description={result.error || result.message || "API endpoint working correctly"}
        style={{ marginTop: 8 }}
      />
    )
  }

  return (
    <Card title="API & WebSocket Tester" style={{ margin: 16 }}>
      <Collapse>
        <Panel header="Authentication Tests" key="auth">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button
              icon={<PlayCircleOutlined />}
              onClick={() =>
                runApiTest("/auth/login", "POST", {
                  email: "admin@demo.com",
                  password: "password",
                })
              }
              loading={loading}
            >
              Test Login
            </Button>
            {renderTestResult("/auth/login")}

            <Button icon={<PlayCircleOutlined />} onClick={() => runApiTest("/auth/validate-token")} loading={loading}>
              Test Token Validation
            </Button>
            {renderTestResult("/auth/validate-token")}
          </Space>
        </Panel>

        <Panel header="Medical Prediction Test" key="prediction">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Paragraph>
              <Text strong>Test Data:</Text> This will test the AI prediction endpoint with sample medical data.
            </Paragraph>

            <Button
              icon={<PlayCircleOutlined />}
              onClick={() =>
                runApiTest("/predictions", "POST", {
                  patientId: "test-patient-id",
                  medicalData: testData.testPatientData,
                })
              }
              loading={loading}
            >
              Test AI Prediction
            </Button>
            {renderTestResult("/predictions")}
          </Space>
        </Panel>

        <Panel header="WebSocket Test" key="websocket">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Paragraph>
              <Text strong>WebSocket URL:</Text> {process.env.REACT_APP_WS_URL}
            </Paragraph>

            <Button icon={<PlayCircleOutlined />} onClick={testWebSocket} loading={loading}>
              Test WebSocket Connection
            </Button>
            {renderTestResult("websocket")}
          </Space>
        </Panel>

        <Panel header="Environment Variables" key="env">
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>API URL:</Text> {process.env.REACT_APP_API_URL || "Not configured"}
            </div>
            <div>
              <Text strong>WebSocket URL:</Text> {process.env.REACT_APP_WS_URL || "Not configured"}
            </div>

            {(!process.env.REACT_APP_API_URL || !process.env.REACT_APP_WS_URL) && (
              <Alert
                type="warning"
                message="Missing Environment Variables"
                description="Make sure both REACT_APP_API_URL and REACT_APP_WS_URL are configured in your Vercel project."
              />
            )}
          </Space>
        </Panel>
      </Collapse>
    </Card>
  )
}

export default ApiTester
