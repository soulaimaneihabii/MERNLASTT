"use client"

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, Row, Col, Typography, Table } from 'antd'
import {
  FiUsers,
  FiAlertTriangle,
  FiUserPlus,
  FiClock
} from 'react-icons/fi'
import Chart from 'react-apexcharts'
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

  const HIGH_RISK_THRESHOLD = 0.8
  const totalPatients = patients.length

  const highRiskCount = patients.filter((p) => {
    const hist = Array.isArray(p.riskHistory) ? p.riskHistory : []
    const score = hist.length ? hist[hist.length - 1].score : 0
    return score > HIGH_RISK_THRESHOLD
  }).length

  const startOfMonth = moment().startOf('month')
  const newPatientsThisMonth = patients.filter((p) => {
    return p.createdAt && moment(p.createdAt).isAfter(startOfMonth)
  }).length

  const noRecentVisitCount = patients.filter((p) => {
    const lastVisit = p.lastVisit ? moment(p.lastVisit) : null
    return !lastVisit || moment().diff(lastVisit, 'months') >= 6
  }).length

  const counts = { high: 0, medium: 0, low: 0 }
  patients.forEach((p) => {
    const hist = Array.isArray(p.riskHistory) ? p.riskHistory : []
    const score = hist.length ? hist[hist.length - 1].score : 0
    if (score > 0.8) counts.high++
    else if (score > 0.5) counts.medium++
    else counts.low++
  })

  const stackedData = {
    series: [
      {
        name: 'High',
        data: [counts.high]
      },
      {
        name: 'Medium',
        data: [counts.medium]
      },
      {
        name: 'Low',
        data: [counts.low]
      }
    ],
    options: {
      chart: {
        type: 'bar',
        stacked: true,
        toolbar: { show: false }
      },
      colors: ['#ff4d4f', '#faad14', '#52c41a'],
      xaxis: {
        categories: ['Patients']
      },
      legend: {
        position: 'bottom'
      }
    }
  }

  const patientsByMonth = {}
  patients.forEach((p) => {
    if (p.createdAt) {
      const month = moment(p.createdAt).format('YYYY-MM')
      patientsByMonth[month] = (patientsByMonth[month] || 0) + 1
    }
  })

  const patientsOverTimeData = {
    series: [
      {
        name: 'Patients',
        data: Object.entries(patientsByMonth)
          .sort(([a], [b]) => moment(a).diff(moment(b)))
          .map(([, count]) => count)
      }
    ],
    options: {
      chart: {
        type: 'line',
        toolbar: { show: false }
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        categories: Object.entries(patientsByMonth)
          .sort(([a], [b]) => moment(a).diff(moment(b)))
          .map(([month]) => month)
      }
    }
  }

  const topPatients = [...patients]
    .map((p) => {
      const hist = Array.isArray(p.riskHistory) ? p.riskHistory : []
      const score = hist.length ? hist[hist.length - 1].score : 0
      return { ...p, latestRisk: score }
    })
    .sort((a, b) => b.latestRisk - a.latestRisk)
    .slice(0, 5)

  const patientsWithoutVisit = patients.filter((p) => {
    const lastVisit = p.lastVisit ? moment(p.lastVisit) : null
    return !lastVisit || moment().diff(lastVisit, 'months') >= 6
  })

  const statCards = [
    {
      label: 'Total Patients',
      value: totalPatients,
      icon: <FiUsers size={28} />,
      color: '#e3f2fd'
    },
    {
      label: 'High-Risk Patients',
      value: highRiskCount,
      icon: <FiAlertTriangle size={28} />,
      color: '#fdecea'
    },
    {
      label: 'New This Month',
      value: newPatientsThisMonth,
      icon: <FiUserPlus size={28} />,
      color: '#e8f5e9'
    },
    {
      label: 'No Recent Visit',
      value: noRecentVisitCount,
      icon: <FiClock size={28} />,
      color: '#fff3e0'
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ fontWeight: 700, marginBottom: 24 }}>Doctor Dashboard</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((item, i) => (
          <Col xs={24} md={6} key={i}>
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Risk Distribution">
            <Chart options={stackedData.options} series={stackedData.series} type="bar" height={300} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Patients Over Time">
            <Chart options={patientsOverTimeData.options} series={patientsOverTimeData.series} type="line" height={300} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Top High-Risk Patients">
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
          <Card title="Patients With No Recent Visit">
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
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  padding: '20px',
  transition: 'transform 0.2s ease',
  cursor: 'pointer'
}

const cardTitle = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 4,
  color: '#333'
}

const cardNumber = {
  fontSize: 28,
  fontWeight: 700,
  color: '#111'
}

export default DoctorDashboard
