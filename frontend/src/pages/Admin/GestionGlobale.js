"use client";

import { useEffect, useState } from "react";
import { Card, Typography, Row, Col, Tabs, Statistic, Divider, Button } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import API from "../../services/api";

const { Title } = Typography;
const { TabPane } = Tabs;

const COLORS = ["#3f51b5", "#e91e63", "#4caf50", "#ff9800", "#00bcd4"];

const GestionGlobale = () => {
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    doctors: 0,
    admins: 0,
    activeUsers: 0,
    roleDistribution: [],
    departmentDistribution: [],
    patientsPerDoctor: [],
  });

  const fetchStats = async () => {
    try {
      const usersRes = await API.get("/analytics/users");
      const roleDist = usersRes.data.data.roleDistribution || [];
      const totalUsers = roleDist.reduce((acc, item) => acc + item.count, 0);
      const doctors = roleDist.find((r) => r._id === "doctor")?.count || 0;
      const admins = roleDist.find((r) => r._id === "admin")?.count || 0;
      const activeUsers = roleDist.reduce((acc, item) => acc + item.active, 0);

      const patientsRes = await API.get("/analytics/patients-per-doctor");
      const patientsPerDoctorRaw = patientsRes.data?.data || [];
      const patientsPerDoctor = patientsPerDoctorRaw.map((item) => ({
        doctor: item.doctor || "Unknown",
        patients: item.patients,
      }));

      setUserStats({
        totalUsers,
        doctors,
        admins,
        activeUsers,
        roleDistribution: roleDist.map((item) => ({
          role: item._id,
          count: item.count,
        })),
        departmentDistribution: usersRes.data.data.departmentDistribution.map((item) => ({
          department: item._id,
          count: item.count,
        })),
        patientsPerDoctor,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: userStats.totalUsers, icon: <UserOutlined style={{ fontSize: 28 }} />, color: "#e3f2fd" },
    { label: "Doctors", value: userStats.doctors, icon: <TeamOutlined style={{ fontSize: 28 }} />, color: "#fdecea" },
    { label: "Admins", value: userStats.admins, icon: <TeamOutlined style={{ fontSize: 28 }} />, color: "#f3e5f5" },
    { label: "Active Users", value: userStats.activeUsers, icon: <UserOutlined style={{ fontSize: 28 }} />, color: "#e8f5e9" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ fontWeight: 700, marginBottom: 24 }}>Admin Global Dashboard</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((item, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card style={{ ...cardStyle, background: item.color }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={cardTitle}>{item.label}</div>
                  <div style={cardNumber}>{item.value}</div>
                </div>
                <div>{item.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs defaultActiveKey="overview" type="card">
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Patients per Doctor">
                {userStats.patientsPerDoctor.length === 0 ? (
                  <p>No patient data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userStats.patientsPerDoctor}>
                      <XAxis dataKey="doctor" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="patients" fill="#3f51b5" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="User Roles Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userStats.roleDistribution}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {userStats.roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Analytics" key="analytics">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Department Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userStats.departmentDistribution}>
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4caf50" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Active vs Inactive Users">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Active", value: userStats.activeUsers },
                        { name: "Inactive", value: userStats.totalUsers - userStats.activeUsers },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      <Cell fill="#4caf50" />
                      <Cell fill="#e91e63" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Reports" key="reports">
          <Title level={4}>Available Reports</Title>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card title="Financial Reports">
                <ul>
                  <li>Monthly Revenue Summary</li>
                  <li>Quarterly Financial Analysis</li>
                  <li>Insurance Claims Report</li>
                  <li>Outstanding Payments</li>
                </ul>
                <Button type="primary" style={{ marginTop: 12 }}>Generate New Report</Button>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Patient Reports">
                <ul>
                  <li>New Patient Registrations</li>
                  <li>Patient Demographics</li>
                  <li>Visit Frequency Analysis</li>
                  <li>Treatment Outcomes</li>
                </ul>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Operational Reports">
                <ul>
                  <li>Staff Performance Metrics</li>
                  <li>Inventory Status</li>
                  <li>Room Utilization</li>
                  <li>Wait Time Analysis</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

const cardStyle = {
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  padding: "20px",
  transition: "transform 0.2s ease",
  cursor: "pointer"
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 4,
  color: "#333"
};

const cardNumber = {
  fontSize: 28,
  fontWeight: 700,
  color: "#111"
};

export default GestionGlobale;