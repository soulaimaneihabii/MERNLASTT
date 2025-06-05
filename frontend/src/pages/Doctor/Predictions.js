"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Card,
  Select,
  Button,
  Row,
  Col,
  Typography,
  notification,
  Table,
  Tag,
  Space,
  Modal,
  Statistic,
  Progress,
} from "antd"
import { ExperimentOutlined, RocketOutlined, EyeOutlined } from "@ant-design/icons"
import { fetchPatients } from "../../store/slices/patientsSlice"
import { createPrediction, fetchPredictions } from "../../store/slices/predictionsSlice"

const { Title, Text } = Typography
const { Option } = Select

const Predictions = () => {
  const dispatch = useDispatch()
  const { patients = [] } = useSelector((state) => state.patients)
  const { predictions = [], loading } = useSelector((state) => state.predictions)
  const { user } = useSelector((state) => state.auth)

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [predictionResult, setPredictionResult] = useState(null)

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPatients({ doctorId: user.id }))
      dispatch(fetchPredictions({ doctorId: user.id }))
    }
  }, [dispatch, user?.id])

  const handlePatientSelect = (patientId) => {
    const patient = patients.find((p) => p.id === patientId)
    setSelectedPatient(patient)
  }

  const handleRunPrediction = async () => {
    if (!selectedPatient || !selectedPatient.medicalData) {
      notification.warning({
        message: "Warning",
        description: "Please select a patient with complete medical information.",
      })
      return
    }

    try {
      console.log("Sending AI prediction with data:", selectedPatient.medicalData)

      const result = await dispatch(
        createPrediction({
          patientId: selectedPatient.id,
          medicalData: selectedPatient.medicalData,
          doctorId: user.id,
        })
      ).unwrap()

      console.log("Prediction created successfully:", result)

      setPredictionResult(result.data)
      setIsModalVisible(true)

      notification.success({
        message: "Success",
        description: "AI prediction created successfully.",
      })

      // Refresh predictions
      dispatch(fetchPredictions({ doctorId: user.id }))
    } catch (error) {
      console.error("Prediction error:", error)
      notification.error({
        message: "Error",
        description: `Failed to create prediction: ${error.message}`,
      })
    }
  }

  const columns = [
    {
      title: "Patient",
      dataIndex: ["patient", "firstName"],
      key: "patient",
      render: (firstName, record) =>
        `${firstName} ${record.patient?.lastName || ""}`,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Risk Level",
      dataIndex: "riskLevel",
      key: "riskLevel",
      render: (risk) => {
        const color =
          risk === "High" ? "red" : risk === "Moderate" ? "orange" : "green"
        return <Tag color={color}>{risk || "Unknown"}</Tag>
      },
    },
    {
      title: "Confidence",
      dataIndex: "confidence",
      key: "confidence",
      render: (confidence) => (
        <Progress
          percent={Math.round((confidence || 0) * 100)}
          size="small"
          status={
            confidence > 0.8
              ? "success"
              : confidence > 0.6
              ? "normal"
              : "exception"
          }
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setPredictionResult(record)
              setIsModalVisible(true)
            }}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={2}>AI Predictions Dashboard</Title>
      <Text type="secondary">
        Generate and analyze chronic disease risk predictions for your patients.
      </Text>

      {/* Generate Prediction */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="Generate New Prediction" extra={<RocketOutlined />}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Select
                style={{ width: "100%" }}
                placeholder="Select patient"
                onChange={handlePatientSelect}
                size="large"
              >
                {patients
                  .filter((p) => p.medicalData)
                  .map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.firstName || ""} {p.lastName || ""} - {p.email}
                    </Option>
                  ))}
              </Select>

              {selectedPatient && (
                <div style={{ background: "#f5f5f5", padding: 12 }}>
                  <Text strong>Selected Patient:</Text> <br />
                  <Text>{selectedPatient.firstName || ""} {selectedPatient.lastName || ""}</Text>
                  <br />
                  <Text type="secondary">
                    Ready for AI: ✅
                  </Text>
                </div>
              )}

              <Button
                type="primary"
                icon={<RocketOutlined />}
                size="large"
                onClick={handleRunPrediction}
                disabled={!selectedPatient || !selectedPatient.medicalData}
                loading={loading}
              >
                Generate AI Prediction
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Risk Distribution">
            <div style={{ textAlign: "center", padding: 40 }}>
              <Text type="secondary">No predictions yet</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Predictions History */}
      <Card title="Prediction History" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={predictions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

      {/* Prediction Result Modal */}
      <Modal
        title="Prediction Result"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {predictionResult && (
          <div>
            <p>
              <strong>Risk Level:</strong> {predictionResult.riskLevel}
            </p>
            <p>
              <strong>Confidence:</strong>{" "}
              {Math.round((predictionResult.confidence || 0) * 100)}%
            </p>
            <p>
              <strong>Disease Types:</strong>{" "}
              {predictionResult.diseaseTypes?.join(", ") || "None"}
            </p>
            <p>
              <strong>Recommendations:</strong>
            </p>
            <ul>
              {predictionResult.recommendations?.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Predictions
