"use client";

import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Space,
  Typography,
  Switch,
} from "antd";
import {
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { logoutUser } from "../../store/slices/authSlice";

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === "profile") {
      navigate("/profile");
    } else if (key === "settings") {
      navigate("/settings");
    }
    // Logout is already handled in item itself
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case "admin":
        return [
          {
            key: "/admin",
            icon: <DashboardOutlined />,
            label: "Global Dashboard",
          },
          {
            key: "/admin/GestionUsers",
            icon: <TeamOutlined />,
            label: "Gestion Users",
          },
        ];
      case "doctor":
        return [
          {
            key: "/doctor",
            icon: <DashboardOutlined />,
            label: "My Dashboard",
          },
          {
            key: "/doctor/patients",
            icon: <TeamOutlined />,
            label: "My Patients",
          },
          {
            key: "/doctor/medical-info",
            icon: <MedicineBoxOutlined />,
            label: "Medical Info",
          },
          {
            key: "/doctor/predictions",
            icon: <ExperimentOutlined />,
            label: "AI Predictions",
          },
        ];
      case "patient":
        return [
          {
            key: "/patient",
            icon: <DashboardOutlined />,
            label: "My Dashboard",
          },
          {
            key: "/patient/form",
            icon: <FileTextOutlined />,
            label: "Medical Form",
          },
        ];
      default:
        return [];
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        theme={isDarkMode ? "dark" : "light"}
        width={250}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ padding: "16px", textAlign: "center" }}>
          <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
            MedApp
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <AntLayout style={{ marginLeft: 250 }}>
        <Header
          style={{
            padding: "0 24px",
            background: isDarkMode ? "#1f1f1f" : "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          <Title
            level={4}
            style={{
              margin: 0,
              color: isDarkMode ? "#fff" : "inherit",
            }}
          >
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
          </Title>

          <Space>
            {/* Dark Mode Switch */}
            <Switch
              checkedChildren="🌙"
              unCheckedChildren="☀️"
              checked={isDarkMode}
              onChange={setIsDarkMode}
            />

            {/* User Dropdown */}
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button type="text" style={{ height: "auto", padding: "4px 8px" }}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>{user?.name || user?.email}</span>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: "24px",
            padding: "24px",
            background: isDarkMode ? "#141414" : "#fff",
            color: isDarkMode ? "#ddd" : "inherit",
            borderRadius: "8px",
            minHeight: "calc(100vh - 112px)",
            transition: "all 0.3s",
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
