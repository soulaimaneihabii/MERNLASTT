// src/pages/Profile.jsx
import React from "react";
import { Card, Typography, Descriptions } from "antd";
import { useSelector } from "react-redux";

const { Title } = Typography;

const Profile = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Card>
      <Title level={3}>My Profile</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Name">{user?.name}</Descriptions.Item>
        <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
        <Descriptions.Item label="Role">{user?.role}</Descriptions.Item>
        <Descriptions.Item label="Status">
          {user?.isActive ? "Active" : "Inactive"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default Profile;
