// src/pages/Settings.jsx
import React from "react";
import { Card, Typography, Form, Input, Button } from "antd";

const { Title } = Typography;

const Settings = () => {
  const [form] = Form.useForm();

  const handleSave = (values) => {
    console.log("Settings saved:", values);
  };

  return (
    <Card>
      <Title level={3}>Settings</Title>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Change Display Name" name="displayName">
          <Input placeholder="Enter new name" />
        </Form.Item>

        <Form.Item label="Change Password" name="password">
          <Input.Password placeholder="Enter new password" />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Save Changes
        </Button>
      </Form>
    </Card>
  );
};

export default Settings;
