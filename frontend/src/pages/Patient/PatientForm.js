"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  Form,
  Select,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Steps,
  Space,
  notification,
  Divider,
} from "antd"
import { UserOutlined, MedicineBoxOutlined, ExperimentOutlined, CheckCircleOutlined } from "@ant-design/icons"
import { createPrediction } from "../../store/slices/predictionsSlice"

const { Title, Text } = Typography
const { Option } = Select

const PatientForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.predictions)
  const { user } = useSelector((state) => state.auth)

  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Personal Info",
      icon: <UserOutlined />,
    },
    {
      title: "Medical History",
      icon: <MedicineBoxOutlined />,
    },
    {
      title: "Lab Results & Procedures",
      icon: <ExperimentOutlined />,
    },
    {
      title: "Review & Submit",
      icon: <CheckCircleOutlined />,
    },
  ]

  const onFinish = async (values) => {
    try {
      await dispatch(
        createPrediction({
          patientId: user.id,
          medicalData: values,
        }),
      ).unwrap()

      notification.success({
        message: "Success",
        description: "Medical form submitted successfully. Prediction generated!",
      })

      navigate("/patient")
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to submit form",
      })
    }
  }

  const nextStep = () => {
    form
      .validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1)
      })
      .catch(() => {
        notification.warning({
          message: "Validation Error",
          description: "Please fill in all required fields before proceeding.",
        })
      })
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="age" label="Age" rules={[{ required: true, message: "Please input age!" }]}>
                <InputNumber min={1} max={120} style={{ width: "100%" }} placeholder="Enter age" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender!" }]}>
                <Select placeholder="Select gender">
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="race" label="Race" rules={[{ required: true, message: "Please select race!" }]}>
                <Select placeholder="Select race">
                  <Option value="caucasian">Caucasian</Option>
                  <Option value="african_american">African American</Option>
                  <Option value="hispanic">Hispanic</Option>
                  <Option value="asian">Asian</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="time_in_hospital"
                label="Time in Hospital (days)"
                rules={[{ required: true, message: "Please input time in hospital!" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Days spent in hospital" />
              </Form.Item>
            </Col>
          </Row>
        )

      case 1:
        return (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="diag_1"
                label="Primary Diagnosis"
                rules={[{ required: true, message: "Please select primary diagnosis!" }]}
              >
                <Select placeholder="Select primary diagnosis">
                  <Option value="diabetes_type1">Diabetes Type 1</Option>
                  <Option value="diabetes_type2">Diabetes Type 2</Option>
                  <Option value="hypertension">Hypertension</Option>
                  <Option value="coronary_artery_disease">Coronary Artery Disease</Option>
                  <Option value="congestive_heart_failure">Congestive Heart Failure</Option>
                  <Option value="chronic_kidney_disease">Chronic Kidney Disease</Option>
                  <Option value="copd">COPD</Option>
                  <Option value="asthma">Asthma</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="diag_2" label="Secondary Diagnosis">
                <Select placeholder="Select secondary diagnosis">
                  <Option value="diabetes">Diabetes</Option>
                  <Option value="hypertension">Hypertension</Option>
                  <Option value="heart_disease">Heart Disease</Option>
                  <Option value="kidney_disease">Kidney Disease</Option>
                  <Option value="none">None</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="diag_3" label="Additional Diagnosis">
                <Select placeholder="Select additional diagnosis">
                  <Option value="diabetes">Diabetes</Option>
                  <Option value="hypertension">Hypertension</Option>
                  <Option value="heart_disease">Heart Disease</Option>
                  <Option value="kidney_disease">Kidney Disease</Option>
                  <Option value="none">None</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="max_glu_serum"
                label="Max Glucose Serum"
                rules={[{ required: true, message: "Please select glucose serum level!" }]}
              >
                <Select placeholder="Select glucose serum level">
                  <Option value="none">None</Option>
                  <Option value="norm">Normal</Option>
                  <Option value=">200">{">200"}</Option>
                  <Option value=">300">{">300"}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="A1Cresult"
                label="A1C Result"
                rules={[{ required: true, message: "Please select A1C result!" }]}
              >
                <Select placeholder="Select A1C result">
                  <Option value="none">None</Option>
                  <Option value="norm">Normal</Option>
                  <Option value=">7">{">7"}</Option>
                  <Option value=">8">{">8"}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="insulin"
                label="Insulin Usage"
                rules={[{ required: true, message: "Please select insulin usage!" }]}
              >
                <Select placeholder="Select insulin usage">
                  <Option value="no">No</Option>
                  <Option value="down">Down</Option>
                  <Option value="steady">Steady</Option>
                  <Option value="up">Up</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="metformin"
                label="Metformin Usage"
                rules={[{ required: true, message: "Please select metformin usage!" }]}
              >
                <Select placeholder="Select metformin usage">
                  <Option value="no">No</Option>
                  <Option value="down">Down</Option>
                  <Option value="steady">Steady</Option>
                  <Option value="up">Up</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="diabetesMed"
                label="Diabetes Medication"
                rules={[{ required: true, message: "Please select diabetes medication status!" }]}
              >
                <Select placeholder="Select diabetes medication">
                  <Option value="yes">Yes</Option>
                  <Option value="no">No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )

      case 2:
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="num_lab_procedures"
                label="Number of Lab Procedures"
                rules={[{ required: true, message: "Please input number of lab procedures!" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Number of lab procedures" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="num_procedures"
                label="Number of Procedures"
                rules={[{ required: true, message: "Please input number of procedures!" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Number of procedures" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="num_medications"
                label="Number of Medications"
                rules={[{ required: true, message: "Please input number of medications!" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Number of medications" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="number_outpatient"
                label="Outpatient Visits"
                rules={[{ required: true, message: "Please input outpatient visits!" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Number of outpatient visits" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="number_emergency"
                label="Emergency Visits"
                rules={[{ required: true, message: "Please input emergency visits!" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Number of emergency visits" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="number_inpatient"
                label="Inpatient Visits"
                rules={[{ required: true, message: "Please input inpatient visits!" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Number of inpatient visits" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="number_diagnoses"
                label="Number of Diagnoses"
                rules={[{ required: true, message: "Please input number of diagnoses!" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Number of diagnoses" />
              </Form.Item>
            </Col>
          </Row>
        )

      case 3:
        return (
          <div>
            <Title level={4}>Review Your Information</Title>
            <Text type="secondary">
              Please review all the information below before submitting. This data will be used to generate your medical
              prediction using our AI model.
            </Text>
            <Divider />
            <Row gutter={16}>
              <Col span={24}>
                <Card title="AI Model Input Fields" size="small">
                  <Text>
                    <strong>Required fields for diabetes prediction:</strong>
                    <br />
                    Personal: age, gender, race
                    <br />
                    Diagnoses: diag_1, diag_2, diag_3
                    <br />
                    Lab Results: max_glu_serum, A1Cresult
                    <br />
                    Medications: insulin, metformin, diabetesMed
                    <br />
                    Hospital Data: time_in_hospital, num_lab_procedures, num_procedures, num_medications
                    <br />
                    Visit History: number_outpatient, number_emergency, number_inpatient, number_diagnoses
                  </Text>
                </Card>
              </Col>
            </Row>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Medical Information Form</Title>
        <Text type="secondary">
          Please fill out this comprehensive medical form to generate AI-powered diabetes risk predictions.
        </Text>
      </div>

      <Card>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            // Initialize all required fields
            age: null,
            gender: "",
            race: "",
            time_in_hospital: 0,
            diag_1: "",
            diag_2: "",
            diag_3: "",
            max_glu_serum: "",
            A1Cresult: "",
            insulin: "",
            metformin: "",
            diabetesMed: "",
            num_lab_procedures: 0,
            num_procedures: 0,
            num_medications: 0,
            number_outpatient: 0,
            number_emergency: 0,
            number_inpatient: 0,
            number_diagnoses: 0,
          }}
        >
          {renderStepContent()}

          <Divider />

          <div style={{ textAlign: "center" }}>
            <Space size="middle">
              {currentStep > 0 && <Button onClick={prevStep}>Previous</Button>}

              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={nextStep}>
                  Next
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                  Submit & Generate Prediction
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default PatientForm
