"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  notification,
  Tooltip,
  Modal,
  Divider,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  PlusOutlined,
  ExperimentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import Chart from "react-apexcharts";
import {
  fetchPredictionHistory,
  clearError,
} from "../../store/slices/predictionsSlice";
import {
  exportPatientData,
  fetchCurrentPatient,
  fetchCurrentPatientForPatientRole,
} from "../../store/slices/patientsSlice";

const { Title, Text } = Typography;

const PatientDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { predictionHistory = [], loading, error } = useSelector((state) => state.predictions);
  const { exportLoading, currentPatient } = useSelector((state) => state.patients);
  const { user } = useSelector((state) => state.auth);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  useEffect(() => {
    if (user?.id) {
      if (user.role === "patient") {
        dispatch(fetchCurrentPatientForPatientRole());
      } else {
        dispatch(fetchCurrentPatient(user.id));
      }
    }
  }, [dispatch, user?.id, user?.role]);

  useEffect(() => {
    if (currentPatient?._id) {
      dispatch(fetchPredictionHistory(currentPatient._id));
    }
  }, [dispatch, currentPatient?._id]);

  useEffect(() => {
    if (error) {
      notification.error({ message: "Error", description: error });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleExportData = async () => {
    try {
      if (!currentPatient?._id) throw new Error("Patient ID not available");
      const result = await dispatch(exportPatientData(currentPatient._id)).unwrap();
      const blob = new Blob([result], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medical-records-${currentPatient.fullName || "patient"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      notification.success({ message: "Success", description: "Medical records exported successfully" });
    } catch (error) {
      notification.error({ message: "Error", description: error.message || "Failed to export data" });
    }
  };

  const totalPredictions = predictionHistory.length;
  const recentPredictions = predictionHistory.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 86400000)).length;
  const highRiskPredictions = predictionHistory.filter(p => p.predictionResult === "High").length;

  const totalDocs = currentPatient?.medicalFiles?.length || 0;
  const totalMeds = currentPatient?.currentMedications?.length || 0;
  const numEmergency = currentPatient?.number_emergency || 0;
  const numInpatient = currentPatient?.number_inpatient || 0;
  const numLabProcedures = currentPatient?.num_lab_procedures || 0;

  const dseChartData = {
    series: [totalDocs, totalMeds, numEmergency, numInpatient, numLabProcedures],
    options: {
      chart: { type: "donut" },
      labels: ["Documents", "Médicaments", "Urgences", "Hospitalisations", "Lab Tests"],
      colors: ["#69c0ff", "#95de64", "#ffc069", "#ff7875", "#d3adf7"],
    },
  };

  const riskChartData = {
    series: [{
      name: "Predictions",
      data: [
        predictionHistory.filter(p => p.predictionResult === "High").length,
        predictionHistory.filter(p => p.predictionResult === "Moderate").length,
        predictionHistory.filter(p => p.predictionResult === "Low").length,
      ]
    }],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      xaxis: { categories: ["High", "Moderate", "Low"] },
      colors: ["#ff4d4f", "#faad14", "#52c41a"],
      dataLabels: { enabled: true },
    }
  };

  return (
    <div>
      <Title level={2}>Welcome back, {currentPatient?.fullName || user?.name || "Patient"}</Title>
      <Text type="secondary">Your personal health dashboard</Text>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="Total Predictions" value={totalPredictions} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Recent (30 days)" value={recentPredictions} prefix={<CalendarOutlined />} valueStyle={{ color: "#1890ff" }} /></Card></Col>
        <Col span={6}><Card><Statistic title="High Risk Alerts" value={highRiskPredictions} prefix={<ExperimentOutlined />} valueStyle={{ color: "#cf1322" }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Last Update" value={predictionHistory[0]?.createdAt ? new Date(predictionHistory[0].createdAt).toLocaleDateString() : "No data"} prefix={<FileTextOutlined />} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}><Card title="📊 Risk Category Overview"><Chart options={riskChartData.options} series={riskChartData.series} type="bar" height={300} /></Card></Col>
        <Col span={12}><Card title="📈 Global DSE Analysis"><Chart options={dseChartData.options} series={dseChartData.series} type="donut" height={300} /></Card></Col>
      </Row>

      <Card title="📋 Dossier Santé Électronique - Summary" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <p><strong>📁 Total Medical Files:</strong> {totalDocs}</p>
            <p><strong>💊 Medications:</strong> {totalMeds}</p>
            <p><strong>🏥 Hospitalizations:</strong> {numInpatient}</p>
            <p><strong>🚨 Emergency Visits:</strong> {numEmergency}</p>
            <p><strong>🔬 Lab Procedures:</strong> {numLabProcedures}</p>
          </Col>
          <Col span={12}>
            <p><strong>📝 Recent Prediction:</strong> {predictionHistory[0]?.predictionResult || "None"}</p>
            <p><strong>📅 Date:</strong> {predictionHistory[0]?.createdAt ? new Date(predictionHistory[0].createdAt).toLocaleDateString() : "N/A"}</p>
            <p><strong>🎯 Confidence:</strong> {predictionHistory[0]?.confidence ? (predictionHistory[0].confidence * 100).toFixed(1) + "%" : "N/A"}</p>
            <p><strong>👨‍⚕️ Doctor:</strong> {predictionHistory[0]?.doctor?.name || "N/A"}</p>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default PatientDashboard;
