"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Typography,
  notification,
  Upload,
  Space,
  Divider,
  Table,
  Tag,
  Input,
  DatePicker,
  Tabs,
  Badge,Tooltip
} from "antd"
import {
  UploadOutlined,
  SaveOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  LeftCircleFilled,
} from "@ant-design/icons"
import { fetchPatients, updatePatient } from "../../store/slices/patientsSlice"
import { getAISuggestions } from "../../services/aiAssistantService";
import { scanDocumentWithOCR } from "../../utils/ocrService";


import dayjs from "dayjs"

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs


const MedicalInformation = () => {
  const dispatch = useDispatch()
  const { patients = [], loading } = useSelector((state) => state.patients)
  const { user } = useSelector((state) => state.auth)

  const [form] = Form.useForm()
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [fileList, setFileList] = useState([])
  const [medicalFiles, setMedicalFiles] = useState([])
  const [allergies, setAllergies] = useState([])
  const [medications, setMedications] = useState([])
  const [medicalHistory, setMedicalHistory] = useState([])
  const [newAllergy, setNewAllergy] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
const [aiLoading, setAiLoading] = useState(false);


  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPatients({ doctorId: user.id }))
    }
  }, [dispatch, user?.id])
  //ai assisstance
  const { token } = useSelector((state) => state.auth);

 const handleAISuggestions = async () => {
  if (!selectedPatient || !selectedPatient.id) {
    notification.warning({
      message: "No Patient Selected",
      description: "Please select a patient that has a linked user account.",
    });
    return;
  }

  try {
    setAiLoading(true);
    const { suggestedFields } = await getAISuggestions(selectedPatient.id, token);

    if (suggestedFields) {
      // ✅ Convert any date fields
      if (suggestedFields.dateOfBirth) {
        suggestedFields.dateOfBirth = dayjs(suggestedFields.dateOfBirth);
      }

      form.setFieldsValue(suggestedFields);

      notification.success({
        message: "AI Suggestions Applied",
        description: "Form fields auto-filled using AI predictions.",
      });
    } else {
      notification.warning({
        message: "No Suggestions",
        description: "AI returned no suggested values.",
      });
    }
  } catch (error) {
    console.error("AI suggestion error:", error.message);
    notification.error({
      message: "AI Suggestion Failed",
      description: error.message || "Unable to fetch AI suggestions.",
    });
  } finally {
    setAiLoading(false);
  }
};



  const handlePatientSelect = (patientId) => {
    const patient = patients.find((p) => p.id === patientId)
    setSelectedPatient(patient)

    if (patient) {
      form.setFieldsValue({
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth ? dayjs(patient.dateOfBirth) : null,
        age: patient.age,
        gender: patient.gender,
        race: patient.race,
        diag_1: patient.diag_1,
        diag_2: patient.diag_2,
        diag_3: patient.diag_3,
        max_glu_serum: patient.max_glu_serum,
        A1Cresult: patient.A1Cresult,
        insulin: patient.insulin,
        metformin: patient.metformin,
        diabetesMed: patient.diabetesMed,
        time_in_hospital: patient.time_in_hospital,
        num_lab_procedures: patient.num_lab_procedures,
        num_procedures: patient.num_procedures,
        num_medications: patient.num_medications,
        number_outpatient: patient.number_outpatient,
        number_emergency: patient.number_emergency,
        number_inpatient: patient.number_inpatient,
        number_diagnoses: patient.number_diagnoses,
        notes: patient.notes,
        street: patient.address?.street,
        city: patient.address?.city,
        state: patient.address?.state,
        zipCode: patient.address?.zipCode,
        emergencyName: patient.emergencyContact?.name,
        emergencyRelationship: patient.emergencyContact?.relationship,
        emergencyPhone: patient.emergencyContact?.phone,
      })

      setAllergies(patient.allergies || [])
      setMedications(patient.currentMedications || [])
      setMedicalHistory(patient.medicalHistory || [])
      setMedicalFiles(patient.medicalFiles || [])
    } else {
      form.resetFields()
      setAllergies([])
      setMedications([])
      setMedicalHistory([])
      setMedicalFiles([])
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0
    const today = dayjs()
    const birthDate = dayjs(dateOfBirth)
    return today.diff(birthDate, "year")
  }

  const handleDateOfBirthChange = (date) => {
    if (date) {
      const age = calculateAge(date)
      form.setFieldsValue({ age })
    }
  }

  const handleSaveMedicalInfo = async () => {
  try {
    const values = await form.validateFields();

    // Construct correct patient object:
    const patientData = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
      age: values.age,
      gender: values.gender,
      race: values.race,
      diag_1: values.diag_1,
      diag_2: values.diag_2,
      diag_3: values.diag_3,
      max_glu_serum: values.max_glu_serum,
      A1Cresult: values.A1Cresult,
      insulin: values.insulin,
      metformin: values.metformin,
      diabetesMed: values.diabetesMed,
      time_in_hospital: values.time_in_hospital,
      num_lab_procedures: values.num_lab_procedures,
      num_procedures: values.num_procedures,
      num_medications: values.num_medications,
      number_outpatient: values.number_outpatient,
      number_emergency: values.number_emergency,
      number_inpatient: values.number_inpatient,
      number_diagnoses: values.number_diagnoses,
      address: {
        street: values.street,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
      },
      emergencyContact: {
        name: values.emergencyName,
        relationship: values.emergencyRelationship,
        phone: values.emergencyPhone,
      },
      allergies,
      currentMedications: medications.filter((med) => med.name),
      medicalHistory: medicalHistory.filter((history) => history.condition),
      medicalFiles: medicalFiles,
    };

    // Dispatch update:
    await dispatch(
      updatePatient({
        id: selectedPatient.id,
        patientData,
      }),
    ).unwrap();

    notification.success({
      message: "Success",
      description: "Medical information saved successfully",
    });

  } catch (error) {
    notification.error({
      message: "Error",
      description: error.message || "Failed to save medical information",
    });
  }
};
// const exportDSEFile = () => {
//   if (!selectedPatient) {
//     notification.warning({
//       message: "No Patient Selected",
//       description: "Please select a patient first.",
//     });
//     return;
//   }

  // const dseData = {
  //   patientId: selectedPatient.id,
  //   firstName: selectedPatient.firstName,
  //   lastName: selectedPatient.lastName,
  //   medicalFiles: medicalFiles.map((file) => ({
  //     name: file.name,
  //     ocrText: file.ocrText,
  //     uploadDate: file.uploadDate,
  //   })),
  //   exportedAt: new Date().toISOString(),
  // };

//   const jsonStr = JSON.stringify(dseData, null, 2);

//   const blob = new Blob([jsonStr], { type: "application/json" });
//   const url = URL.createObjectURL(blob);

//   const link = document.createElement("a");
//   link.href = url;
//   link.download = `Patient_${selectedPatient.id}_DSE.json`;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);

//   URL.revokeObjectURL(url);

//   notification.success({
//     message: "DSE Exported",
//     description: "Patient DSE file was exported successfully.",
//   });
// };
 const handleFileUpload = async ({ fileList: newFileList }) => {
  setFileList(newFileList);

  const uploadedFiles = await Promise.all(
    newFileList.map(async (file) => {
      let ocrText = "";
      try {
        notification.info({
          message: "Scanning Document",
          description: `Running OCR on ${file.name}...`,
        });

        ocrText = await scanDocumentWithOCR(file);

        notification.success({
          message: "OCR Complete",
          description: `Extracted text from ${file.name}`,
        });

      } catch (err) {
        notification.error({
          message: "OCR Failed",
          description: `Failed to scan ${file.name}`,
        });
      }

      return {
        uid: file.uid,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.response?.url || file.url,
        uploadDate: new Date().toISOString(),
        ocrText: ocrText, // 🟢 Add scanned text here!
      };
    })
  );

  setMedicalFiles(uploadedFiles);
};

  const handleDeleteFile = (fileUid) => {
    setMedicalFiles(medicalFiles.filter((file) => file.uid !== fileUid))
  }
  const addAllergy = () => {
    if (newAllergy && !allergies.includes(newAllergy)) {
      setAllergies([...allergies, newAllergy])
      setNewAllergy("")
    }
  }

  const removeAllergy = (allergyToRemove) => {
    setAllergies(allergies.filter((allergy) => allergy !== allergyToRemove))
  }

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "" }])
  }

  const updateMedication = (index, field, value) => {
    const updated = medications.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    setMedications(updated)
  }

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const addMedicalHistory = () => {
    setMedicalHistory([...medicalHistory, { condition: "", diagnosedDate: "", status: "Active" }])
  }

  const updateMedicalHistory = (index, field, value) => {
    const updated = medicalHistory.map((history, i) => (i === index ? { ...history, [field]: value } : history))
    setMedicalHistory(updated)
  }

  const removeMedicalHistory = (index) => {
    setMedicalHistory(medicalHistory.filter((_, i) => i !== index))
  }

  const fileColumns = [
    {
      title: "File Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (size) => `${(size / 1024).toFixed(1)} KB`,
    },
    {
      title: "Upload Date",
      dataIndex: "uploadDate",
      key: "uploadDate",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => window.open(record.url, "_blank")}>
            View
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteFile(record.uid)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  const ageOptions = Array.from({ length: 120 }, (_, i) => (
    <Option key={i + 1} value={i + 1}>
      {i + 1}
    </Option>
  ))
  return (
    

    <div>
    <div style={{ marginBottom: 24, textAlign: "left" }}>
  <Title level={2} style={{ fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>
    Enhanced Medical Information
  </Title>
  <Text style={{ fontSize: 16, color: "#6B7280" }}>
    AI-powered patient data collection system.
  </Text>
</div>

      <Row gutter={16}>
        <Col span={6}>
          <Card title="Select Patient" extra={<UserOutlined />}>
            <Select
              style={{ width: "100%" }}
              placeholder="Choose a patient"
              onChange={handlePatientSelect}
              loading={loading}
              size="large"
              value={selectedPatient ? selectedPatient.id : undefined}
            >
              {patients.map((patient) => (
                <Option key={patient.id} value={patient.id}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{patient.firstName} {patient.lastName}</div>
                  
                  </div>
                </Option>
              ))}
            </Select>

           {selectedPatient && (
  <div style={{ marginTop: 16 }}>
    <Card
      bordered
      style={{
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
      }}
    >
      <Title level={5} style={{ marginBottom: 4 }}>{selectedPatient.firstName} {selectedPatient.lastName}</Title>
      <Text type="secondary">{selectedPatient.email}</Text>
      <br />
      <Tag color="blue" style={{ marginTop: 8 }}>Age: {selectedPatient.age}</Tag>
      <Tag color={selectedPatient.status === "Active" ? "green" : "orange"}>
        {selectedPatient.status}
      </Tag>
    </Card>
  </div>
)}

          </Card>
        </Col>

        <Col span={18}>
          {selectedPatient ? (
            <Card
              title="Comprehensive Medical Information"
            extra={
  <Space>
    <Button
      type="primary"
      icon={<SaveOutlined />}
      onClick={handleSaveMedicalInfo}
      loading={loading}
    >
      Save Medical Information
    </Button>
    <Tooltip
      title="Let AI suggest basic medical information to save time."
      color="#2db7f5"
      placement="bottom"
    >
      <Button
        type="dashed"
        icon={<ExperimentOutlined />}
        onClick={handleAISuggestions}
        loading={aiLoading}
        style={{ borderColor: "#91d5ff", color: "#1890ff" }}
      >
        Smart Auto-Fill
      </Button>
    </Tooltip>
  </Space>
}


              
            >
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="Basic Information" key="basic" icon={<UserOutlined />}>
                  <Form form={form} layout="vertical">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                          <Input placeholder="Enter first name" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                          <Input placeholder="Enter last name" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="phone" label="Phone Number">
                          <Input placeholder="Enter phone number" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true }]}>
                          <DatePicker
                            style={{ width: "100%" }}
                            placeholder="Select date of birth"
                            onChange={handleDateOfBirthChange}
                            value={form.getFieldValue("dateOfBirth")}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="age" label="Age" rules={[{ required: true }]}>
                          <Select placeholder="Select age" showSearch>
                            {ageOptions}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                          <Select placeholder="Select gender">
                            <Option value="Male">Male</Option>
                            <Option value="Female">Female</Option>
                            <Option value="Other">Other</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="race" label="Race" rules={[{ required: true }]}>
                          <Select placeholder="Select race">
                            <Option value="White">White</Option>
                            <Option value="Caucasian">Caucasian</Option>
                            <Option value="African American">African American</Option>
                            <Option value="Asian">Asian</Option>
                            <Option value="Hispanic">Hispanic</Option>
                            <Option value="Other">Other</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider />

                    <Title level={4}>Address Information</Title>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item name={["address", "street"]} label="Street Address">
                          <Input placeholder="Enter street address" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name={["address", "city"]} label="City">
                          <Input placeholder="Enter city" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name={["address", "state"]} label="State">
                          <Input placeholder="Enter state" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name={["address", "zipCode"]} label="Zip Code">
                          <Input placeholder="Enter zip code" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider />

                    <Title level={4}>Emergency Contact</Title>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name={["emergencyContact", "name"]} label="Contact Name">
                          <Input placeholder="Enter emergency contact name" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name={["emergencyContact", "relationship"]} label="Relationship">
  <Select placeholder="Select relationship">
    <Option value="Parent">Parent</Option>
    <Option value="Sibling">Sibling</Option>
    <Option value="Spouse">Spouse</Option>
    <Option value="Friend">Friend</Option>
    <Option value="Guardian">Guardian</Option>
    <Option value="Other">Other</Option>
  </Select>
</Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name={["emergencyContact", "phone"]} label="Contact Phone">
                          <Input placeholder="Enter emergency contact phone" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </TabPane>

                {/* ---- CONTINUE NEXT TABS "MEDICAL DATA", "HOSPITAL STATS", etc ---- */}
                <TabPane tab="Medical Data" key="medical" icon={<MedicineBoxOutlined />}>
                  <Form form={form} layout="vertical">
                    <Title level={4}>Diagnoses (ICD-10 Codes)</Title>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="diag_1" label="Primary Diagnosis" rules={[{ required: true }]}>
                          <Select placeholder="Select primary diagnosis">
                            <Option value="E11.9">E11.9 - Type 2 Diabetes</Option>
                            <Option value="E10.9">E10.9 - Type 1 Diabetes</Option>
                            <Option value="I10">I10 - Essential Hypertension</Option>
                            <Option value="I25.9">I25.9 - Chronic Ischemic Heart Disease</Option>
                            <Option value="N18.9">N18.9 - Chronic Kidney Disease</Option>
                            <Option value="J44.9">J44.9 - COPD</Option>
                            <Option value="Other">Other</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="diag_2" label="Secondary Diagnosis">
                          <Select placeholder="Select secondary diagnosis">
                            <Option value="None">None</Option>
                            <Option value="E11.9">E11.9 - Type 2 Diabetes</Option>
                            <Option value="I10">I10 - Essential Hypertension</Option>
                            <Option value="I25.9">I25.9 - Chronic Ischemic Heart Disease</Option>
                            <Option value="N18.9">N18.9 - Chronic Kidney Disease</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="diag_3" label="Additional Diagnosis">
                          <Select placeholder="Select additional diagnosis">
                            <Option value="None">None</Option>
                            <Option value="E11.9">E11.9 - Type 2 Diabetes</Option>
                            <Option value="I10">I10 - Essential Hypertension</Option>
                            <Option value="I25.9">I25.9 - Chronic Ischemic Heart Disease</Option>
                            <Option value="N18.9">N18.9 - Chronic Kidney Disease</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider />

                    <Title level={4}>Laboratory & Medication</Title>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="max_glu_serum" label="Max Glucose Serum" rules={[{ required: true }]}>
                          <Select placeholder="Select glucose level">
                            <Option value="None">None</Option>
                            <Option value="Norm">Normal</Option>
                            <Option value=">200">{">200 mg/dL"}</Option>
                            <Option value=">300">{">300 mg/dL"}</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="A1Cresult" label="A1C Result" rules={[{ required: true }]}>
                          <Select placeholder="Select A1C result">
                            <Option value="None">None</Option>
                            <Option value="Norm">Normal</Option>
                            <Option value=">7">{">7%"}</Option>
                            <Option value=">8">{">8%"}</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="insulin" label="Insulin Usage" rules={[{ required: true }]}>
                          <Select placeholder="Select insulin usage">
                            <Option value="No">No</Option>
                            <Option value="Down">Down</Option>
                            <Option value="Steady">Steady</Option>
                            <Option value="Up">Up</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="metformin" label="Metformin Usage" rules={[{ required: true }]}>
                          <Select placeholder="Select metformin usage">
                            <Option value="No">No</Option>
                            <Option value="Down">Down</Option>
                            <Option value="Steady">Steady</Option>
                            <Option value="Up">Up</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="diabetesMed" label="Diabetes Medication" rules={[{ required: true }]}>
                          <Select placeholder="Select diabetes medication">
                            <Option value="Yes">Yes</Option>
                            <Option value="No">No</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </TabPane>

                <TabPane tab="Hospital Statistics" key="hospital" icon={<BarChartOutlined />}>
                  <Form form={form} layout="vertical">
                    <Title level={4}>Hospital Stay Information</Title>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="time_in_hospital" label="Time in Hospital (days)" rules={[{ required: true }]}>
                          <InputNumber min={1} max={14} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="num_lab_procedures" label="Lab Procedures" rules={[{ required: true }]}>
                          <InputNumber min={0} max={132} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="num_procedures" label="Medical Procedures" rules={[{ required: true }]}>
                          <InputNumber min={0} max={6} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="num_medications" label="Number of Medications" rules={[{ required: true }]}>
                          <InputNumber min={1} max={81} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="number_outpatient" label="Outpatient Visits" rules={[{ required: true }]}>
                          <InputNumber min={0} max={42} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="number_emergency" label="Emergency Visits" rules={[{ required: true }]}>
                          <InputNumber min={0} max={76} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="number_inpatient" label="Inpatient Visits" rules={[{ required: true }]}>
                          <InputNumber min={0} max={21} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="number_diagnoses" label="Number of Diagnoses" rules={[{ required: true }]}>
                          <InputNumber min={1} max={16} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </TabPane>

            <TabPane tab="Medical Files" key="files" icon={<UploadOutlined />}>
  <Title level={4}>Upload Medical Files</Title>
  <Upload
    multiple
    fileList={fileList}
    onChange={handleFileUpload}
    beforeUpload={() => false}
    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
  >
    <Button icon={<UploadOutlined />}>Upload Files</Button>
  </Upload>

  {medicalFiles.length > 0 && (
    <Table
      columns={fileColumns}
      dataSource={medicalFiles}
      rowKey="uid"
      style={{ marginTop: 16 }}
      pagination={false}
    />
  )}

  <Divider />

  {/* <Button
  type="default"
  size="large"
  icon={<FileTextOutlined />}
  onClick={() => exportDSEFile()}
  style={{ marginTop: "12px" }}
  block
>
  Export to DSE
</Button> */}

 
</TabPane>

              </Tabs>
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <FileTextOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
                <Title level={3} type="secondary">
                  Select a patient to manage medical information
                </Title>
                <Text type="secondary">
                  Choose a patient from the dropdown to add comprehensive medical data for AI prediction analysis.
                </Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default MedicalInformation;
