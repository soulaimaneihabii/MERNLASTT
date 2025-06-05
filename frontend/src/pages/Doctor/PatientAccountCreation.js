import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Input, 
  Select, 
  DatePicker, 
  notification 
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  LockOutlined 
} from '@ant-design/icons';
import { createPatient } from '../../store/slices/patientsSlice';
import { usersAPI } from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const PatientAccountCreation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.patients);
  const { user } = useSelector((state) => state.auth); // ✅ GET CURRENT DOCTOR

  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      const formattedValues = {
        ...values,
        dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
      };

      // 1️⃣ Step 1 - Create User (role = patient)
      const userPayload = {
        name: `${formattedValues.firstName} ${formattedValues.lastName}`,
        email: formattedValues.email,
        password: formattedValues.password,
        phone: formattedValues.phone,
        role: "patient",
      };

      const userResponse = await usersAPI.createPatientUser(userPayload);

      if (!userResponse.data?.success || !userResponse.data?.data?._id) {
        throw new Error(userResponse.data?.message || 'Failed to create user account');
      }

      const createdUser = userResponse.data.data; // ✅ USER CREATED

      // 2️⃣ Step 2 - Create Patient (IMPORTANT: link to user + doctor)
      const patientPayload = {
        ...formattedValues,
        user: createdUser._id,  // ✅ LINK TO USER
        doctor: user._id,       // ✅ LINK TO DOCTOR (THIS WAS MISSING!)
      };

      const patientResult = await dispatch(createPatient(patientPayload)).unwrap();

      if (patientResult && patientResult._id) {
        notification.success({
          message: 'Account Created',
          description: 'Patient account has been successfully created.',
        });

        navigate(`/patients/${patientResult._id}/medical-info`);
      }

    } catch (error) {
      console.error("Patient creation error:", error);

      notification.error({
        message: 'Creation Failed',
        description: error.message || 'Failed to create patient account',
      });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="center">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <Card 
            title={
              <Title level={3} style={{ margin: 0 }}>
                <UserOutlined /> Patient Account Creation
              </Title>
            }
            bordered={false}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: 'Please input first name!' }]}
                  >
                    <Input placeholder="John" prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: 'Please input last name!' }]}
                  >
                    <Input placeholder="Doe" prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Please input email!' },
                      { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                  >
                    <Input placeholder="john.doe@example.com" prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Phone Number"
                    name="phone"
                    rules={[{ required: true, message: 'Please input phone number!' }]}
                  >
                    <Input placeholder="+1 234 567 8901" prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                      { required: true, message: 'Please input password!' },
                      { min: 8, message: 'Password must be at least 8 characters!' }
                    ]}
                  >
                    <Input.Password placeholder="Password" prefix={<LockOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Confirm Password"
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Please confirm password!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="Confirm Password" prefix={<LockOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Gender"
                    name="gender"
                    rules={[{ required: true, message: 'Please select gender!' }]}
                  >
                    <Select placeholder="Select gender">
                      <Option value="Male">Male</Option>
                      <Option value="Female">Female</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Date of Birth"
                    name="dateOfBirth"
                    rules={[{ required: true, message: 'Please select date of birth!' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      placeholder="Select date" 
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Race/Ethnicity"
                    name="race"
                    rules={[{ required: true, message: 'Please select race/ethnicity!' }]}
                  >
                    <Select placeholder="Select race/ethnicity">
                      <Option value="White">White</Option>
                      <Option value="African American">African American</Option>
                      <Option value="Asian">Asian</Option>
                      <Option value="Hispanic">Hispanic or Latino</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Title level={4} style={{ marginTop: '16px' }}>Address Information</Title>

              <Form.Item
                label="Street Address"
                name={['address', 'street']}
                rules={[{ required: true, message: 'Please input street address!' }]}
              >
                <Input placeholder="123 Main St" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="City"
                    name={['address', 'city']}
                    rules={[{ required: true, message: 'Please input city!' }]}
                  >
                    <Input placeholder="New York" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    label="State"
                    name={['address', 'state']}
                    rules={[{ required: true, message: 'Please input state!' }]}
                  >
                    <Input placeholder="NY" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    label="Zip Code"
                    name={['address', 'zipCode']}
                    rules={[{ required: true, message: 'Please input zip code!' }]}
                  >
                    <Input placeholder="10001" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginTop: '24px' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                  block
                >
                  Create Patient Account
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientAccountCreation;
