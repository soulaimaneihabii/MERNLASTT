import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, Descriptions, Spin, Button } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import { useDispatch, useSelector } from "react-redux"
import { fetchPatientById } from "../../store/slices/patientsSlice"

const PatientDetailsPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentPatient, loading } = useSelector((state) => state.patients)

  useEffect(() => {
    if (id) {
      dispatch(fetchPatientById(id))
    }
  }, [dispatch, id])

  if (loading || !currentPatient) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
  }

  return (
    <div style={{ padding: 24 }}>
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate("/doctor")}
        style={{ marginBottom: 16 }}
      >
        Back to Dashboard
      </Button>

      <Card title={`Patient Details: ${currentPatient.fullName || currentPatient.name}`}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Full Name">{currentPatient.fullName || currentPatient.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{currentPatient.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{currentPatient.phone}</Descriptions.Item>
          <Descriptions.Item label="Age">{currentPatient.age}</Descriptions.Item>
          <Descriptions.Item label="Gender">{currentPatient.gender}</Descriptions.Item>
          <Descriptions.Item label="Race">{currentPatient.race}</Descriptions.Item>
          <Descriptions.Item label="Status">{currentPatient.status}</Descriptions.Item>
          <Descriptions.Item label="Address">
            {currentPatient.address?.street}, {currentPatient.address?.city}, {currentPatient.address?.state}, {currentPatient.address?.zipCode}
          </Descriptions.Item>
          <Descriptions.Item label="Emergency Contact">
            {currentPatient.emergencyContact?.name} ({currentPatient.emergencyContact?.phone})
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default PatientDetailsPage
