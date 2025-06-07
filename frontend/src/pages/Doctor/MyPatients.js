// Full code too big to post in one message — I will post it in parts (because of message size)

// PART 1: Imports + State + Handlers + Chart Data

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
  DatePicker,  message 
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
import { fetchPatients, deletePatient,updatePatient } from '../../store/slices/patientsSlice'
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
  const { user } = useSelector((s) => s.auth)

  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentPatient, setCurrentPatient] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (user?.id) dispatch(fetchPatients({ doctorId: user.id }))
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
  .then(() => {
    message.success('Patient updated successfully!');
  })
  .catch(() => {
    message.error('Failed to update patient.');
  });
  setEditModalVisible(false);
  setCurrentPatient(null);
};


  const closeModal = () => {
    setEditModalVisible(false)
    setCurrentPatient(null)
  }

  const resetFilters = () => {
    setSearch('')
    setRiskFilter('')
    setStatusFilter('')
  }

  // Filter + Search + Risk filter + Status filter
  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
      const matchesSearch = fullName.includes(search.toLowerCase())

      const hist = Array.isArray(p.riskHistory) ? p.riskHistory : []
      const score = hist.length ? hist[hist.length - 1].score : 0
      const riskLevel =
        score > 0.8 ? 'High' : score > 0.5 ? 'Medium' : 'Low'

      const matchesRisk = riskFilter ? riskLevel === riskFilter : true
      const matchesStatus = statusFilter ? p.status === statusFilter : true

      return matchesSearch && matchesRisk && matchesStatus
    })
  }, [patients, search, riskFilter, statusFilter])

  // Chart data
  const counts = { high: 0, medium: 0, low: 0 }
  patients.forEach((p) => {
    const hist = Array.isArray(p.riskHistory) ? p.riskHistory : []
    const score = hist.length ? hist[hist.length - 1].score : 0
    if (score > 0.8) counts.high++
    else if (score > 0.5) counts.medium++
    else counts.low++
  })

  const stackedData = [
    {
      name: 'Patients',
      High: counts.high,
      Medium: counts.medium,
      Low: counts.low
    }
  ]

  // Columns
  const columns = [
    {
      title: 'Name',
      key: 'name',
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
      render: (r) => (
        <Button type="link" onClick={() => handleEdit(r)}>
          {`${r.firstName} ${r.lastName}`}
        </Button>
      )
    },
    {
      title: 'Age',
      key: 'age',
      sorter: (a, b) => {
        const ageA = moment().diff(a.birthDate, 'years')
        const ageB = moment().diff(b.birthDate, 'years')
        return ageA - ageB
      },
      render: (r) => moment().diff(r.birthDate, 'years')
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (g) => <Tag color={g === 'male' ? 'blue' : 'pink'}>{g}</Tag>
    },
    {
      title: 'Last Visit',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      sorter: (a, b) => new Date(a.lastVisit) - new Date(b.lastVisit)
    },
    {
      title: 'Risk Category',
      key: 'latestRisk',
      sorter: (a, b) => {
        const scoreA = (Array.isArray(a.riskHistory) && a.riskHistory.length) ? a.riskHistory[a.riskHistory.length - 1].score : 0
        const scoreB = (Array.isArray(b.riskHistory) && b.riskHistory.length) ? b.riskHistory[b.riskHistory.length - 1].score : 0
        return scoreA - scoreB
      },
      render: (record) => {
        const hist = Array.isArray(record.riskHistory) ? record.riskHistory : []
        const score = hist.length ? hist[hist.length - 1].score : 0
        return <RiskTag score={score} customColors={{ Low: '#82ca9d', Medium: '#f2b01e', High: '#ff4d4f' }} />
      }
    },
    {
      title: 'Risk Trend',
      key: 'trend',
      render: (record) => (
        <RiskSparkline
          data={record.riskHistory || []}
          width={120}
          height={30}
          stroke="#999"
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={s === 'active' ? 'green' : 'orange'}>{s}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, r) => (
        <Space>
          <Tooltip title="View">
            <Button
              icon={<EyeOutlined />}
              onClick={() => navigate(`/doctor/patients/${r._id}`)}
              type="text"
            />
          </Tooltip>
          <Tooltip title="Medical Info">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => navigate('/doctor/medical-info')}
              type="text"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(r)}
              type="text"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(r._id)}
              type="text"
            />
          </Tooltip>
          <Tooltip title="Predict">
            <Button
              icon={<RocketOutlined />}
              onClick={() => navigate(`/doctor/predictions?patient=${r._id}`)}
              type="text"
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div>
      {/* Header Bar */}
      <Card
        style={{
          marginBottom: 16,
          backgroundColor: '#F5F5F5',
          padding: '16px'
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Input.Search
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={riskFilter}
              onChange={(v) => setRiskFilter(v)}
              placeholder="Risk Level"
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/doctor/patients/new')}
            >
              Add Patient
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Chart Above Table */}
      <Card title="Risk Distribution" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stackedData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <ChartTooltip />
            <Legend />
            <Bar dataKey="High" stackId="a" fill="#ff4d4f" />
            <Bar dataKey="Medium" stackId="a" fill="#f2b01e" />
            <Bar dataKey="Low" stackId="a" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Filter Chips */}
      {(riskFilter || statusFilter) && (
        <Space style={{ marginBottom: 16 }}>
          {riskFilter && (
            <Tag
              closable
              onClose={() => setRiskFilter('')}
              icon={<CloseCircleOutlined />}
            >
              Risk: {riskFilter}
            </Tag>
          )}
          {statusFilter && (
            <Tag
              closable
              onClose={() => setStatusFilter('')}
              icon={<CloseCircleOutlined />}
            >
              Status: {statusFilter}
            </Tag>
          )}
          <Button onClick={resetFilters}>Reset Filters</Button>
        </Space>
      )}

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 20, pageSizeOptions: ['10', '20', '50'], showSizeChanger: true }}
        locale={{
          emptyText: (
            <div>
              No patients found.{' '}
              <Button type="link" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          )
        }}
      />

      {/* Edit Modal with Form */}
      <Modal
        open={editModalVisible}
        title="Edit Patient"
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="birthDate" label="Birth Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
            <Select>
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MyPatients
