"use client";

import React, { useEffect, useState } from "react";
import { Card, Typography, Spin, Alert, Tag, Row, Col, Statistic, Divider } from "antd";
import API from "../../services/api";

const { Title, Paragraph } = Typography;

const SystemInfo = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSystemHealth = async () => {
    setLoading(true);
    try {
      const res = await API.get("/analytics/system-health");
      setSystemHealth(res.data.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch system health", err);
      setError("Failed to load system health data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const renderStatusTag = (status) => {
    return (
      <Tag color={status === "healthy" ? "green" : "red"} style={{ fontSize: "14px", padding: "3px 8px" }}>
        {status?.toUpperCase()}
      </Tag>
    );
  };

  return (
    <div>
      <Title level={2}>System Information</Title>
      <Divider />

      {loading ? (
        <Spin tip="Loading system health..." size="large" />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {/* Database Health */}
            <Col span={8}>
              <Card title="Database Health" bordered={true}>
                <Paragraph>
                  Status: {renderStatusTag(systemHealth?.database?.status)}
                </Paragraph>
                <Divider />
                <Statistic title="Users" value={systemHealth?.database?.collections?.users || 0} />
                <Statistic title="Patients" value={systemHealth?.database?.collections?.patients || 0} />
                <Statistic title="Predictions" value={systemHealth?.database?.collections?.predictions || 0} />
              </Card>
            </Col>

            {/* AI Service Health */}
            <Col span={8}>
              <Card title="AI Service Health" bordered={true}>
                <Paragraph>
                  Status: {renderStatusTag(systemHealth?.aiService?.status)}
                </Paragraph>
                <Paragraph>
                  Last checked: {systemHealth?.aiService?.timestamp || "-"}
                </Paragraph>
                {systemHealth?.aiService?.error && (
                  <Alert
                    message="AI Service Error"
                    description={systemHealth.aiService.error}
                    type="error"
                    showIcon
                  />
                )}
              </Card>
            </Col>

            {/* System Metrics */}
            <Col span={8}>
              <Card title="System Metrics" bordered={true}>
                <Statistic
                  title="Uptime (seconds)"
                  value={systemHealth?.system?.uptime?.toFixed(0)}
                />
                <Statistic
                  title="Platform"
                  value={systemHealth?.system?.platform || "-"}
                />
                <Statistic
                  title="Node.js Version"
                  value={systemHealth?.system?.nodeVersion || "-"}
                />
                <Statistic
                  title="Memory RSS (MB)"
                  value={((systemHealth?.system?.memory?.rss || 0) / (1024 * 1024)).toFixed(2)}
                />
                <Paragraph>
                  Timestamp: {systemHealth?.system?.timestamp || "-"}
                </Paragraph>
              </Card>
            </Col>
          </Row>

          {/* Optionally: You can also show Performance Metrics */}
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Performance Metrics" bordered={true}>
                <Statistic
                  title="Avg Response Time"
                  value={systemHealth?.performance?.avgResponseTime || "-"}
                />
                <Statistic
                  title="Requests Per Minute"
                  value={systemHealth?.performance?.requestsPerMinute || 0}
                />
                <Statistic
                  title="Error Rate"
                  value={`${(systemHealth?.performance?.errorRate * 100).toFixed(2)}%`}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default SystemInfo;
