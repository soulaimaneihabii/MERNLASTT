"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Card, Row, Col, Statistic, Table, Button, Space, Typography, Tag, notification, Tooltip } from "antd"
import {
  FileTextOutlined,
  DownloadOutlined,
  PlusOutlined,
  ExperimentOutlined,
  CalendarOutlined,
} from "@ant-design/icons"
import { fetchPredictionHistory, clearError } from "../../store/slices/predictionsSlice"
import {
  exportPatientData,
  fetchCurrentPatient,
  fetchCurrentPatientForPatientRole,
} from "../../store/slices/patientsSlice"

// Import the chart component
import PredictionTrendChart from "../../components/Charts/PredictionTrendChart"

const { Title, Text } = Typography

const PatientDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { predictionHistory = [], loading, error } = useSelector((state) => state.predictions)
  const { exportLoading, currentPatient } = useSelector((state) => state.patients)
  const { user } = useSelector((state) => state.auth)

  // 🚀 Load current patient
  useEffect(() => {
    if (user?.id) {
      if (user.role === "patient") {
        dispatch(fetchCurrentPatientForPatientRole())
      } else {
        dispatch(fetchCurrentPatient(user.id))
      }
    }
  }, [dispatch, user?.id, user?.role])

  // 🚀 Load prediction history when currentPatient is ready
  useEffect(() => {
    if (currentPatient?.id) {
      dispatch(fetchPredictionHistory(currentPatient.id))
    }
  }, [dispatch, currentPatient?.id])

  // 🚀 Error handling
  useEffect(() => {
    if (error) {
      notification.error({
        message: "Error",
        description: error,
      })
      dispatch(clearError())
    }
  }, [error, dispatch])

  // 🚀 Export patient data
  const handleExportData = async () => {
    try {
      if (!currentPatient?.id) {
        throw new Error("Patient ID not available")
      }

      const result = await dispatch(exportPatientData(currentPatient.id)).unwrap()

      // Create blob and download
      const blob = new Blob([result], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `medical-records-${currentPatient.fullName || "patient"}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      notification.success({
        message: "Success",
        description: "Medical records exported successfully",
      })
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to export data",
      })
    }
  }

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    },
    {
      title: "Prediction Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag color="blue">{type || "Diabetes Risk"}</Tag>,
    },
    {
      title: "Result",
      dataIndex: "result",
      key: "result",
      render: (result) => {
        const risk = result?.risk || "unknown"
        const color = risk === "high" ? "red" : risk === "medium" ? "orange" : "green"
        return <Tag color={color}>{risk.toUpperCase()} RISK</Tag>
      },
    },
    {
      title: "Confidence",
      dataIndex: "confidence",
      key: "confidence",
      render: (confidence) => (confidence ? `${(confidence * 100).toFixed(1)}%` : "N/A"),
    },
    {
      title: "Doctor",
      dataIndex: "doctorName",
      key: "doctorName",
      render: (name) => name || "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => {
                /* Show prediction details */
              }}
            >
              Details
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const totalPredictions = predictionHistory.length
  const recentPredictions = predictionHistory.filter(
    (p) => p?.createdAt && new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  ).length
  const highRiskPredictions = predictionHistory.filter((p) => p?.result?.risk === "high").length

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>My Medical Dashboard</Title>
        <Text type="secondary">
          Welcome back, {currentPatient?.fullName || user?.name || "Patient"}! Here are your diabetes risk predictions.
        </Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Predictions" value={totalPredictions} prefix={<ExperimentOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Recent (30 days)"
              value={recentPredictions}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="High Risk Alerts"
              value={highRiskPredictions}
              prefix={<ExperimentOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Last Update"
              value={
                predictionHistory[0]?.createdAt
                  ? new Date(predictionHistory[0].createdAt).toLocaleDateString()
                  : "No data"
              }
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Prediction trend chart */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <PredictionTrendChart predictionHistory={predictionHistory} loading={loading} />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card
            title="My Prediction History"
            extra={
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/patient/form")}>
                  New Medical Form
                </Button>
                <Button icon={<DownloadOutlined />} loading={exportLoading} onClick={handleExportData}>
                  Export My Data
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={predictionHistory}
              rowKey={(record) => record.id || Math.random().toString()}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              locale={{
                emptyText: "No predictions yet. Fill out a medical form to get started.",
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default PatientDashboard
