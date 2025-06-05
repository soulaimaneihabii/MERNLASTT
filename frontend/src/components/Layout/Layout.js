"use client"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Space, Typography } from "antd"
import {
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
} from "@ant-design/icons"
import { logoutUser } from "../../store/slices/authSlice"

const { Header, Sider, Content } = AntLayout
const { Title } = Typography

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate("/login")
  }

  const getMenuItems = () => {
    const baseItems = [
      {
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
      },
    ]

    switch (user?.role) {
      case "admin":
        return [
          ...baseItems,
          {
            key: "/admin",
            icon: <TeamOutlined />,
            label: "System Management",
          },
        ]
      case "doctor":
        return [
          ...baseItems,
          {
            key: "/doctor",
            icon: <TeamOutlined />,
            label: "My Patients",
          },
          {
            key: "/doctor/enhanced-medical-info",
            icon: <MedicineBoxOutlined />,
            label: "Enhanced Medical Info",
          },
          {
            key: "/doctor/predictions",
            icon: <ExperimentOutlined />,
            label: "AI Predictions",
          },
        ]
      case "patient":
        return [
          ...baseItems,
          {
            key: "/patient",
            icon: <FileTextOutlined />,
            label: "My Records",
          },
          {
            key: "/patient/form",
            icon: <FileTextOutlined />,
            label: "Medical Form",
          },
        ]
      default:
        return baseItems
    }
  }

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
  ]

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        theme="light"
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
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
          </Title>

          <Space>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={["click"]}>
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
            background: "#fff",
            borderRadius: "8px",
            minHeight: "calc(100vh - 112px)",
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
