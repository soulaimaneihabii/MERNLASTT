"use client"

import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"
import { Calendar, Badge, Modal, Form, Select, DatePicker, TimePicker, Button, notification } from "antd"
import { useDispatch, useSelector } from "react-redux"
import dayjs from "dayjs"
import { fetchAppointments, createAppointment } from "../../store/slices/appointmentsSlice"

const { Option } = Select

const AppointmentCalendar = () => {
  const dispatch = useDispatch()
  const { appointments, loading } = useSelector((state) => state.appointments)
  const { patients } = useSelector((state) => state.patients)
  const { user } = useSelector((state) => state.auth)

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAppointments({ doctorId: user.id }))
    }
  }, [dispatch, user?.id])

  const dateCellRender = (value) => {
    const date = value.format("YYYY-MM-DD")
    const dayAppointments = appointments.filter((app) => dayjs(app.dateTime).format("YYYY-MM-DD") === date)

    return (
      <ul className="events">
        {dayAppointments.map((appointment) => (
          <li key={appointment.id}>
            <Badge
              status={appointment.status === "confirmed" ? "success" : "processing"}
              text={`${dayjs(appointment.dateTime).format("HH:mm")} - ${appointment.patientName}`}
            />
          </li>
        ))}
      </ul>
    )
  }

  const handleDateSelect = (value) => {
    setSelectedDate(value)
    setIsModalVisible(true)
    form.setFieldsValue({
      date: value,
      time: dayjs("09:00:00", "HH:mm:ss"),
      duration: 30,
    })
  }

  const handleCreateAppointment = async () => {
    try {
      const values = await form.validateFields()
      const dateTime = values.date.clone().hour(values.time.hour()).minute(values.time.minute())

      await dispatch(
        createAppointment({
          doctorId: user.id,
          patientId: values.patientId,
          dateTime: dateTime.toISOString(),
          duration: values.duration,
          notes: values.notes,
          status: "scheduled",
        }),
      ).unwrap()

      notification.success({
        message: "Success",
        description: "Appointment scheduled successfully",
      })

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to schedule appointment",
      })
    }
  }

  return (
    <div>
      <Calendar dateCellRender={dateCellRender} onSelect={handleDateSelect} />

      <Modal
        title="Schedule Appointment"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleCreateAppointment}>
            Schedule
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="patientId" label="Patient" rules={[{ required: true, message: "Please select a patient" }]}>
            <Select placeholder="Select patient">
              {patients.map((patient) => (
                <Option key={patient.id} value={patient.id}>
                  {patient.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Please select a date" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="time" label="Time" rules={[{ required: true, message: "Please select a time" }]}>
            <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Duration (minutes)"
            rules={[{ required: true, message: "Please select duration" }]}
          >
            <Select>
              <Option value={15}>15 minutes</Option>
              <Option value={30}>30 minutes</Option>
              <Option value={45}>45 minutes</Option>
              <Option value={60}>60 minutes</Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppointmentCalendar
