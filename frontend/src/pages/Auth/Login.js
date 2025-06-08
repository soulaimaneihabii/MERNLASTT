"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Alert, Space, notification } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { loginUser, clearError } from "../../store/slices/authSlice";

const { Title, Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const redirectPath = {
        admin: "/admin",
        doctor: "/doctor",
        patient: "/patient",
      }[user.role] || "/dashboard";

      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onFinish = async (values) => {
    const now = Date.now();
    if (now - lastAttemptTime < 2000) {
      notification.warning({
        message: "Please wait",
        description: "Wait a moment before trying again",
        duration: 2,
      });
      return;
    }
    setLastAttemptTime(now);
    setIsSubmitting(true);

    try {
      const result = await dispatch(loginUser(values)).unwrap();
      notification.success({
        message: "Login Successful",
        description: `Welcome back, ${result.user.name || "User"}!`,
      });
    } catch (error) {
      if (error?.status === 429) {
        notification.error({
          message: "Too Many Attempts",
          description: "Please wait a few minutes before trying again",
          duration: 5,
        });
      } else {
        notification.error({
          message: "Login Failed",
          description: error?.message || "Invalid credentials or server error",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div className="login-header">
            
            <Title level={2} style={{ color: "#1890ff", marginBottom: 4 }}>
              MedApp
            </Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => dispatch(clearError())}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please input your password!" },
                { min: 6, message: "Password must be at least 6 characters!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || isSubmitting}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  height: "45px",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
                disabled={isSubmitting}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", fontSize: "12px", color: "#999" }}>
            © {new Date().getFullYear()} MedApp. All rights reserved.
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="debug-info">
              Debug: isAuth={isAuthenticated ? "true" : "false"}, user={user ? user.role : "null"}
            </div>
          )}
        </Space>
      </Card>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1f1c2c 0%, #928dab 100%);
          padding: 20px;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 32px 24px;
          background-color: #fff;
        }
        .login-header {
          text-align: center;
        }
        .debug-info {
          font-size: 10px;
          color: #666;
          text-align: center;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default Login;
