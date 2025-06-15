"use client";

import { useState, useEffect } from "react";
import { Button, notification } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import axios from "axios";

const PatientDSEExport = () => {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await axios.get("/api/patients/me");
        setPatientData(response.data);
      } catch (error) {
        console.error("Failed to fetch patient data", error);
      }
    };

    fetchPatientData();
  }, []);

  const exportDSE = () => {
    if (!patientData) {
      notification.error({
        message: "No data",
        description: "Patient data is not available.",
      });
      return;
    }

    const dseData = {
      patientId: patientData._id,
      name: patientData.fullName,
      email: patientData.email,
      age: patientData.age,
      gender: patientData.gender,
      medications: patientData.currentMedications || [],
      labTests: patientData.num_lab_procedures,
      hospitalizations: patientData.number_inpatient,
      emergencies: patientData.number_emergency,
      medicalFiles: patientData.medicalFiles?.map((file) => ({
        name: file.name,
        url: file.url,
        uploadDate: file.uploadDate,
        type: file.type,
        size: file.size,
      })) || [],
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dseData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DSE_${patientData.fullName || "patient"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notification.success({
      message: "Export Successful",
      description: "Your DSE file has been downloaded.",
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>📄 Export My DSE File</h1>
      <Button
        type="primary"
        icon={<FileTextOutlined />}
        onClick={exportDSE}
        loading={loading}
      >
        Export My DSE
      </Button>
    </div>
  );
};

export default PatientDSEExport;