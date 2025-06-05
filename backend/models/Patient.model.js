import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    // 🔥 Nouvelle clé pour lier au User
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Un seul patient par User
    },

    // Champ existant
    doctor: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please add a valid email"],
    },
    phone: {
      type: String,
      required: false,
      match: [/^\+?[\d\s\-]+$/, "Please add a valid phone number"],
    },
    dateOfBirth: {
      type: Date,
      required: false,
      validate: {
        validator: (value) => !value || value < new Date(),
        message: "Date of birth must be in the past",
      },
    },

    // AI Medical Prediction Data
    age: {
      type: Number,
      required: false,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      required: false,
      enum: ["Male", "Female", "Other"],
    },
    race: {
      type: String,
      required: false,
      enum: ["White", "Caucasian", "African American", "Asian", "Hispanic", "Other"],
    },
    diag_1: {
      type: String,
      required: false,
      trim: true,
      maxlength: 10,
    },
    diag_2: {
      type: String,
      trim: true,
      maxlength: 10,
      default: null,
    },
    diag_3: {
      type: String,
      trim: true,
      maxlength: 10,
      default: null,
    },

    // Test Results
    max_glu_serum: {
      type: String,
      enum: ["None", "Norm", ">200", ">300"],
      default: "None",
    },
    A1Cresult: {
      type: String,
      enum: ["None", "Norm", ">7", ">8"],
      default: "None",
    },
    insulin: {
      type: String,
      enum: ["No", "Down", "Steady", "Up"],
      default: "No",
    },
    metformin: {
      type: String,
      enum: ["No", "Down", "Steady", "Up"],
      default: "No",
    },
    diabetesMed: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    // Hospital Statistics
    time_in_hospital: {
      type: Number,
      required: false,
      min: 1,
      max: 14,
    },
    num_lab_procedures: {
      type: Number,
      required: false,
      min: 0,
      max: 132,
    },
    num_procedures: {
      type: Number,
      required: false,
      min: 0,
      max: 6,
    },
    num_medications: {
      type: Number,
      required: false,
      min: 1,
      max: 81,
    },
    number_outpatient: {
      type: Number,
      required: false,
      min: 0,
      max: 42,
    },
    number_emergency: {
      type: Number,
      required: false,
      min: 0,
      max: 76,
    },
    number_inpatient: {
      type: Number,
      required: false,
      min: 0,
      max: 21,
    },
    number_diagnoses: {
      type: Number,
      required: false,
      min: 1,
      max: 16,
    },

    // Address
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: {
        type: String,
        validate: {
          validator: (v) => !v || /^\d{5}(?:[-\s]\d{4})?$/.test(v),
          message: (props) => `${props.value} is not a valid zip code!`,
        },
      },
    },

    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: {
        type: String,
        match: [/^\+?[\d\s\-]+$/, "Please add a valid phone number"],
      },
    },

    // Medical History
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    currentMedications: [
      {
        name: { type: String, required: true, trim: true },
        dosage: { type: String, required: true, trim: true },
        frequency: { type: String, required: true, trim: true },
      },
    ],
    medicalHistory: [
      {
        condition: { type: String, required: true, trim: true },
        diagnosedDate: { type: Date, required: true },
        status: { type: String, enum: ["Active", "Resolved", "Chronic"], default: "Active" },
      },
    ],

    // Medical Files
    medicalFiles: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        size: { type: Number, required: true },
        uid: { type: String, required: true },
        url: { type: String },
        uploadDate: { type: Date, default: Date.now },
      },
    ],

    // System Fields
    status: {
      type: String,
      enum: ["Active", "Inactive", "Discharged"],
      default: "Active",
    },
    lastVisit: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for calculated age
patientSchema.virtual("calculatedAge").get(function () {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return null;
});

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
