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
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  clearError,
} from "../../store/slices/usersSlice";
import { fetchPatients, fetchPatientById } from "../../store/slices/patientsSlice";
import SystemInfo from "./SystemInfo";

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const cardStyle = {
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  padding: "20px",
  marginBottom: "24px",
};

const titleStyle = {
  fontWeight: 700,
  fontSize: 22,
  marginBottom: 24,
};

const tableStyle = {
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.06)",
  transition: "all 0.3s ease",
};

const GestionUsers = () => {
  const dispatch = useDispatch();
  const {
    users = [],
    total = 0,
    loading,
    error,
    currentPage,
    pageSize,
  } = useSelector((state) => state.users);
  const { patients = [], selectedPatient } = useSelector((state) => state.patients);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchUsers({ page: currentPage, limit: pageSize, role: "admin_or_doctor" }));
    dispatch(fetchPatients({}));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    if (error) {
      notification.error({ message: "Error", description: error });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setSelectedRole(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEditUser = async (user) => {
  setEditingUser(user);
  setIsModalVisible(true);

  try {
    const res = await dispatch(fetchPatientById(user._id)).unwrap();

    const fullName = `${res.firstName || ""} ${res.lastName || ""}`;
    const email = user?.email || res?.email || "";
    const status = user?.isActive ?? true;

    form.setFieldsValue({
      fullName,
      email,
      password: "", // always blank for security
      isActive: status,
    });
  } catch (e) {
    notification.error({
      message: "Error",
      description: "Failed to load patient info",
    });
  }
};


  const handleDeleteUser = async (userId) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      notification.success({ message: "Success", description: "User deleted successfully" });
    } catch (error) {
      notification.error({ message: "Error", description: error.message || "Failed to delete user" });
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await dispatch(updateUser({ id: editingUser.id, userData: values })).unwrap();
        notification.success({ message: "Success", description: "User updated successfully" });
      } else {
        await dispatch(createUser(values)).unwrap();
        notification.success({ message: "Success", description: "User created successfully" });
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      notification.error({ message: "Error", description: error.message || "Operation failed" });
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleRoleChange = (value) => {
    setSelectedRole(value);
  };

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
      render: (role) => <Tag color={role === "admin" ? "red" : role === "doctor" ? "blue" : "green"}>{role?.toUpperCase()}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => <Tag color={isActive ? "green" : "red"}>{isActive ? "ACTIVE" : "INACTIVE"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>Edit</Button>
          <Popconfirm title="Are you sure you want to delete this user?" onConfirm={() => handleDeleteUser(record.id)} okText="Yes" cancelText="No">
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
      key: "doctor",
      render: (_, record) => {
        const doctor = users.find((u) => u._id?.toString() === record.doctor?._id?.toString() || u._id?.toString() === record.doctor?.toString());
        return doctor ? doctor.name : "Unassigned";
      },
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={status === "active" ? "green" : "orange"}>{status?.toUpperCase()}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>Edit</Button>
          <Popconfirm title="Are you sure you want to delete this user?" onConfirm={() => handleDeleteUser(record.id)} okText="Yes" cancelText="No">
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const doctorCount = users.filter((u) => u?.role === "doctor").length;
  const adminCount = users.filter((u) => u?.role === "admin").length;
  const patientCount = patients.length;

  return (
    <div style={{ padding: "24px" }}>
      <Title style={titleStyle}>Admin Dashboard - System Management</Title>
      <Tabs defaultActiveKey="users" type="card">
        <TabPane tab="User Management" key="users" icon={<UserOutlined />}>
          <Row gutter={[16, 16]}>
            <Col span={8}><Card style={{ ...cardStyle, backgroundColor: "#e3f2fd" }}><Statistic title="Total Users" value={total} prefix={<UserOutlined />} /></Card></Col>
            <Col span={8}><Card style={{ ...cardStyle, backgroundColor: "#e6f7ff" }}><Statistic title="Doctors" value={doctorCount} prefix={<TeamOutlined />} valueStyle={{ color: "#1890ff" }} /></Card></Col>
            <Col span={8}><Card style={{ ...cardStyle, backgroundColor: "#fff1f0" }}><Statistic title="Admins" value={adminCount} prefix={<TeamOutlined />} valueStyle={{ color: "#cf1322" }} /></Card></Col>
          </Row>

          <Card style={cardStyle} title="Manage Admins & Doctors">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUser} style={{ marginBottom: 16 }}>Add Doctor/Admin</Button>
            <div style={tableStyle}>
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
            </div>
          </Card>
        </TabPane>

        <TabPane tab="Patients Overview" key="patients" icon={<TeamOutlined />}>
          <Row gutter={[16, 16]}>
            <Col span={24}><Card style={{ ...cardStyle, backgroundColor: "#e8f5e9" }}><Statistic title="Total Patients" value={patientCount} prefix={<TeamOutlined />} /></Card></Col>
          </Row>
          <Card style={cardStyle} title="All Patients">
            <div style={tableStyle}>
              <Table
                columns={patientColumns}
                dataSource={patients}
                rowKey="_id"
                loading={loading}
                pagination={{
                  current: 1,
                  pageSize: 10,
                  total: patients.length,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                }}
              />
            </div>
          </Card>
        </TabPane>

        <TabPane tab="System Information" key="system" icon={<BugOutlined />}>
          <SystemInfo />
        </TabPane>
      </Tabs>

      <Modal
        title={editingUser ? "Edit Patient Info" : "Create Doctor/Admin"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="fullName" label="Full Name">
            <Input disabled />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
  <Input disabled />
</Form.Item>
          <Form.Item name="password" label="Password" rules={[{ min: 6 }]}> <Input.Password placeholder="Leave blank to keep current" /> </Form.Item>
          <Form.Item name="isActive" label="Status" rules={[{ required: true }]}> <Select placeholder="Select status"> <Option value={true}>Active</Option> <Option value={false}>Inactive</Option> </Select> </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GestionUsers;
