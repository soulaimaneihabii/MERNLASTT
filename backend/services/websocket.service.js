import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/User.model.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.userName = user.name;
        
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('WebSocket service initialized');
  }

  handleConnection(socket) {
    console.log(`User connected: ${socket.userName} (${socket.userRole})`);
    
    // Store user connection
    this.connectedUsers.set(socket.userId, {
      socketId: socket.id,
      role: socket.userRole,
      name: socket.userName,
      connectedAt: new Date()
    });

    // Join role-based rooms
    socket.join(socket.userRole);
    socket.join(`user_${socket.userId}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Medical Application',
      userId: socket.userId,
      role: socket.userRole
    });

    // Broadcast user online status to admins
    if (socket.userRole !== 'admin') {
      this.io.to('admin').emit('user_online', {
        userId: socket.userId,
        name: socket.userName,
        role: socket.userRole,
        timestamp: new Date()
      });
    }

    // Handle prediction requests
    socket.on('request_prediction', (data) => {
      this.handlePredictionRequest(socket, data);
    });

    // Handle prediction updates
    socket.on('update_prediction', (data) => {
      this.handlePredictionUpdate(socket, data);
    });

    // Handle patient updates
    socket.on('patient_updated', (data) => {
      this.handlePatientUpdate(socket, data);
    });

    // Handle chat messages
    socket.on('send_message', (data) => {
      this.handleChatMessage(socket, data);
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(data.room).emit('user_typing', {
        userId: socket.userId,
        name: socket.userName,
        isTyping: data.isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  handlePredictionRequest(socket, data) {
    console.log(`Prediction requested by ${socket.userName} for patient ${data.patientId}`);
    
    // Emit to all doctors and admins
    this.io.to('doctor').to('admin').emit('prediction_requested', {
      requestId: data.requestId,
      patientId: data.patientId,
      requestedBy: {
        id: socket.userId,
        name: socket.userName,
        role: socket.userRole
      },
      timestamp: new Date(),
      symptoms: data.symptoms,
      vitalSigns: data.vitalSigns
    });
  }

  handlePredictionUpdate(socket, data) {
    console.log(`Prediction updated by ${socket.userName}: ${data.predictionId}`);
    
    // Emit to patient's doctor and admins
    if (data.patientId) {
      this.io.to(`patient_${data.patientId}`).emit('prediction_updated', {
        predictionId: data.predictionId,
        status: data.status,
        result: data.result,
        updatedBy: {
          id: socket.userId,
          name: socket.userName,
          role: socket.userRole
        },
        timestamp: new Date()
      });
    }

    // Emit to all doctors and admins
    this.io.to('doctor').to('admin').emit('prediction_status_changed', {
      predictionId: data.predictionId,
      status: data.status,
      patientId: data.patientId,
      updatedBy: socket.userName,
      timestamp: new Date()
    });
  }

  handlePatientUpdate(socket, data) {
    console.log(`Patient updated by ${socket.userName}: ${data.patientId}`);
    
    // Emit to patient's assigned doctor and admins
    this.io.to('admin').emit('patient_updated', {
      patientId: data.patientId,
      changes: data.changes,
      updatedBy: {
        id: socket.userId,
        name: socket.userName,
        role: socket.userRole
      },
      timestamp: new Date()
    });
  }

  handleChatMessage(socket, data) {
    const message = {
      id: Date.now().toString(),
      senderId: socket.userId,
      senderName: socket.userName,
      senderRole: socket.userRole,
      content: data.content,
      room: data.room,
      timestamp: new Date()
    };

    // Emit to specific room
    this.io.to(data.room).emit('new_message', message);
    
    console.log(`Message sent by ${socket.userName} to room ${data.room}`);
  }

  handleDisconnection(socket) {
    console.log(`User disconnected: ${socket.userName}`);
    
    // Remove from connected users
    this.connectedUsers.delete(socket.userId);

    // Broadcast user offline status to admins
    if (socket.userRole !== 'admin') {
      this.io.to('admin').emit('user_offline', {
        userId: socket.userId,
        name: socket.userName,
        role: socket.userRole,
        timestamp: new Date()
      });
    }
  }

  // Public methods for emitting events from other parts of the application
  
  notifyPredictionCreated(prediction, patient, doctor) {
    if (!this.io) return;

    // Notify the doctor who created the prediction
    this.io.to(`user_${doctor._id}`).emit('prediction_created', {
      predictionId: prediction._id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      result: prediction.predictionResult,
      confidence: prediction.confidence,
      timestamp: prediction.date
    });

    // Notify admins
    this.io.to('admin').emit('new_prediction', {
      predictionId: prediction._id,
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorName: doctor.name,
      result: prediction.predictionResult,
      confidence: prediction.confidence,
      timestamp: prediction.date
    });
  }

  notifyPatientRegistered(patient, doctor) {
    if (!this.io) return;

    // Notify the assigned doctor
    this.io.to(`user_${doctor._id}`).emit('patient_registered', {
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      age: this.calculateAge(patient.dateOfBirth),
      symptoms: patient.symptoms,
      timestamp: patient.createdAt
    });

    // Notify admins
    this.io.to('admin').emit('new_patient', {
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorName: doctor.name,
      age: this.calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      timestamp: patient.createdAt
    });
  }

  notifySystemAlert(alert) {
    if (!this.io) return;

    // Broadcast system alerts to all connected users
    this.io.emit('system_alert', {
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      timestamp: new Date()
    });
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  getUserConnectionStatus(userId) {
    return this.connectedUsers.has(userId);
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

export default new WebSocketService();