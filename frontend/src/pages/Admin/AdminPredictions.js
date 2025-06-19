"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Card,
  Tag,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchPredictions, fetchPredictionStats } from "../../store/slices/predictionsSlice";

const { Option } = Select;

const AdminPredictions = () => {
  const dispatch = useDispatch();
  const { predictions = [], stats = {}, loading } = useSelector((s) => s.predictions);
  const [search, setSearch] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState("");

  useEffect(() => {
    dispatch(fetchPredictions({ doctorId: "all" }));
    dispatch(fetchPredictionStats());
  }, [dispatch]);

  const filtered = predictions.filter((p) => {
    const matchesSearch = `${p.patientName}`.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter ? p.predictionResult.toLowerCase().includes(riskFilter.toLowerCase()) : true;
    return matchesSearch && matchesRisk;
  });

  const riskCounts = { high: 0, medium: 0, low: 0 };
  (stats.riskDistribution || []).forEach((item) => {
    const key = item._id?.toLowerCase();
    if (key === "high") riskCounts.high = item.count;
    else if (key === "medium") riskCounts.medium = item.count;
    else if (key === "low") riskCounts.low = item.count;
  });

  const chartData = [
    {
      name: "Risques",
      High: riskCounts.high,
      Medium: riskCounts.medium,
      Low: riskCounts.low,
    },
  ];

  const columns = [
    {
      title: "Patient",
      dataIndex: "patientName",
      key: "patientName",
    },
    {
      title: "Docteur",
      dataIndex: "doctorName",
      key: "doctorName",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      title: "Risque",
      dataIndex: "predictionResult",
      key: "predictionResult",
      render: (r) => {
        const val = r.toLowerCase();
        if (val.includes("high")) return <Tag color="red">High</Tag>;
        if (val.includes("medium") || val.includes("moderate")) return <Tag color="orange">Medium</Tag>;
        if (val.includes("low")) return <Tag color="green">Low</Tag>;
        return <Tag>Unknown</Tag>;
      },
    },
    {
      title: "Confiance",
      dataIndex: "confidence",
      key: "confidence",
      render: (c) => `${(c * 100).toFixed(1)}%`,
    },
  ];

  return (
    <div>
      <Card title="Filtrage" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input.Search
              placeholder="Chercher patient"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Filtrer par risque"
              value={riskFilter}
              onChange={(v) => setRiskFilter(v)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card title="Répartition des risques" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip />
            <Legend />
            <Bar dataKey="High" fill="#f5222d" />
            <Bar dataKey="Medium" fill="#faad14" />
            <Bar dataKey="Low" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Toutes les prédictions AI">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>
    </div>
  );
};

export default AdminPredictions;
