// MyPatients.jsx
"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Table,
  Button,
  Space,
  Tooltip,
  Tag,
  Modal,
  Typography,
  Input,
  Row,
  Col,
  Card,
  Select,
  Form,
  DatePicker,
  message
} from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  RocketOutlined,
  PlusOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { fetchPatients, deletePatient, updatePatient } from '../../store/slices/patientsSlice'
import { fetchDoctorDashboardStats } from '../../store/slices/analyticsSlice'
import RiskTag from '../../components/Charts/RiskTag'
import RiskSparkline from '../../components/Charts/RiskSparkline'
import moment from 'moment'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const { Title } = Typography
const { Option } = Select

const MyPatients = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { patients = [], loading } = useSelector((s) => s.patients)
  const { dashboardStats } = useSelector((s) => s.analytics)
  const { user } = useSelector((s) => s.auth)

  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentPatient, setCurrentPatient] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPatients({ doctorId: user.id }))
      dispatch(fetchDoctorDashboardStats())
    }
  }, [dispatch, user])

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete this patient?',
      content: 'This action cannot be undone.',
      onOk: () => dispatch(deletePatient(id))
    })
  }

  const handleEdit = (patient) => {
    setCurrentPatient(patient)
    form.setFieldsValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: moment(patient.birthDate),
      gender: patient.gender,
      status: patient.status
    })
    setEditModalVisible(true)
  }

  const handleEditSubmit = (values) => {
    dispatch(updatePatient({ id: currentPatient._id, patientData: values }))
      .unwrap()
      .then(() => message.success('Patient updated successfully!'))
      .catch(() => message.error('Failed to update patient.'))
    setEditModalVisible(false)
    setCurrentPatient(null)
  }

  const closeModal = () => {
    setEditModalVisible(false)
    setCurrentPatient(null)
  }

  const resetFilters = () => {
    setSearch('')
    setRiskFilter('')
    setStatusFilter('')
  }

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
      const matchesSearch = fullName.includes(search.toLowerCase())

      const hist = Array.isArray(p.riskHistory) ? p.riskHistory : []
      const score = hist.length ? hist[hist.length - 1].score : 0
      const riskLevel = score > 0.8 ? 'High' : score > 0.5 ? 'Medium' : 'Low'

      const matchesRisk = riskFilter ? riskLevel === riskFilter : true
      const matchesStatus = statusFilter ? p.status === statusFilter : true

      return matchesSearch && matchesRisk && matchesStatus
    })
  }, [patients, search, riskFilter, statusFilter])

  const riskDistribution = dashboardStats?.riskDistribution || []
  const riskCounts = { high: 0, medium: 0, low: 0 }
  riskDistribution.forEach((item) => {
    const key = item._id?.toLowerCase()
    if (key === 'high') riskCounts.high = item.count
    else if (key === 'medium') riskCounts.medium = item.count
    else if (key === 'low') riskCounts.low = item.count
  })

  const chartData = [
    {
      name: 'Predictions',
      High: riskCounts.high,
      Medium: riskCounts.medium,
      Low: riskCounts.low
    }
  ]

  const columns = [
    {
      title: 'Name', key: 'name', sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
      render: (r) => <Button type="link" onClick={() => handleEdit(r)}>{`${r.firstName} ${r.lastName}`}</Button>
    },
    { title: 'Age', key: 'age', sorter: (a, b) => moment().diff(a.birthDate, 'years') - moment().diff(b.birthDate, 'years'), render: (r) => moment().diff(r.birthDate, 'years') },
    { title: 'Gender', dataIndex: 'gender', key: 'gender', render: (g) => <Tag color={g === 'male' ? 'blue' : 'pink'}>{g}</Tag> },
    { title: 'Last Visit', dataIndex: 'lastVisit', key: 'lastVisit', sorter: (a, b) => new Date(a.lastVisit) - new Date(b.lastVisit) },
    {
      title: 'Risk Category', key: 'latestRisk', sorter: (a, b) => {
        const scoreA = a.riskHistory?.at(-1)?.score || 0
        const scoreB = b.riskHistory?.at(-1)?.score || 0
        return scoreA - scoreB
      },
      render: (r) => <RiskTag score={r.riskHistory?.at(-1)?.score || 0} customColors={{ Low: '#82ca9d', Medium: '#f2b01e', High: '#ff4d4f' }} />
    },
    {
      title: 'Risk Trend', key: 'trend', render: (r) => <RiskSparkline data={r.riskHistory || []} width={120} height={30} stroke="#999" />
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'active' ? 'green' : 'orange'}>{s}</Tag>
    },
    {
      title: 'Actions', key: 'actions', align: 'center', render: (_, r) => (
        <Space>
          <Tooltip title="View"><Button icon={<EyeOutlined />} onClick={() => navigate(`/doctor/patients/${r._id}`)} type="text" /></Tooltip>
          <Tooltip title="Medical Info"><Button icon={<InfoCircleOutlined />} onClick={() => navigate('/doctor/medical-info')} type="text" /></Tooltip>
          <Tooltip title="Edit"><Button icon={<EditOutlined />} onClick={() => handleEdit(r)} type="text" /></Tooltip>
          <Tooltip title="Delete"><Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(r._id)} type="text" /></Tooltip>
          <Tooltip title="Predict"><Button icon={<RocketOutlined />} onClick={() => navigate(`/doctor/predictions?patient=${r._id}`)} type="text" /></Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16, backgroundColor: '#F5F5F5', padding: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}><Input.Search placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} allowClear /></Col>
          <Col xs={12} md={4}><Select value={riskFilter} onChange={(v) => setRiskFilter(v)} placeholder="Risk Level" allowClear style={{ width: '100%' }}><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Col>
          <Col xs={12} md={4}><Select value={statusFilter} onChange={(v) => setStatusFilter(v)} placeholder="Status" allowClear style={{ width: '100%' }}><Option value="active">Active</Option><Option value="inactive">Inactive</Option></Select></Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/doctor/patients/new')}>Add Patient</Button></Col>
        </Row>
      </Card>

      <Card title="Risk Distribution" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <ChartTooltip />
            <Legend />
            <Bar dataKey="High" fill="#ff4d4f" label={{ position: 'top' }} />
            <Bar dataKey="Medium" fill="#f2b01e" label={{ position: 'top' }} />
            <Bar dataKey="Low" fill="#82ca9d" label={{ position: 'top' }} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Table columns={columns} dataSource={filtered} rowKey="_id" loading={loading} pagination={{ pageSize: 20 }} />

      <Modal open={editModalVisible} title="Edit Patient" onCancel={closeModal} onOk={() => form.submit()} okText="Save">
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="birthDate" label="Birth Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="gender" label="Gender" rules={[{ required: true }]}><Select><Option value="male">Male</Option><Option value="female">Female</Option><Option value="other">Other</Option></Select></Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select><Option value="active">Active</Option><Option value="inactive">Inactive</Option></Select></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MyPatients
