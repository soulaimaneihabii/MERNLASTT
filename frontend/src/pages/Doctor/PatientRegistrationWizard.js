"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  Form,
  Button,
  Steps,
  Card,
  Row,
  Col,
  Typography,
  notification,
  Input,
  Select,
  InputNumber,
  Upload,
  Divider,
  DatePicker,
} from "antd"
import {
  UserOutlined,
  MedicineBoxOutlined,
  FileOutlined,
  UploadOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import { createPatient } from "../../store/slices/patientsSlice"

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

const PatientRegistrationWizard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.patients)
  const { user } = useSelector((state) => state.auth)

  const [currentStep, setCurrentStep] = useState(0)
  const [accountForm] = Form.useForm()
  const [medicalForm] = Form.useForm()
  const [fileForm] = Form.useForm()
  const [fileList, setFileList] = useState([])
  
const [formData, setFormData] = useState({
  primaryDiagnosis: '',
  // other fields...
});
  const steps = [
    {
      title: "Account Information",
      icon: <UserOutlined />,
      description: "Basic patient details",
    },
    {
      title: "Medical Information",
      icon: <MedicineBoxOutlined />,
      description: "Health data",
    },
    {
      title: "Medical Files",
      icon: <FileOutlined />,
      description: "Upload documents",
    },
  ]

  const nextStep = async () => {
    try {
      if (currentStep === 0) {
        const accountValues = await accountForm.validateFields()
        console.log("📝 Account form values:", accountValues)
        setFormData({ ...formData, ...accountValues })
      } else if (currentStep === 1) {
        const medicalValues = await medicalForm.validateFields()
        console.log("📝 Medical form values:", medicalValues)
        setFormData({ ...formData, ...medicalValues })
      }
      setCurrentStep(currentStep + 1)
    } catch (error) {
      console.error("❌ Form validation error:", error)
      notification.error({
        message: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
      })
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  const handleSubmit = async () => {
    try {
      // First, validate the current form (file form)
      await fileForm.validateFields()

      // Generate unique ID
      const uid = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Process uploaded files
      const medicalFiles = fileList.map((file) => ({
        id: file.uid,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.response?.url || URL.createObjectURL(file.originFileObj),
        uploadDate: new Date().toISOString(),
      }))

      // Get all form values from all steps - FIXED VERSION
      const accountValues = accountForm.getFieldsValue(true) // true = include nested fields
      const medicalValues = medicalForm.getFieldsValue(true)

      console.log("🔍 Account values (with nested):", accountValues)
      console.log("🔍 Medical values:", medicalValues)
      console.log("🔍 Stored form data:", formData)

      // Merge all form data - prioritize current form values over stored state
      const allFormData = {
        ...formData,
        ...accountValues,
        ...medicalValues,
      }

      console.log("🔍 All merged form data:", allFormData)

      // Format the complete data according to backend schema
     const completeData = {
  // Basic Information
  firstName: allFormData.firstName,
  lastName: allFormData.lastName,
  email: allFormData.email,
  password: allFormData.password,
  phone: allFormData.phone,
  gender: allFormData.gender,
  dateOfBirth: allFormData.dateOfBirth ? allFormData.dateOfBirth.format("YYYY-MM-DD") : null,
  race: allFormData.race,
  age: allFormData.age, // Add age field

  // Address (match backend schema)
  address: {
    street: allFormData.address?.street || allFormData.street,
    city: allFormData.address?.city || allFormData.city,
    state: allFormData.address?.state || allFormData.state,
    zipCode: allFormData.address?.zipCode || allFormData.zipCode,
  },

  // Diagnosis (match backend field name)
  diag_1: allFormData.primaryDiagnosis,
  diag_2: null,
  diag_3: null,

  // Test Results (add default values)
  max_glu_serum: "None",
  A1Cresult: "None",
  insulin: "No",
  metformin: "No",
  diabetesMed: "No",

  // Hospital Statistics
  time_in_hospital: allFormData.timeInHospital || 0,
  num_lab_procedures: allFormData.numberOfLabProcedures || 0,
  num_procedures: allFormData.numberOfProcedures || 0,
  num_medications: allFormData.numberOfMedications || 0,
  number_outpatient: allFormData.numberOfOutpatientVisits || 0,
  number_emergency: allFormData.numberOfEmergencyVisits || 0,
  number_inpatient: allFormData.numberOfInpatientVisits || 0,
  number_diagnoses: allFormData.numberOfDiagnoses || 1,

  // Emergency Contact
  emergencyContact: {
    name: allFormData.emergencyContact?.name,
    phone: allFormData.emergencyContact?.phone,
    relationship: allFormData.emergencyContact?.relationship,
  },

  // System fields
  uid: uid,
  doctor: user.id, // Changed from doctorId to doctor to match schema
  medicalFiles: medicalFiles,
}
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}


      // Update the required fields check in handleSubmit:
const requiredFields = [
  { field: "firstName", value: completeData.firstName },
  { field: "lastName", value: completeData.lastName },
  { field: "email", value: completeData.email },
  { field: "password", value: completeData.password },
  { field: "phone", value: completeData.phone },
  { field: "gender", value: completeData.gender },
  { field: "dateOfBirth", value: completeData.dateOfBirth },
  { field: "race", value: completeData.race },
  { field: "age", value: completeData.age },
  { field: "address.street", value: completeData.address.street },
  { field: "address.city", value: completeData.address.city },
  { field: "address.state", value: completeData.address.state },
  { field: "address.zipCode", value: completeData.address.zipCode },
  { field: "diag_1", value: completeData.diag_1 },
  { field: "emergencyContact.name", value: completeData.emergencyContact.name },
  { field: "emergencyContact.phone", value: completeData.emergencyContact.phone },
  { field: "emergencyContact.relationship", value: completeData.emergencyContact.relationship },
  { field: "time_in_hospital", value: completeData.time_in_hospital },
  { field: "num_lab_procedures", value: completeData.num_lab_procedures },
  { field: "num_procedures", value: completeData.num_procedures },
  { field: "num_medications", value: completeData.num_medications },
  { field: "number_outpatient", value: completeData.number_outpatient },
  { field: "number_emergency", value: completeData.number_emergency },
  { field: "number_inpatient", value: completeData.number_inpatient },
  { field: "number_diagnoses", value: completeData.number_diagnoses },
]

      const missingFields = requiredFields.filter(({ value }) => !value || value === "")

      if (missingFields.length > 0) {
        const missingFieldDetails = missingFields.map(({ field, value }) => `${field}: ${value}`)
        notification.error({
          message: "Validation Error",
          description: `Missing required fields: ${missingFieldDetails.join(", ")}`,
        })
        console.error("❌ Missing fields:", missingFields)

        // Show which step has the missing fields
        const accountFields = [
          "firstName",
          "lastName",
          "email",
          "password",
          "phone",
          "gender",
          "dateOfBirth",
          "race",
          "address.street",
          "address.city",
          "address.state",
          "address.zipCode",
          "emergencyContact.name",
          "emergencyContact.phone",
          "emergencyContact.relationship",
        ]
        const medicalFields = ["primaryDiagnosis"]

        const missingAccountFields = missingFields.filter(({ field }) => accountFields.includes(field))
        const missingMedicalFields = missingFields.filter(({ field }) => medicalFields.includes(field))

        if (missingAccountFields.length > 0) {
          console.error("❌ Missing fields in Account step:", missingAccountFields)
        }
        if (missingMedicalFields.length > 0) {
          console.error("❌ Missing fields in Medical step:", missingMedicalFields)
        }

        return
      }

      // Log the complete payload for debugging
      console.log("✅ Complete payload being sent:", JSON.stringify(completeData, null, 2))

      // Submit to API
      const result = await dispatch(createPatient(completeData)).unwrap()
      console.log("🎉 Patient created successfully:", result)

      notification.success({
        message: "Success",
        description: "Patient registered successfully!",
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      })

      // Redirect to patients list
      navigate("/doctor")
    } catch (error) {
      console.error("❌ Registration error:", error)
      notification.error({
        message: "Error",
        description: error.message || "Failed to register patient",
      })
    }
  }

  // Generate age options (1-120)
  const ageOptions = Array.from({ length: 120 }, (_, i) => (
    <Option key={i + 1} value={i + 1}>
      {i + 1}
    </Option>
  ))

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form form={accountForm} layout="vertical" initialValues={formData} requiredMark="optional">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="firstName"
                  label="First Name"
                  rules={[{ required: true, message: "Please enter patient's first name" }]}
                >
                  <Input placeholder="Enter patient's first name" prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lastName"
                  label="Last Name"
                  rules={[{ required: true, message: "Please enter patient's last name" }]}
                >
                  <Input placeholder="Enter patient's last name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: "Please enter email address" },
                    { type: "email", message: "Please enter a valid email" },
                  ]}
                >
                  <Input placeholder="Enter email address" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: "Please enter password" },
                    { min: 6, message: "Password must be at least 6 characters" },
                  ]}
                >
                  <Input.Password placeholder="Enter password" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[{ required: true, message: "Please enter phone number" }]}
                >
                  <Input placeholder="Enter phone number" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="age" label="Age" rules={[{ required: true, message: "Please select age" }]}>
                  <Select placeholder="Select age" showSearch>
                    {ageOptions}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender" }]}>
                  <Select placeholder="Select gender">
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="race" label="Race" rules={[{ required: true, message: "Please select race" }]}>
                  <Select placeholder="Select race">
                    <Option value="Caucasian">Caucasian</Option>
                    <Option value="African American">African American</Option>
                    <Option value="Asian">Asian</Option>
                    <Option value="Hispanic">Hispanic</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="dateOfBirth"
                  label="Date of Birth"
                  rules={[{ required: true, message: "Please select date of birth" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    disabledDate={(current) => current && current.isAfter(new Date())}
                    placeholder="Select date of birth"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Address Information</Title>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="street"
                  label="Street Address"
                  rules={[{ required: true, message: "Please enter street address" }]}
                >
                  <Input placeholder="Enter street address" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="city" label="City" rules={[{ required: true, message: "Please enter city" }]}>
                  <Input placeholder="Enter city" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="state"
                  label="State/Province"
                  rules={[{ required: true, message: "Please enter state/province" }]}
                >
                  <Input placeholder="Enter state/province" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="zipCode"
                  label="Zip/Postal Code"
                  rules={[{ required: true, message: "Please enter zip/postal code" }]}
                >
                  <Input placeholder="Enter zip/postal code" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Emergency Contact</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name={["emergencyContact", "name"]}
                  label="Emergency Contact Name"
                  rules={[{ required: true, message: "Please enter emergency contact name" }]}
                >
                  <Input placeholder="Enter emergency contact name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={["emergencyContact", "phone"]}
                  label="Emergency Contact Phone"
                  rules={[{ required: true, message: "Please enter emergency contact phone" }]}
                >
                  <Input placeholder="Enter emergency contact phone" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={["emergencyContact", "relationship"]}
                  label="Relationship"
                  rules={[{ required: true, message: "Please select relationship" }]}
                >
                  <Select placeholder="Select relationship">
                    <Option value="Spouse">Spouse</Option>
                    <Option value="Parent">Parent</Option>
                    <Option value="Child">Child</Option>
                    <Option value="Sibling">Sibling</Option>
                    <Option value="Friend">Friend</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )

      case 1:
        return (
          <Form form={medicalForm} layout="vertical" initialValues={formData} requiredMark="optional">
            <Title level={5}>Medical History</Title>
            <Row gutter={16}>
              <Col span={24}>
               
<Form.Item
  name="diag_1"
  label="Primary Diagnosis"
  rules={[{ required: true, message: "Please select primary diagnosis" }]}
>
  <Select placeholder="Select primary diagnosis">
    <Option value="Diabetes">Diabetes</Option>
    <Option value="Hypertension">Hypertension</Option>
    {/* ... other options ... */}
  </Select>
</Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Hospital Statistics</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="timeInHospital"
                  label="Time in Hospital (days)"
                  rules={[{ required: true, message: "Please enter time in hospital" }]}
                  initialValue={0}
                >
                  <InputNumber min={0} max={14} style={{ width: "100%" }} placeholder="Days in hospital" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="numberOfLabProcedures"
                  label="Lab Procedures"
                  rules={[{ required: true, message: "Please enter number of lab procedures" }]}
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="Number of lab procedures" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="numberOfProcedures"
                  label="Medical Procedures"
                  rules={[{ required: true, message: "Please enter number of procedures" }]}
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="Number of procedures" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="numberOfMedications"
                  label="Number of Medications"
                  rules={[{ required: true, message: "Please enter number of medications" }]}
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="Total medications" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="numberOfOutpatientVisits"
                  label="Outpatient Visits"
                  rules={[{ required: true, message: "Please enter outpatient visits" }]}
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="Outpatient visits" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="numberOfEmergencyVisits"
                  label="Emergency Visits"
                  rules={[{ required: true, message: "Please enter emergency visits" }]}
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="Emergency visits" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="numberOfInpatientVisits"
                  label="Inpatient Visits"
                  rules={[{ required: true, message: "Please enter inpatient visits" }]}
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="Inpatient visits" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="numberOfDiagnoses"
                  label="Number of Diagnoses"
                  rules={[{ required: true, message: "Please enter number of diagnoses" }]}
                  initialValue={1}
                >
                  <InputNumber min={1} max={16} style={{ width: "100%" }} placeholder="Total diagnoses" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Additional Information</Title>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="medicalNotes" label="Medical Notes">
                  <TextArea rows={4} placeholder="Enter any additional medical notes or observations" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )

      case 2:
        return (
          <Form form={fileForm} layout="vertical" initialValues={formData}>
            <Paragraph>
              Upload medical records, test results, X-rays, or other relevant documents for this patient. Supported file
              types: PDF, JPG, PNG, DOC, DOCX.
            </Paragraph>

            <Form.Item name="medicalFiles" label="Medical Files">
              <Upload
                multiple
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              >
                <Button icon={<UploadOutlined />}>Select Files</Button>
              </Upload>
            </Form.Item>

            <Divider />

            <Row>
              <Col span={24}>
                <Card title="Patient Summary" size="small">
                  <Row gutter={16}>
                    <Col span={12}>
                      <p>
                        <strong>Name:</strong> {formData.firstName} {formData.lastName}
                      </p>
                      <p>
                        <strong>Email:</strong> {formData.email}
                      </p>
                      <p>
                        <strong>Gender:</strong> {formData.gender}
                      </p>
                      <p>
                        <strong>Race:</strong> {formData.race}
                      </p>
                      <p>
                        <strong>Emergency Contact:</strong> {formData.emergencyContact?.name} (
                        {formData.emergencyContact?.relationship})
                      </p>
                    </Col>
                    <Col span={12}>
                      <p>
                        <strong>Primary Diagnosis:</strong> {formData.primaryDiagnosis}
                      </p>
                      <p>
                        <strong>Number of Diagnoses:</strong> {formData.numberOfDiagnoses}
                      </p>
                      <p>
                        <strong>Hospital Visits:</strong> {formData.numberOfInpatientVisits}
                      </p>
                      <p>
                        <strong>Files:</strong> {fileList.length}
                      </p>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Form>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Patient Registration</Title>
        <Text type="secondary">Complete the following steps to register a new patient in the system.</Text>
      </div>

      <Card>
        <Steps
          current={currentStep}
          items={steps.map((step) => ({
            title: step.title,
            description: step.description,
            icon: step.icon,
          }))}
          style={{ marginBottom: 40 }}
        />

        <div style={{ minHeight: "400px" }}>{renderStepContent()}</div>

        <Divider />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {currentStep > 0 && (
            <Button icon={<ArrowLeftOutlined />} onClick={prevStep}>
              Previous
            </Button>
          )}

          <div style={{ marginLeft: "auto" }}>
            {currentStep === steps.length - 1 && (
              <Button
                onClick={() => {
                  const accountValues = accountForm.getFieldsValue(true)
                  const medicalValues = medicalForm.getFieldsValue(true)
                  console.log("🔍 Debug - Account values (with nested):", accountValues)
                  console.log("🔍 Debug - Medical values:", medicalValues)
                  console.log("🔍 Debug - Form data state:", formData)
                  console.log("🔍 Debug - Emergency Contact specifically:", accountValues.emergencyContact)
                  console.log("🔍 Debug - Primary Diagnosis specifically:", medicalValues.primaryDiagnosis)
                }}
                style={{ marginRight: 8 }}
              >
                Debug Form Data
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={nextStep}>
                Next <ArrowRightOutlined />
              </Button>
            ) : (
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={loading}>
                Register Patient
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PatientRegistrationWizard
