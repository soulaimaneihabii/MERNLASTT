"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  notification,
  Tooltip,
  Select,
  Typography,
  InputNumber, // Add this import
} from "antd"
import {
  EyeOutlined,
  ExperimentOutlined,
  UserAddOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  BarChartOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import {
  fetchPatients,
  createPatient,
  updatePatient,
  deletePatient,
  clearError,
} from "../../store/slices/patientsSlice"
import { fetchPredictions } from "../../store/slices/predictionsSlice"
import { Column, Pie } from "@ant-design/plots"

const { Option } = Select
const { Title, Text } = Typography


const DoctorDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { patients = [], total = 0, loading, error } = useSelector((state) => state.patients)
  const { predictions = [] } = useSelector((state) => state.predictions)
  const { user } = useSelector((state) => state.auth)

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPatients({ doctorId: user.id }))
      dispatch(fetchPredictions({ doctorId: user.id }))
    }
  }, [dispatch, user?.id])

  useEffect(() => {
    if (error) {
      notification.error({
        message: "Error",
        description: error,
      })
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleCreatePatient = () => {
    setEditingPatient(null)
    setIsModalVisible(true)
    form.resetFields()
    // Set default values for required fields
    form.setFieldsValue({
      numberOfDiagnoses: 1,
      numberOfHospitalVisits: 0,
      status: "active",
    })
  }

  const handleEditPatient = (patient) => {
    setEditingPatient(patient)
    setIsModalVisible(true)
    form.setFieldsValue(patient)
  }

  const handleDeletePatient = async (patientId) => {
    try {
      await dispatch(deletePatient(patientId)).unwrap()
      notification.success({
        message: "Success",
        description: "Patient deleted successfully",
      })
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to delete patient",
      })
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingPatient) {
        await dispatch(updatePatient({ id: editingPatient.id, patientData: values })).unwrap()
        notification.success({
          message: "Success",
          description: "Patient updated successfully",
        })
      } else {
        await dispatch(
          createPatient({
            ...values,
            doctorId: user.id,
          }),
        ).unwrap()
        notification.success({
          message: "Success",
          description: "Patient account created successfully",
        })
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to save patient",
      })
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const columns = [
  {
  title: "Patient Name",
  key: "name",
  render: (record) => `${record.firstName} `,
},
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
  },
  {
    title: "Age",
    dataIndex: "age",
    key: "age",
  },
  {
    title: "Gender",
    dataIndex: "gender",
    key: "gender",
    render: (gender) => <Tag color={gender === "male" ? "blue" : "pink"}>{gender?.toUpperCase()}</Tag>,
  },
  {
    title: "Medical Data",
    dataIndex: "medicalData",
    key: "medicalData",
    render: (medicalData) => (
      <Tag color={medicalData ? "green" : "orange"}>{medicalData ? "Complete" : "Incomplete"}</Tag>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => <Tag color={status === "active" ? "green" : "orange"}>{status?.toUpperCase()}</Tag>,
  },
  {
    title: "Actions",
    key: "actions",
    render: (_, record) => (
      <Space size="middle">
        <Tooltip title="View Patient Details">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/doctor/patients/${record.id}`)}
          >
            View
          </Button>
        </Tooltip>

        <Tooltip title="Edit Patient">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEditPatient(record)}
          >
            Edit
          </Button>
        </Tooltip>

        <Tooltip title="Add Medical Info">
          <Button 
            type="link" 
            icon={<MedicineBoxOutlined />} 
            onClick={() => navigate(`/doctor/patients/${record.id}/medical-info`)}
          >
            Medical Info
          </Button>
        </Tooltip>

        <Tooltip title="Delete Patient">
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this patient?",
                content: "This action cannot be undone.",
                onOk: () => handleDeletePatient(record.id),
              })
            }}
          >
            Delete
          </Button>
        </Tooltip>
      </Space>
    ),
  },
]


  // Chart data preparation
  const activePatients = patients.filter((p) => p?.status === "active").length
  const inactivePatients = patients.filter((p) => p?.status === "inactive").length
  const patientsWithMedicalData = patients.filter((p) => p?.medicalData).length

  const ageGroups = patients.reduce(
    (acc, patient) => {
      const age = patient?.age || 0
      if (age < 30) acc["<30"]++
      else if (age < 50) acc["30-49"]++
      else if (age < 70) acc["50-69"]++
      else acc["70+"]++
      return acc
    },
    { "<30": 0, "30-49": 0, "50-69": 0, "70+": 0 },
  )

  const ageData = Object.entries(ageGroups).map(([range, count]) => ({
    age: range,
    count: count,
  }))

  const statusData = [
    { type: "Active", value: activePatients },
    { type: "Inactive", value: inactivePatients },
  ].filter((item) => item.value > 0) // Filter out zero values

  const columnConfig = {
    data: ageData,
    xField: "age",
    yField: "count",
    color: "#1890ff",
    columnWidthRatio: 0.8,
    meta: {
      count: {
        alias: "Number of Patients",
      },
    },
  }

  const pieConfig = {
    data: statusData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    label: {
      type: "outer",
      content: "{name} {percentage}",
    },
    legend: {
      position: "bottom",
    },
  }

  // Generate age options (1-120)
  const ageOptions = Array.from({ length: 120 }, (_, i) => (
    <Option key={i + 1} value={i + 1}>
      {i + 1}
    </Option>
  ))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="My Patients" value={total} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Patients"
                value={activePatients}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="With Medical Data"
                value={patientsWithMedicalData}
                prefix={<MedicineBoxOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Predictions"
                value={predictions.length}
                prefix={<ExperimentOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="Patients by Age Group" extra={<BarChartOutlined />}>
              {ageData.length > 0 && ageData.some((item) => item.count > 0) ? (
                <Column {...columnConfig} height={250} />
              ) : (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Text type="secondary">No patient data available</Text>
                </div>
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Patient Status Distribution">
              {statusData.length > 0 && statusData.some((item) => item.value > 0) ? (
                <Pie {...pieConfig} height={250} />
              ) : (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Text type="secondary">No patient data available</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate("/doctor/patients/new")}>
              Register New Patient
            </Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate("/doctor/patients/:id/medical-info")}>
              Medical information
            </Button>
            <Button icon={<MedicineBoxOutlined />} onClick={() => navigate("/doctor/medical-info")}>
              Manage Medical Info
            </Button>
            <Button icon={<ExperimentOutlined />} onClick={() => navigate("/doctor/predictions")}>
              AI Predictions
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={patients}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          locale={{
            emptyText: loading ? "Loading patients..." : "No patients found",
          }}
        />
      </Card>

      <Modal
        title={editingPatient ? "Edit Patient" : "Create Patient Account"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={600}
      >
    <Form form={form} layout="vertical" name="patientForm">
  <Form.Item
    name="name"
    label="Patient Name"
    rules={[{ required: true, message: "Please input the patient name!" }]}
  >
    <Input />
  </Form.Item>

  <Form.Item
    name="email"
    label="Email"
    rules={[
      { required: true, message: "Please input the email!" },
      { type: "email", message: "Please enter a valid email!" },
    ]}
  >
    <Input />
  </Form.Item>

  {!editingPatient && (
    <Form.Item
      name="password"
      label="Password"
      rules={[
        { required: true, message: "Please input the password!" },
        { min: 6, message: "Password must be at least 6 characters!" },
      ]}
    >
      <Input.Password />
    </Form.Item>
  )}

  <Row gutter={16}>
    <Col span={12}>
      <Form.Item name="age" label="Age" rules={[{ required: true, message: "Please select age!" }]}>
        <Select placeholder="Select age" showSearch>
          {ageOptions}
        </Select>
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender!" }]}>
        <Select placeholder="Select gender">
          <Option value="male">Male</Option>
          <Option value="female">Female</Option>
          <Option value="other">Other</Option>
        </Select>
      </Form.Item>
    </Col>
  </Row>

  <Form.Item name="phone" label="Phone Number">
    <Input />
  </Form.Item>

  {/* Address Section */}
  <Title level={5}>Address</Title>

  <Row gutter={16}>
    <Col span={12}>
      <Form.Item name={["address", "street"]} label="Street">
        <Input placeholder="Street" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item name={["address", "city"]} label="City">
        <Input placeholder="City" />
      </Form.Item>
    </Col>
  </Row>

  <Row gutter={16}>
    <Col span={12}>
      <Form.Item name={["address", "state"]} label="State">
        <Input placeholder="State" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item name={["address", "zipCode"]} label="Zip Code">
        <Input placeholder="Zip Code" />
      </Form.Item>
    </Col>
  </Row>

  <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select status!" }]}>
    <Select placeholder="Select status">
      <Option value="active">Active</Option>
      <Option value="inactive">Inactive</Option>
    </Select>
  </Form.Item>

  <Row gutter={16}>
    <Col span={12}>
      <Form.Item
        name={["emergencyContact", "name"]}
        label="Emergency Contact Name"
        rules={[{ required: true, message: "Please input emergency contact name!" }]}
      >
        <Input placeholder="Emergency contact name" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name={["emergencyContact", "phone"]}
        label="Emergency Contact Phone"
        rules={[{ required: true, message: "Please input emergency contact phone!" }]}
      >
        <Input placeholder="Emergency contact phone" />
      </Form.Item>
    </Col>
  </Row>

  <Row gutter={16}>
    <Col span={12}>
      <Form.Item
        name="numberOfDiagnoses"
        label="Number of Diagnoses"
        rules={[{ required: true, message: "Please input number of diagnoses!" }]}
        initialValue={1}
      >
        <InputNumber min={1} max={16} style={{ width: "100%" }} placeholder="Number of diagnoses" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="numberOfHospitalVisits"
        label="Number of Hospital Visits"
        rules={[{ required: true, message: "Please input number of hospital visits!" }]}
        initialValue={0}
      >
        <InputNumber min={0} max={50} style={{ width: "100%" }} placeholder="Number of hospital visits" />
      </Form.Item>
    </Col>
  </Row>
</Form>

      </Modal>
    </div>
  )
}

export default DoctorDashboard
