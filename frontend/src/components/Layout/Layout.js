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
  Image,
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
import logo from '../../assests/logo.png'
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
    <AntLayout style={{ minHeight: "100vh", fontFamily: "Roboto, sans-serif" }}>
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
          backgroundColor: isDarkMode ? "#1f1f1f" : "#fffff",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.15)",
          
        }}
      >

        <div style={{ padding: "16px", textAlign: "center" }}>
          
           <img src={logo} style={{width:50}} />
        </div>
        <Menu
          theme={isDarkMode ? "dark" : "light"}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
          style={{
            backgroundColor: isDarkMode ? "#1f1f1f" : "#fffff",
            color: "#ffffff",
            fontSize:16,
            
          }}
        />
      </Sider>

      <AntLayout style={{ marginLeft: 250 }}>
        <Header
          style={{
            padding: "0 32px",
            background: isDarkMode ? "#1f1f1f" : "#3e5672",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            borderBottom: "1px solid #ccc",
           
          }}
        >
          <Title
            level={4}
            style={{
              margin: 0,
              color: isDarkMode ? "#ffffff" : "#ffffff",
              fontWeight: 700,
              fontSize:25,
            }}
          >
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
          </Title>

          <Space>
            <Switch
              checkedChildren="🌙"
              unCheckedChildren="☀"
              checked={isDarkMode}
              onChange={setIsDarkMode}
            />

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button
                type="primary"
                style={{
                  backgroundColor: "#d9eefb",
                  borderColor: "#3e5672",
                  borderRadius: "20px",
                  fontWeight: 500,
                  color:"#000000"
                }}
              >
                <Space>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#fffff" }}
                  />
                 
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: "24px",
            padding: "24px",
            background: isDarkMode ? "#141414" : "#ffffff",
            color: isDarkMode ? "#ddd" : "#fffff",
            borderRadius: "12px",
            minHeight: "calc(100vh - 112px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
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