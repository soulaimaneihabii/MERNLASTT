// import nodemailer from "nodemailer"

// class NotificationService {
//   constructor() {
//     this.transporter = this.createTransporter()
//   }

//   createTransporter() {
//     return nodemailer.createTransporter({
//       host: process.env.SMTP_HOST,
//       port: process.env.SMTP_PORT,
//       secure: false, // true for 465, false for other ports
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     })
//   }

//   async sendEmail(options) {
//     const message = {
//       from: `${process.env.FROM_NAME || "Medical App"} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
//       to: options.email,
//       subject: options.subject,
//       text: options.message,
//       html: options.html,
//     }

//     try {
//       const info = await this.transporter.sendMail(message)
//       console.log("Email sent: ", info.messageId)
//       return info
//     } catch (error) {
//       console.error("Error sending email:", error)
//       throw error
//     }
//   }

//   async sendEmailVerification(user, token) {
//     const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`

//     const message = `
//       <h1>Email Verification</h1>
//       <p>Hello ${user.name},</p>
//       <p>Please click the link below to verify your email address:</p>
//       <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
//       <p>If you did not create an account, please ignore this email.</p>
//       <p>This link will expire in 24 hours.</p>
//     `

//     await this.sendEmail({
//       email: user.email,
//       subject: "Email Verification - Medical Application",
//       html: message,
//     })
//   }

//   async sendPasswordReset(user, token) {
//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`

//     const message = `
//       <h1>Password Reset</h1>
//       <p>Hello ${user.name},</p>
//       <p>You have requested a password reset. Please click the link below to reset your password:</p>
//       <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
//       <p>If you did not request this, please ignore this email.</p>
//       <p>This link will expire in 10 minutes.</p>
//     `

//     await this.sendEmail({
//       email: user.email,
//       subject: "Password Reset - Medical Application",
//       html: message,
//     })
//   }

//   async sendPatientRegistrationNotification(doctor, patient) {
//     const message = `
//       <h1>New Patient Registered</h1>
//       <p>Hello Dr. ${doctor.name},</p>
//       <p>A new patient has been registered under your care:</p>
//       <ul>
//         <li><strong>Name:</strong> ${patient.fullName}</li>
//         <li><strong>Age:</strong> ${patient.age}</li>
//         <li><strong>Email:</strong> ${patient.email}</li>
//         <li><strong>Phone:</strong> ${patient.phone}</li>
//       </ul>
//       <p>Please review the patient's information in the medical application.</p>
//     `

//     await this.sendEmail({
//       email: doctor.email,
//       subject: "New Patient Registration - Medical Application",
//       html: message,
//     })
//   }

//   async sendPredictionNotification(doctor, patient, prediction) {
//     const riskColor = {
//       "Low Risk": "#28a745",
//       "Medium Risk": "#ffc107",
//       "High Risk": "#fd7e14",
//       "Critical Risk": "#dc3545",
//     }

//     const message = `
//       <h1>AI Prediction Result</h1>
//       <p>Hello Dr. ${doctor.name},</p>
//       <p>A new AI prediction has been generated for patient <strong>${patient.fullName}</strong>:</p>
//       <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
//         <h3>Prediction Results</h3>
//         <p><strong>Risk Level:</strong> <span style="color: ${riskColor[prediction.predictionResult]}; font-weight: bold;">${prediction.predictionResult}</span></p>
//         <p><strong>Confidence:</strong> ${(prediction.confidence * 100).toFixed(1)}%</p>
//         <p><strong>Date:</strong> ${new Date(prediction.createdAt).toLocaleDateString()}</p>
//       </div>
//       ${
//         prediction.riskFactors.length > 0
//           ? `
//         <h4>Risk Factors:</h4>
//         <ul>
//           ${prediction.riskFactors.map((factor) => `<li>${factor}</li>`).join("")}
//         </ul>
//       `
//           : ""
//       }
//       ${
//         prediction.recommendations.length > 0
//           ? `
//         <h4>Recommendations:</h4>
//         <ul>
//           ${prediction.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
//         </ul>
//       `
//           : ""
//       }
//       <p>Please review this prediction in the medical application and take appropriate action.</p>
//     `

//     await this.sendEmail({
//       email: doctor.email,
//       subject: `AI Prediction Alert: ${patient.fullName} - ${prediction.predictionResult}`,
//       html: message,
//     })
//   }

//   async sendWelcomeEmail(user) {
//     const message = `
//       <h1>Welcome to Medical Application</h1>
//       <p>Hello ${user.name},</p>
//       <p>Welcome to our medical application! Your account has been successfully created.</p>
//       <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
//         <h3>Account Details</h3>
//         <p><strong>Role:</strong> ${user.role}</p>
//         <p><strong>Email:</strong> ${user.email}</p>
//         ${user.specialization ? `<p><strong>Specialization:</strong> ${user.specialization}</p>` : ""}
//         ${user.department ? `<p><strong>Department:</strong> ${user.department}</p>` : ""}
//       </div>
//       <p>You can now log in to the application and start using our AI-powered medical prediction system.</p>
//       <p>If you have any questions, please don't hesitate to contact our support team.</p>
//     `

//     await this.sendEmail({
//       email: user.email,
//       subject: "Welcome to Medical Application",
//       html: message,
//     })
//   }

//   async sendSystemAlert(message, recipients = []) {
//     const adminEmail = process.env.ADMIN_EMAIL
//     const emailList = recipients.length > 0 ? recipients : [adminEmail]

//     const alertMessage = `
//       <h1>System Alert</h1>
//       <p>A system alert has been triggered:</p>
//       <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
//         <p><strong>Alert:</strong> ${message}</p>
//         <p><strong>Time:</strong> ${new Date().toISOString()}</p>
//       </div>
//       <p>Please investigate this alert immediately.</p>
//     `

//     for (const email of emailList) {
//       try {
//         await this.sendEmail({
//           email,
//           subject: "System Alert - Medical Application",
//           html: alertMessage,
//         })
//       } catch (error) {
//         console.error(`Failed to send alert to ${email}:`, error)
//       }
//     }
//   }
// }

// export default new NotificationService()
