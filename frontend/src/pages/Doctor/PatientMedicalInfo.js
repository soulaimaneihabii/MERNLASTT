import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Form,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  InputNumber,
  Upload,
  Divider,
  notification,
  Steps,
  Spin
} from 'antd';
import {
  MedicineBoxOutlined,
  FileOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { fetchPatients, updatePatient } from '../../store/slices/patientsSlice';

const { Title } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

const PatientMedicalInfo = () => {
  const { id: patientIdParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { patients = [], loading } = useSelector((state) => state.patients);
  const { user } = useSelector((state) => state.auth);

  const [medicalForm] = Form.useForm();
  const [fileForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPatientId, setSelectedPatientId] = useState(patientIdParam);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPatients({ doctorId: user.id }));
    }
  }, [dispatch, user?.id]);

  const handleMedicalSubmit = async (values) => {
    try {
      setCurrentStep(1);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to save medical information',
      });
    }
  };

  const handleFileSubmit = async () => {
  try {
    const medicalValues = medicalForm.getFieldsValue();
    const files = fileList.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.response?.url || URL.createObjectURL(file.originFileObj),
    }));

    const completeData = {
      ...medicalValues,
      medicalFiles: files,
      patientId: selectedPatientId,
    };

    const result = await dispatch(updatePatient({
      id: selectedPatientId,
      patientData: completeData
    }));

    if (result.payload) {
      notification.success({
        message: 'Success',
        description: 'Patient medical information has been saved',
      });
      navigate('/patients');
    }
  } catch (error) {
    notification.error({
      message: 'Error',
      description: 'Failed to save medical information',
    });
  }
};


  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const steps = [
    {
      title: 'Medical Information',
      icon: <MedicineBoxOutlined />,
    },
    {
      title: 'Medical Files',
      icon: <FileOutlined />,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <Spin size="large" tip="Loading patients..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="center">
        <Col span={24}>
          <Steps current={currentStep} style={{ marginBottom: '24px' }}>
            {steps.map((step, index) => (
              <Step
                key={index}
                title={step.title}
                icon={step.icon}
              />
            ))}
          </Steps>
        </Col>
      </Row>

      {currentStep === 0 ? (
        <Row justify="center">
          <Col xs={24} sm={22} md={20} lg={18} xl={16}>
            <Card
              title={
                <Title level={3} style={{ margin: 0 }}>
                  <MedicineBoxOutlined /> Medical Information
                </Title>
              }
              bordered={false}
            >
              <Form
                form={medicalForm}
                layout="vertical"
                onFinish={handleMedicalSubmit}
                autoComplete="off"
              >

                {/* ComboBox Select Patient */}
                <Form.Item
                  label="Select Patient"
                  name="patientId"
                  rules={[{ required: true, message: 'Please select a patient!' }]}
                  initialValue={selectedPatientId}
                >
                  <Select
                    placeholder={loading ? 'Loading patients...' : 'Choose a patient'}
                    onChange={(value) => setSelectedPatientId(value)}
                  >
                    {patients.map((patient) => (
                      <Option key={patient.id} value={patient.id}>
                        {`${patient.firstName} ${patient.lastName} (ID: ${patient.id})`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* === RESTE DE TON FORMULAIRE EXISTANT === */}

                <Title level={4}>Diagnosis Information</Title>

                <Form.Item
                  label="Primary Diagnosis"
                  name="primaryDiagnosis"
                  rules={[{ required: true, message: 'Please input primary diagnosis!' }]}
                >
                  <TextArea rows={3} placeholder="Enter primary diagnosis" />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Time in Hospital (days)"
                      name="timeInHospital"
                      rules={[{ required: true, message: 'Please input time in hospital!' }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="Days"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Number of Diagnoses"
                      name="numberOfDiagnoses"
                      rules={[{ required: true, message: 'Please input number of diagnoses!' }]}
                    >
                      <InputNumber
                        min={1}
                        style={{ width: '100%' }}
                        placeholder="Count"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Title level={4} style={{ marginTop: '16px' }}>Procedures & Medications</Title>

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Lab Procedures"
                      name="numberOfLabProcedures"
                      rules={[{ required: true, message: 'Please input number of lab procedures!' }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="Count"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Procedures"
                      name="numberOfProcedures"
                      rules={[{ required: true, message: 'Please input number of procedures!' }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="Count"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Medications"
                      name="numberOfMedications"
                      rules={[{ required: true, message: 'Please input number of medications!' }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="Count"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Title level={4} style={{ marginTop: '16px' }}>Visit History</Title>

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Outpatient Visits"
                      name="numberOfOutpatientVisits"
                      rules={[{ required: true, message: 'Please input number of outpatient visits!' }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="Count"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Emergency Visits"
                      name="numberOfEmergencyVisits"
                      rules={[{ required: true, message: 'Please input number of emergency visits!' }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="Count"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Inpatient Visits"
                      name="numberOfInpatientVisits"
                      rules={[{ required: true, message: 'Please input number of inpatient visits!' }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="Count"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Title level={4} style={{ marginTop: '16px' }}>Emergency Contact</Title>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Full Name"
                      name={['emergencyContact', 'name']}
                      rules={[{ required: true, message: 'Please input emergency contact name!' }]}
                    >
                      <Input placeholder="Contact name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Relationship"
                      name={['emergencyContact', 'relationship']}
                      rules={[{ required: true, message: 'Please input relationship!' }]}
                    >
                      <Input placeholder="Relationship (e.g., Spouse, Parent)" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Phone Number"
                  name={['emergencyContact', 'phone']}
                  rules={[{ required: true, message: 'Please input emergency contact phone!' }]}
                >
                  <Input placeholder="+1 234 567 8901" />
                </Form.Item>

                <Form.Item style={{ marginTop: '24px' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<ArrowRightOutlined />}
                    size="large"
                  >
                    Next: Upload Files
                  </Button>
                </Form.Item>

              </Form>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row justify="center">
          <Col xs={24} sm={22} md={20} lg={18} xl={16}>
            <Card
              title={
                <Title level={3} style={{ margin: 0 }}>
                  <FileOutlined /> Medical Files
                </Title>
              }
              bordered={false}
            >
              <Form
                form={fileForm}
                layout="vertical"
                autoComplete="off"
              >
                <Form.Item
                  label="Medical Documents"
                  name="medicalFiles"
                  extra="Upload medical reports, test results, or other relevant documents"
                >
                  <Upload
                    fileList={fileList}
                    onChange={handleFileChange}
                    beforeUpload={() => false}
                    multiple
                  >
                    <Button icon={<UploadOutlined />}>Select Files</Button>
                  </Upload>
                </Form.Item>

                <Divider />

                <Row gutter={16}>
                  <Col xs={12}>
                    <Button
                      onClick={() => setCurrentStep(0)}
                      icon={<ArrowLeftOutlined />}
                      size="large"
                      block
                    >
                      Back
                    </Button>
                  </Col>
                  <Col xs={12}>
                    <Button
                      type="primary"
                      onClick={handleFileSubmit}
                      icon={<CheckCircleOutlined />}
                      size="large"
                      block
                    >
                      Complete Registration
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default PatientMedicalInfo;
