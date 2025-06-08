"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  notification,
  Tabs,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  BugOutlined,
} from "@ant-design/icons";
import { fetchUsers, createUser, updateUser, deleteUser, clearError } from "../../store/slices/usersSlice";
import { fetchPatients } from "../../store/slices/patientsSlice";
import API from "../../services/api";
import SystemInfo from "./SystemInfo";  // adjust path if needed

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const GestionUsers = () => {
  const dispatch = useDispatch();
  const { users = [], total = 0, loading, error, currentPage, pageSize } = useSelector((state) => state.users);
  const { patients = [] } = useSelector((state) => state.patients);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [form] = Form.useForm();

  // ✅ Fetch data
  useEffect(() => {
    dispatch(fetchUsers({ page: currentPage, limit: pageSize, role: 'admin_or_doctor' }));

    dispatch(fetchPatients({})); // Admin fetch all patients
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    if (error) {
      notification.error({
        message: "Error",
        description: error,
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setSelectedRole(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setIsModalVisible(true);
    form.setFieldsValue(user);
  };

  const handleDeleteUser = async (userId) => {
  try {
    await dispatch(deleteUser(userId)).unwrap();
    notification.success({
      message: "Success",
      description: "User deleted successfully",
    });
  } catch (error) {
    notification.error({
      message: "Error",
      description: error.message || "Failed to delete user",
    });
  }
};


  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        await dispatch(updateUser({ id: editingUser.id, userData: values })).unwrap();
        notification.success({
          message: "Success",
          description: "User updated successfully",
        });
      } else {
        await dispatch(createUser(values)).unwrap();
        notification.success({
          message: "Success",
          description: "User created successfully",
        });
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Operation failed",
      });
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleRoleChange = (value) => {
    setSelectedRole(value);
  };

  // ✅ User columns
  const userColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={role === "admin" ? "red" : role === "doctor" ? "blue" : "green"}>{role?.toUpperCase()}</Tag>
      ),
    },
   {
  title: "Status",
  dataIndex: "isActive",
  key: "isActive",
  render: (isActive) => (
    <Tag color={isActive ? "green" : "red"}>
      {isActive ? "ACTIVE" : "INACTIVE"}
    </Tag>
  ),


    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ✅ Patient columns with correct Doctor column
  const patientColumns = [
    {
      title: "Patient Name",
      key: "name",
      render: (record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Doctor",
      dataIndex: "doctor",
      key: "doctor",
      render: (doctor) => (doctor ? doctor.name : "Unassigned"),
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "orange"}>{status?.toUpperCase()}</Tag>
      ),
    },
  ];

  const doctorCount = Array.isArray(users) ? users.filter((u) => u?.role === "doctor").length : 0;
  const adminCount = Array.isArray(users) ? users.filter((u) => u?.role === "admin").length : 0;
  const patientCount = Array.isArray(patients) ? patients.length : 0;

  return (
    <div>
      <Title level={2}>Admin Dashboard - System Management</Title>

      <Tabs defaultActiveKey="users">
        {/* Users tab */}
        <TabPane tab="User Management" key="users" icon={<UserOutlined />}>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic title="Total Users" value={total} prefix={<UserOutlined />} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="Doctors" value={doctorCount} prefix={<TeamOutlined />} valueStyle={{ color: "#1890ff" }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="Admins" value={adminCount} prefix={<TeamOutlined />} valueStyle={{ color: "#cf1322" }} />
              </Card>
            </Col>
          </Row>

          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUser}>
                Add Doctor/Admin
              </Button>
            </div>

          <Table
  columns={userColumns}
  dataSource={users.filter((u) => u.role === "admin" || u.role === "doctor")}
  rowKey="id"
  loading={loading}
  pagination={{
    current: currentPage,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  }}
/>

          </Card>
        </TabPane>

        {/* Patients tab */}
        <TabPane tab="Patients Overview" key="patients" icon={<TeamOutlined />}>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card>
                <Statistic title="Total Patients" value={patientCount} prefix={<TeamOutlined />} />
              </Card>
            </Col>
          </Row>

          <Card title="All Patients by Doctor">
           <Table
  columns={userColumns}
  dataSource={users}    // No need to filter anymore!
  rowKey="id"
  loading={loading}
  pagination={{
    current: currentPage,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  }}
/>

          </Card>
        </TabPane>

        {/* System info tab */}
        <TabPane tab="System Information" key="system" icon={<BugOutlined />}>
          <SystemInfo />
        </TabPane>
      </Tabs>

      {/* Modal */}
      <Modal
        title={editingUser ? "Edit User" : "Create Doctor/Admin"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input the name!" }]}>
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

          <Form.Item name="role" label="Role" rules={[{ required: true, message: "Please select a role!" }]}>
            <Select placeholder="Select a role" onChange={handleRoleChange}>
              <Option value="admin">Super Admin</Option>
              <Option value="doctor">Doctor</Option>
            </Select>
          </Form.Item>

          {selectedRole === "doctor" && (
            <>
              <Form.Item
                name="specialization"
                label="Specialization"
                rules={[{ required: true, message: "Please enter specialization!" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="licenseNumber"
                label="License Number"
                rules={[{ required: true, message: "Please enter license number!" }]}
              >
                <Input />
              </Form.Item>
            </>
          )}

          {!editingUser && (
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

          <Form.Item name="isActive" label="Status" rules={[{ required: true, message: "Please select a status!" }]}>
  <Select placeholder="Select status">
    <Option value={true}>Active</Option>
    <Option value={false}>Inactive</Option>
  </Select>
</Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default GestionUsers;
