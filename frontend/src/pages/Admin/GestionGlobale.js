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

const COLORS = ["#1890ff", "#f5222d", "#52c41a", "#faad14", "#13c2c2"];

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

  return (
    <div>
      <Title level={2}>Admin Global Dashboard</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Users" value={userStats.totalUsers} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Doctors" value={userStats.doctors} prefix={<TeamOutlined />} valueStyle={{ color: "#1890ff" }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Admins" value={userStats.admins} prefix={<TeamOutlined />} valueStyle={{ color: "#cf1322" }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Active Users" value={userStats.activeUsers} prefix={<UserOutlined />} valueStyle={{ color: "#52c41a" }} />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview" type="card">
        <TabPane tab="Overview" key="overview">
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Patients per Doctor" style={{ height: "100%" }}>
                {userStats.patientsPerDoctor.length === 0 ? (
                  <p>No patient data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userStats.patientsPerDoctor}>
                      <XAxis dataKey="doctor" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="patients" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>

            <Col span={12}>
              <Card title="User Roles Distribution" style={{ height: "100%" }}>
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
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Department Distribution" style={{ height: "100%" }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userStats.departmentDistribution}>
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#52c41a" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Active vs Inactive Users" style={{ height: "100%" }}>
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
                      <Cell fill="#1890ff" />
                      <Cell fill="#f5222d" />
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
          <Row gutter={24}>
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

export default GestionGlobale;