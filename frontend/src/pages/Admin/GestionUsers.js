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
import { fetchPatients, fetchPatientById,deletePatient  } from "../../store/slices/patientsSlice";
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
  setIsModalVisible(true);
  form.setFieldsValue({
    name: "",
    email: "",
    password: "",
    role: "doctor", // or "admin"
    isActive: true,
  });
};


const handleEditUser = async (user) => {
  setEditingUser(user);
  setIsModalVisible(true);
  setSelectedRole(user.role);

  try {
    form.resetFields();
    form.setFieldsValue({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "",
      specialization: user?.specialization || "",
      licenseNumber: user?.licenseNumber || "",
      isActive: user?.isActive ?? true,
    });
  } catch (e) {
    notification.error({
      message: "Error",
      description: e.message || "Failed to load user info",
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
    render: (text, record) => (
      <Space>
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => console.log("Edit", record)}
        >
          Edit
        </Button>
        <Popconfirm
          title="Are you sure to delete this user?"
          onConfirm={async () => {
            console.log("Delete clicked", record._id);
            try {
              await dispatch(deleteUser(record._id)).unwrap();
              notification.success({
                message: "User deleted",
                description: `${record.name} deleted successfully`,
              });
            } catch (err) {
              notification.error({
                message: "Delete failed",
                description: err.message || "Something went wrong",
              });
            }
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" icon={<DeleteOutlined />} danger>
            Delete
          </Button>
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
    render: (text, record) => (
      <Space>
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => console.log("Edit clicked for", record)}
        >
          Edit
        </Button>
        <Popconfirm
          title="Are you sure to delete this patient?"
          onConfirm={async () => {
            console.log("Delete clicked", record._id); // ✅ Debug log
            try {
              await dispatch(deletePatient(record._id)).unwrap();
              notification.success({
                message: "Patient deleted",
                description: `${record.firstName} ${record.lastName} was deleted.`,
              });
            } catch (err) {
              console.error("Delete error", err);
              notification.error({
                message: "Delete failed",
                description: err?.message || "Something went wrong",
              });
            }
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" icon={<DeleteOutlined />} danger>
            Delete
          </Button>
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
    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}> 
      <Input disabled={!!editingUser} />
    </Form.Item>

    <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}> 
      <Input disabled={!!editingUser} />
    </Form.Item>

    <Form.Item name="password" label="Password" rules={[{ required: !editingUser, min: 6 }]}> 
      <Input.Password placeholder={editingUser ? "Leave blank to keep current" : "Enter password"} />
    </Form.Item>

    <Form.Item name="role" label="Role" rules={[{ required: true }]}> 
      <Select onChange={(value) => setSelectedRole(value)} disabled={!!editingUser}>
        <Option value="admin">Admin</Option>
        <Option value="doctor">Doctor</Option>
      </Select>
    </Form.Item>

    {selectedRole === "doctor" && (
      <>
        <Form.Item name="specialization" label="Specialization" rules={[{ required: true }]}> 
          <Input placeholder="Cardiologist, Neurologist, etc." disabled={!!editingUser} />
        </Form.Item>

        <Form.Item name="licenseNumber" label="License Number" rules={[{ required: true }]}> 
          <Input placeholder="e.g. LIC-123456" disabled={!!editingUser} />
        </Form.Item>
      </>
    )}

    <Form.Item name="isActive" label="Status" rules={[{ required: true }]}> 
      <Select>
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
