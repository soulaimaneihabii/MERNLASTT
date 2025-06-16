"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Progress,
} from "antd";
import { RocketOutlined, EyeOutlined } from "@ant-design/icons";
import { fetchPatients } from "../../store/slices/patientsSlice";
import {
  createPrediction,
  fetchPredictions,
  fetchPredictionStats,
} from "../../store/slices/predictionsSlice";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
const { Title, Text } = Typography;
const { Option } = Select;

const isPatientReadyForAI = (p) =>
  p.age !== undefined &&
  p.gender &&
  p.race &&
  p.diag_1 &&
  p.time_in_hospital !== undefined &&
  p.num_lab_procedures !== undefined &&
  p.num_procedures !== undefined &&
  p.num_medications !== undefined;

const buildMedicalData = (p) => ({
  age: p.age,
  gender: p.gender,
  race: p.race,
  diag_1: p.diag_1,
  diag_2: p.diag_2,
  diag_3: p.diag_3,
  max_glu_serum: p.max_glu_serum,
  A1Cresult: p.A1Cresult || p.A1C_result || "",
  insulin: p.insulin,
  metformin: p.metformin,
  diabetesMed: p.diabetesMed === 1 ? "Yes" : "No",
  time_in_hospital: p.time_in_hospital,
  num_lab_procedures: p.num_lab_procedures,
  num_procedures: p.num_procedures,
  num_medications: p.num_medications,
  number_outpatient: p.number_outpatient,
  number_emergency: p.number_emergency,
  number_inpatient: p.number_inpatient,
  number_diagnoses: p.number_diagnoses,
});

const Predictions = () => {
  const dispatch = useDispatch();
  const { patients = [] } = useSelector((state) => state.patients);
  const { predictions = [], loading, stats = {} } = useSelector((state) => state.predictions);
  const { user } = useSelector((state) => state.auth);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [aiServiceStatus, setAiServiceStatus] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPatients({ doctorId: user.id }));
      dispatch(fetchPredictions({ doctorId: user.id }));
      dispatch(fetchPredictionStats());
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    const checkAIService = async () => {
      try {
        const response = await fetch("http://localhost:5001/health");
        const data = await response.json();
        setAiServiceStatus(data.model_loaded);
      } catch (error) {
        setAiServiceStatus(false);
      }
    };

    checkAIService();
    const interval = setInterval(checkAIService, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePatientSelect = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    setSelectedPatient(patient);
  };

  const handleRunPrediction = async () => {
    if (!selectedPatient) {
      notification.warning({
        message: "Warning",
        description: "Please select a patient with complete medical information.",
      });
      return;
    }

    const medicalData = buildMedicalData(selectedPatient);

    try {
      const result = await dispatch(
        createPrediction({
          patientId: selectedPatient.id,
          medicalData,
          doctorId: user.id,
        })
      ).unwrap();

      setPredictionResult(result.data);
      setIsModalVisible(true);

      notification.success({
        message: "Success",
        description: "AI prediction created successfully.",
      });

      dispatch(fetchPredictions({ doctorId: user.id }));
      dispatch(fetchPredictionStats());
    } catch (error) {
      notification.error({
        message: "Error",
        description: `Failed to create prediction: ${error.message}`,
      });
    }
  };

  const columns = [
    {
      title: "Patient",
      dataIndex: ["patient", "firstName"],
      key: "patient",
      render: (firstName, record) => `${firstName} ${record.patient?.lastName || ""}`,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Risk Level",
      dataIndex: "predictionResult",
      key: "predictionResult",
      render: (risk) => {
        const color = risk === "High" ? "red" : risk === "Moderate" ? "orange" : "green";
        return <Tag color={color}>{risk || "Unknown"}</Tag>;
      },
    },
    {
      title: "Risk Percentage % ",
      dataIndex: "confidence",
      key: "confidence",
      render: (confidence) => (
        <Progress
          percent={Math.round((confidence || 0) * 100)}
          size="small"
          status={confidence > 0.8 ? "success" : confidence > 0.6 ? "normal" : "exception"}
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
              setPredictionResult(record);
              setIsModalVisible(true);
            }}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

const riskDistributionData = [
  { type: "High", value: stats?.riskDistribution?.find(r => r._id === "high")?.count ?? 0 },
  { type: "Moderate", value: stats?.riskDistribution?.find(r => r._id === "medium")?.count ?? 0 },
  { type: "Low", value: stats?.riskDistribution?.find(r => r._id === "low")?.count ?? 0 },
];

const COLORS = ["#f5222d", "#ffc107", "#00b96b"]; // High, Moderate, Low

const total = riskDistributionData.reduce((sum, item) => sum + item.value, 0);

const formattedData = riskDistributionData.map((item) => ({
  name: item.type,
  value: item.value,
  percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0",
}));

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  index,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20; // move outside
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#000" // black text
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={14}
    >
      {`${formattedData[index].name}: ${formattedData[index].percent}%`}
    </text>
  );
};


console.log("✅ riskDistribution", stats?.riskDistribution);
console.log("✅ Pie Chart Data", riskDistributionData);


  return (
    <div>
      <Title level={2}>AI Predictions Dashboard</Title>
      <Text type="secondary">
        Generate and analyze chronic disease risk predictions for your patients.
      </Text>

      <div style={{ marginTop: 12 }}>
        <Tag color={aiServiceStatus ? "green" : "red"}>
          AI Service: {aiServiceStatus ? "Running" : "Not Available"}
        </Tag>
      </div>

      <Row gutter={16} style={{ marginTop: 24 }} wrap>
        <Col xs={24} md={12}>
          <Card title="Generate New Prediction" extra={<RocketOutlined />}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Select
                style={{ width: "100%" }}
                placeholder="Select patient"
                onChange={handlePatientSelect}
                size="large"
              >
                {patients
                  .filter(isPatientReadyForAI)
                  .map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.firstName || ""} {p.lastName || ""} - {p.email}
                    </Option>
                  ))}
              </Select>

              {selectedPatient && (
                <div style={{ background: "#f5f5f5", padding: 12 }}>
                  <Text strong>Selected Patient:</Text> <br />
                  <Text>
                    {selectedPatient.firstName || ""} {selectedPatient.lastName || ""}
                  </Text>
                  <br />
                  <Text type="secondary">Ready for AI: ✅</Text>
                </div>
              )}

              <Button
                type="primary"
                icon={<RocketOutlined />}
                size="large"
                onClick={handleRunPrediction}
                disabled={!selectedPatient || !isPatientReadyForAI(selectedPatient)}
                loading={loading}
              >
                Generate AI Prediction
              </Button>
            </Space>
          </Card>
        </Col>
<Col xs={24} md={12}>
  <Card title="Risk Distribution">
   <ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={formattedData}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={renderCustomizedLabel}
      outerRadius={100}
      innerRadius={60}
      dataKey="value"
    >
      {formattedData.map((_, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip formatter={(value) => `${value} predictions`} />
    <Legend verticalAlign="bottom" />
  </PieChart>
</ResponsiveContainer>

  </Card>
</Col>
      </Row>

      <Card title="Prediction History" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={predictions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

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
              <strong>Risk Level:</strong> {predictionResult.predictionResult}
            </p>
            <p>
              <strong>Risk Percentage %:</strong>{" "}
              {Math.round((predictionResult.confidence || 0) * 100)}%
            </p>
            <p>
              <strong>Disease Types:</strong>{" "}
              {predictionResult.diseaseTypes?.length > 0
                ? predictionResult.diseaseTypes.join(", ")
                : "None"}
            </p>
            <p>
              <strong>Recommendations:</strong>
            </p>
            <ul>
              {predictionResult.recommendations?.length > 0 ? (
                predictionResult.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))
              ) : (
                <li>No recommendations</li>
              )}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Predictions;
