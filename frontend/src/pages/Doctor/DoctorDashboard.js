// "use client"

// import { useEffect, useState } from "react"
// import { useDispatch, useSelector } from "react-redux"
// import {
//   Table,
//   Button,
//   Space,
//   Modal,
//   Form,
//   Input,
//   Card,
//   Row,
//   Col,
//   Statistic,
//   Tag,
//   notification,
//   Tooltip,
//   Select,
//   Typography,
//   InputNumber, // Add this import
// } from "antd"
// import {
//   EyeOutlined,
//   ExperimentOutlined,
//   UserAddOutlined,
//   TeamOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   MedicineBoxOutlined,
//   BarChartOutlined,
// } from "@ant-design/icons"
// import { useNavigate } from "react-router-dom"
// import {
//   fetchPatients,
//   createPatient,
//   updatePatient,
//   deletePatient,
//   clearError,
// } from "../../store/slices/patientsSlice"
// import { fetchPredictions } from "../../store/slices/predictionsSlice"
// import { Column, Pie } from "@ant-design/plots"

// const { Option } = Select
// const { Title, Text } = Typography


// const DoctorDashboard = () => {
//   const dispatch = useDispatch()
//   const navigate = useNavigate()
//   const { patients = [], total = 0, loading, error } = useSelector((state) => state.patients)
//   const { predictions = [] } = useSelector((state) => state.predictions)
//   const { user } = useSelector((state) => state.auth)

//   const [isModalVisible, setIsModalVisible] = useState(false)
//   const [editingPatient, setEditingPatient] = useState(null)
//   const [form] = Form.useForm()

//   useEffect(() => {
//     if (user?.id) {
//       dispatch(fetchPatients({ doctorId: user.id }))
//       dispatch(fetchPredictions({ doctorId: user.id }))
//     }
//   }, [dispatch, user?.id])

//   useEffect(() => {
//     if (error) {
//       notification.error({
//         message: "Error",
//         description: error,
//       })
//       dispatch(clearError())
//     }
//   }, [error, dispatch])

//   const handleCreatePatient = () => {
//     setEditingPatient(null)
//     setIsModalVisible(true)
//     form.resetFields()
//     // Set default values for required fields
//     form.setFieldsValue({
//       numberOfDiagnoses: 1,
//       numberOfHospitalVisits: 0,
//       status: "active",
//     })
//   }

//   const handleEditPatient = (patient) => {
//     setEditingPatient(patient)
//     setIsModalVisible(true)
//     form.setFieldsValue(patient)
//   }

//   const handleDeletePatient = async (patientId) => {
//     try {
//       await dispatch(deletePatient(patientId)).unwrap()
//       notification.success({
//         message: "Success",
//         description: "Patient deleted successfully",
//       })
//     } catch (error) {
//       notification.error({
//         message: "Error",
//         description: error.message || "Failed to delete patient",
//       })
//     }
//   }

//   const handleModalOk = async () => {
//     try {
//       const values = await form.validateFields()

//       if (editingPatient) {
//         await dispatch(updatePatient({ id: editingPatient.id, patientData: values })).unwrap()
//         notification.success({
//           message: "Success",
//           description: "Patient updated successfully",
//         })
//       } else {
//         await dispatch(
//           createPatient({
//             ...values,
//             doctorId: user.id,
//           }),
//         ).unwrap()
//         notification.success({
//           message: "Success",
//           description: "Patient account created successfully",
//         })
//       }

//       setIsModalVisible(false)
//       form.resetFields()
//     } catch (error) {
//       notification.error({
//         message: "Error",
//         description: error.message || "Failed to save patient",
//       })
//     }
//   }

//   const handleModalCancel = () => {
//     setIsModalVisible(false)
//     form.resetFields()
//   }

//   const columns = [
//   {
//   title: "Patient Name",
//   key: "name",
//   render: (record) => `${record.firstName} `,
// },
//   {
//     title: "Email",
//     dataIndex: "email",
//     key: "email",
//   },
//   {
//     title: "Age",
//     dataIndex: "age",
//     key: "age",
//   },
//   {
//     title: "Gender",
//     dataIndex: "gender",
//     key: "gender",
//     render: (gender) => <Tag color={gender === "male" ? "blue" : "pink"}>{gender?.toUpperCase()}</Tag>,
//   },
//   {
//     title: "Medical Data",
//     dataIndex: "medicalData",
//     key: "medicalData",
//     render: (medicalData) => (
//       <Tag color={medicalData ? "green" : "orange"}>{medicalData ? "Complete" : "Incomplete"}</Tag>
//     ),
//   },
//   {
//     title: "Status",
//     dataIndex: "status",
//     key: "status",
//     render: (status) => <Tag color={status === "active" ? "green" : "orange"}>{status?.toUpperCase()}</Tag>,
//   },
//   {
//     title: "Actions",
//     key: "actions",
//     render: (_, record) => (
//       <Space size="middle">
//         <Tooltip title="View Patient Details">
//           <Button 
//             type="link" 
//             icon={<EyeOutlined />} 
//             onClick={() => navigate(`/doctor/patients/${record.id}`)}
//           >
//             View
//           </Button>
//         </Tooltip>

//         <Tooltip title="Edit Patient">
//           <Button 
//             type="link" 
//             icon={<EditOutlined />} 
//             onClick={() => handleEditPatient(record)}
//           >
//             Edit
//           </Button>
//         </Tooltip>

//         <Tooltip title="Add Medical Info">
//           <Button 
//             type="link" 
//             icon={<MedicineBoxOutlined />} 
//             onClick={() => navigate(`/doctor/patients/${record.id}/medical-info`)}
//           >
//             Medical Info
//           </Button>
//         </Tooltip>

//         <Tooltip title="Delete Patient">
//           <Button
//             type="link"
//             danger
//             icon={<DeleteOutlined />}
//             onClick={() => {
//               Modal.confirm({
//                 title: "Are you sure you want to delete this patient?",
//                 content: "This action cannot be undone.",
//                 onOk: () => handleDeletePatient(record._id)
// ,
//               })
//             }}
//           >
//             Delete
//           </Button>
//         </Tooltip>
//       </Space>
//     ),
//   },
// ]


//   // Chart data preparation
//   const activePatients = patients.filter((p) => p?.status === "active").length
//   const inactivePatients = patients.filter((p) => p?.status === "inactive").length
//   const patientsWithMedicalData = patients.filter((p) => p?.medicalData).length

//   const ageGroups = patients.reduce(
//     (acc, patient) => {
//       const age = patient?.age || 0
//       if (age < 30) acc["<30"]++
//       else if (age < 50) acc["30-49"]++
//       else if (age < 70) acc["50-69"]++
//       else acc["70+"]++
//       return acc
//     },
//     { "<30": 0, "30-49": 0, "50-69": 0, "70+": 0 },
//   )

//   const ageData = Object.entries(ageGroups).map(([range, count]) => ({
//     age: range,
//     count: count,
//   }))

//   const statusData = [
//     { type: "Active", value: activePatients },
//     { type: "Inactive", value: inactivePatients },
//   ].filter((item) => item.value > 0) // Filter out zero values

//   const columnConfig = {
//     data: ageData,
//     xField: "age",
//     yField: "count",
//     color: "#1890ff",
//     columnWidthRatio: 0.8,
//     meta: {
//       count: {
//         alias: "Number of Patients",
//       },
//     },
//   }

//   const pieConfig = {
//     data: statusData,
//     angleField: "value",
//     colorField: "type",
//     radius: 0.8,
//     label: {
//       type: "outer",
//       content: "{name} {percentage}",
//     },
//     legend: {
//       position: "bottom",
//     },
//   }

//   // Generate age options (1-120)
//   const ageOptions = Array.from({ length: 120 }, (_, i) => (
//     <Option key={i + 1} value={i + 1}>
//       {i + 1}
//     </Option>
//   ))

//   return (
//     <div>
//       <div style={{ marginBottom: 24 }}>
//         <Row gutter={16} style={{ marginBottom: 24 }}>
//           <Col span={6}>
//             <Card>
//               <Statistic title="My Patients" value={total} prefix={<TeamOutlined />} />
//             </Card>
//           </Col>
//           <Col span={6}>
//             <Card>
//               <Statistic
//                 title="Active Patients"
//                 value={activePatients}
//                 prefix={<TeamOutlined />}
//                 valueStyle={{ color: "#3f8600" }}
//               />
//             </Card>
//           </Col>
//           <Col span={6}>
//             <Card>
//               <Statistic
//                 title="With Medical Data"
//                 value={patientsWithMedicalData}
//                 prefix={<MedicineBoxOutlined />}
//                 valueStyle={{ color: "#1890ff" }}
//               />
//             </Card>
//           </Col>
//           <Col span={6}>
//             <Card>
//               <Statistic
//                 title="Total Predictions"
//                 value={predictions.length}
//                 prefix={<ExperimentOutlined />}
//                 valueStyle={{ color: "#722ed1" }}
//               />
//             </Card>
//           </Col>
//         </Row>

//         {/* Charts */}
//         <Row gutter={16} style={{ marginBottom: 24 }}>
//           <Col span={12}>
//             <Card title="Patients by Age Group" extra={<BarChartOutlined />}>
//               {ageData.length > 0 && ageData.some((item) => item.count > 0) ? (
//                 <Column {...columnConfig} height={250} />
//               ) : (
//                 <div style={{ textAlign: "center", padding: 40 }}>
//                   <Text type="secondary">No patient data available</Text>
//                 </div>
//               )}
//             </Card>
//           </Col>
//           <Col span={12}>
//             <Card title="Patient Status Distribution">
//               {statusData.length > 0 && statusData.some((item) => item.value > 0) ? (
//                 <Pie {...pieConfig} height={250} />
//               ) : (
//                 <div style={{ textAlign: "center", padding: 40 }}>
//                   <Text type="secondary">No patient data available</Text>
//                 </div>
//               )}
//             </Card>
//           </Col>
//         </Row>
//       </div>

//       <Card>
//         <div style={{ marginBottom: 16 }}>
//           <Space>
//             <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate("/doctor/patients/new")}>
//               Register New Patient
//             </Button>
//             <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate("/doctor/patients/:id/medical-info")}>
//               Medical information
//             </Button>
//             <Button icon={<MedicineBoxOutlined />} onClick={() => navigate("/doctor/medical-info")}>
//               Manage Medical Info
//             </Button>
//             <Button icon={<ExperimentOutlined />} onClick={() => navigate("/doctor/predictions")}>
//               AI Predictions
//             </Button>
//           </Space>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={patients}
//           rowKey="_id"
//           loading={loading}
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
//           }}
//           locale={{
//             emptyText: loading ? "Loading patients..." : "No patients found",
//           }}
//         />
//       </Card>

//       <Modal
//         title={editingPatient ? "Edit Patient" : "Create Patient Account"}
//         open={isModalVisible}
//         onOk={handleModalOk}
//         onCancel={handleModalCancel}
//         confirmLoading={loading}
//         width={600}
//       >
//     <Form form={form} layout="vertical" name="patientForm">
//   <Form.Item
//     name="name"
//     label="Patient Name"
//     rules={[{ required: true, message: "Please input the patient name!" }]}
//   >
//     <Input />
//   </Form.Item>

//   <Form.Item
//     name="email"
//     label="Email"
//     rules={[
//       { required: true, message: "Please input the email!" },
//       { type: "email", message: "Please enter a valid email!" },
//     ]}
//   >
//     <Input />
//   </Form.Item>

//   {!editingPatient && (
//     <Form.Item
//       name="password"
//       label="Password"
//       rules={[
//         { required: true, message: "Please input the password!" },
//         { min: 6, message: "Password must be at least 6 characters!" },
//       ]}
//     >
//       <Input.Password />
//     </Form.Item>
//   )}

//   <Row gutter={16}>
//     <Col span={12}>
//       <Form.Item name="age" label="Age" rules={[{ required: true, message: "Please select age!" }]}>
//         <Select placeholder="Select age" showSearch>
//           {ageOptions}
//         </Select>
//       </Form.Item>
//     </Col>
//     <Col span={12}>
//       <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender!" }]}>
//         <Select placeholder="Select gender">
//           <Option value="male">Male</Option>
//           <Option value="female">Female</Option>
//           <Option value="other">Other</Option>
//         </Select>
//       </Form.Item>
//     </Col>
//   </Row>

//   <Form.Item name="phone" label="Phone Number">
//     <Input />
//   </Form.Item>

//   {/* Address Section */}
//   <Title level={5}>Address</Title>

//   <Row gutter={16}>
//     <Col span={12}>
//       <Form.Item name={["address", "street"]} label="Street">
//         <Input placeholder="Street" />
//       </Form.Item>
//     </Col>
//     <Col span={12}>
//       <Form.Item name={["address", "city"]} label="City">
//         <Input placeholder="City" />
//       </Form.Item>
//     </Col>
//   </Row>

//   <Row gutter={16}>
//     <Col span={12}>
//       <Form.Item name={["address", "state"]} label="State">
//         <Input placeholder="State" />
//       </Form.Item>
//     </Col>
//     <Col span={12}>
//       <Form.Item name={["address", "zipCode"]} label="Zip Code">
//         <Input placeholder="Zip Code" />
//       </Form.Item>
//     </Col>
//   </Row>

//   <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select status!" }]}>
//     <Select placeholder="Select status">
//       <Option value="active">Active</Option>
//       <Option value="inactive">Inactive</Option>
//     </Select>
//   </Form.Item>

//   <Row gutter={16}>
//     <Col span={12}>
//       <Form.Item
//         name={["emergencyContact", "name"]}
//         label="Emergency Contact Name"
//         rules={[{ required: true, message: "Please input emergency contact name!" }]}
//       >
//         <Input placeholder="Emergency contact name" />
//       </Form.Item>
//     </Col>
//     <Col span={12}>
//       <Form.Item
//         name={["emergencyContact", "phone"]}
//         label="Emergency Contact Phone"
//         rules={[{ required: true, message: "Please input emergency contact phone!" }]}
//       >
//         <Input placeholder="Emergency contact phone" />
//       </Form.Item>
//     </Col>
//   </Row>

//   <Row gutter={16}>
//     <Col span={12}>
//       <Form.Item
//         name="numberOfDiagnoses"
//         label="Number of Diagnoses"
//         rules={[{ required: true, message: "Please input number of diagnoses!" }]}
//         initialValue={1}
//       >
//         <InputNumber min={1} max={16} style={{ width: "100%" }} placeholder="Number of diagnoses" />
//       </Form.Item>
//     </Col>
//     <Col span={12}>
//       <Form.Item
//         name="numberOfHospitalVisits"
//         label="Number of Hospital Visits"
//         rules={[{ required: true, message: "Please input number of hospital visits!" }]}
//         initialValue={0}
//       >
//         <InputNumber min={0} max={50} style={{ width: "100%" }} placeholder="Number of hospital visits" />
//       </Form.Item>
//     </Col>
//   </Row>
// </Form>

//       </Modal>
//     </div>
//   )
// }

// export default DoctorDashboard
// pages/DoctorDashboard.jsx
// src/pages/Doctor/DoctorDashboard.js
// src/pages/Doctor/DoctorDashboard.js
// src/pages/Doctor/DoctorDashboard.js
// src/pages/Doctor/DoctorDashboard.js
// src/pages/Doctor/DoctorDashboard.js
// src/pages/Doctor/DoctorDashboard.js
"use client"

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, Row, Col, Typography, Table } from 'antd'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { fetchPatients } from '../../store/slices/patientsSlice'
import RiskTag from '../../components/Charts/RiskTag'
import RiskSparkline from '../../components/Charts/RiskSparkline'
import moment from 'moment'

const { Title } = Typography

const DoctorDashboard = () => {
  const dispatch = useDispatch()
  const { patients = [], loading } = useSelector((s) => s.patients)
  const { user } = useSelector((s) => s.auth)

  useEffect(() => {
    if (user?.id) dispatch(fetchPatients({ doctorId: user.id }))
  }, [dispatch, user])

  // Threshold for high risk
  const HIGH_RISK_THRESHOLD = 0.8

  // Total Patients
  const totalPatients = patients.length

  // High-Risk Patients count
  const highRiskCount = patients.filter((p) => {
    const hist = Array.isArray(p.riskHistory) ? p.riskHistory : []
    const score = hist.length ? hist[hist.length - 1].score : 0
    return score > HIGH_RISK_THRESHOLD
  }).length

  // New Patients This Month
  const startOfMonth = moment().startOf('month')
  const newPatientsThisMonth = patients.filter((p) => {
    return p.createdAt && moment(p.createdAt).isAfter(startOfMonth)
  }).length

  // Patients With No Recent Visit (> 6 months)
  const noRecentVisitCount = patients.filter((p) => {
    const lastVisit = p.lastVisit ? moment(p.lastVisit) : null
    return !lastVisit || moment().diff(lastVisit, 'months') >= 6
  }).length

  // Risk Distribution counts
  const counts = { high: 0, medium: 0, low: 0 }
  patients.forEach((p) => {
    const hist = Array.isArray(p.riskHistory) ? p.riskHistory : []
    const score = hist.length ? hist[hist.length - 1].score : 0
    if (score > 0.8) counts.high++
    else if (score > 0.5) counts.medium++
    else counts.low++
  })

  // Prepare Stacked Data for BarChart
  const stackedData = [
    {
      name: 'Patients',
      High: counts.high,
      Medium: counts.medium,
      Low: counts.low
    }
  ]

  // Patients Over Time (grouped by month)
  const patientsByMonth = {}
  patients.forEach((p) => {
    if (p.createdAt) {
      const month = moment(p.createdAt).format('YYYY-MM')
      patientsByMonth[month] = (patientsByMonth[month] || 0) + 1
    }
  })

  const patientsOverTimeData = Object.entries(patientsByMonth).map(([month, count]) => ({
    month,
    count
  })).sort((a, b) => moment(a.month).diff(moment(b.month)))

  // Top High-Risk Patients
  const topPatients = [...patients]
    .map((p) => {
      const hist = Array.isArray(p.riskHistory) ? p.riskHistory : []
      const score = hist.length ? hist[hist.length - 1].score : 0
      return { ...p, latestRisk: score }
    })
    .sort((a, b) => b.latestRisk - a.latestRisk)
    .slice(0, 5)

  // Patients Without Recent Visit
  const patientsWithoutVisit = patients.filter((p) => {
    const lastVisit = p.lastVisit ? moment(p.lastVisit) : null
    return !lastVisit || moment().diff(lastVisit, 'months') >= 6
  })

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Doctor Dashboard
      </Title>

      {/* Top Row — Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={6}>
          <Card style={cardStyle}>
            <div style={cardTitle}>Total Patients</div>
            <div style={cardNumber}>{totalPatients}</div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card style={cardStyle}>
            <div style={cardTitle}>High-Risk Patients</div>
            <div style={cardNumber}>{highRiskCount}</div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card style={cardStyle}>
            <div style={cardTitle}>New Patients This Month</div>
            <div style={cardNumber}>{newPatientsThisMonth}</div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card style={cardStyle}>
            <div style={cardTitle}>Patients With No Recent Visit</div>
            <div style={cardNumber}>{noRecentVisitCount}</div>
          </Card>
        </Col>
      </Row>

      {/* Middle Row — Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card title="Risk Distribution" style={chartCardStyle}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stackedData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="High" stackId="a" fill="#ff4d4f" />
                <Bar dataKey="Medium" stackId="a" fill="#fa8c16" />
                <Bar dataKey="Low" stackId="a" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Patients Over Time" style={chartCardStyle}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={patientsOverTimeData}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1890ff" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Bottom Row — Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Top High-Risk Patients" style={listCardStyle}>
            <Table
              columns={[
                {
                  title: 'Name',
                  key: 'name',
                  render: (r) => `${r.firstName} ${r.lastName}`
                },
                {
                  title: 'Latest Risk',
                  key: 'latestRisk',
                  render: (r) => <RiskTag score={r.latestRisk} />
                },
                {
                  title: 'Trend',
                  key: 'trend',
                  render: (r) => (
                    <RiskSparkline data={r.riskHistory || []} width={100} height={30} />
                  )
                }
              ]}
              dataSource={topPatients}
              pagination={false}
              size="small"
              rowKey="_id"
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Patients With No Recent Visit" style={listCardStyle}>
            <Table
              columns={[
                {
                  title: 'Name',
                  key: 'name',
                  render: (r) => `${r.firstName} ${r.lastName}`
                },
                {
                  title: 'Last Visit',
                  key: 'lastVisit',
                  render: (r) =>
                    r.lastVisit ? moment(r.lastVisit).format('YYYY-MM-DD') : 'No Visit'
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status'
                }
              ]}
              dataSource={patientsWithoutVisit}
              pagination={false}
              size="small"
              rowKey="_id"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
const cardStyle = {
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  backgroundColor: '#F5F5F5',
  padding: '12px'
}

const cardTitle = {
  fontSize: 18,
  fontWeight: 600,
  color: '#333'
}

const cardNumber = {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#4CAF50'
}

const chartCardStyle = {
  borderRadius: '8px',
  padding: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  backgroundColor: '#FFFFFF'
}

const listCardStyle = {
  borderRadius: '8px',
  padding: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  backgroundColor: '#FFFFFF'
}

export default DoctorDashboard
