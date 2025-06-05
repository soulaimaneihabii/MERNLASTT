import mongoose from "mongoose"

const predictionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "Patient",
      required: [true, "Prediction must belong to a patient"],
    },
    doctor: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Prediction must be created by a doctor"],
    },
    predictionResult: {
      type: String,
      required: [true, "Prediction result is required"],
      enum: ["Low Risk", "Medium Risk", "High Risk", "Critical Risk"],
    },
    diseaseTypes: {
      diabetes: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
      cardiovascular: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
      other: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
    },
    confidence: {
      type: Number,
      required: [true, "Confidence score is required"],
      min: [0, "Confidence cannot be negative"],
      max: [1, "Confidence cannot be greater than 1"],
    },
    riskFactors: [
      {
        type: String,
        trim: true,
      },
    ],
    recommendations: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "under_review"],
      default: "pending",
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot be more than 1000 characters"],
    },
    confirmedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    confirmedAt: {
      type: Date,
    },
    metadata: {
      modelVersion: {
        type: String,
        default: "1.0.0",
      },
      processingTime: {
        type: Number,
        min: 0,
      },
      aiServiceVersion: {
        type: String,
      },
      inputDataHash: {
        type: String,
      },
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for better performance
predictionSchema.index({ patient: 1, createdAt: -1 })
predictionSchema.index({ doctor: 1, createdAt: -1 })
predictionSchema.index({ status: 1 })
predictionSchema.index({ predictionResult: 1 })
predictionSchema.index({ confidence: -1 })
predictionSchema.index({ createdAt: -1 })

// Virtual for days since prediction
predictionSchema.virtual("daysSincePrediction").get(function () {
  const now = new Date()
  const diffTime = Math.abs(now - this.createdAt)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// Virtual for risk level based on confidence
predictionSchema.virtual("riskLevel").get(function () {
  if (this.confidence >= 0.8) return "High Confidence"
  if (this.confidence >= 0.6) return "Medium Confidence"
  return "Low Confidence"
})

// Method to check if prediction needs follow-up
predictionSchema.methods.needsFollowUp = function () {
  if (this.followUpRequired && this.followUpDate) {
    return new Date() >= this.followUpDate
  }
  return false
}

// Method to get prediction summary
predictionSchema.methods.getSummary = function () {
  return {
    id: this._id,
    result: this.predictionResult,
    confidence: this.confidence,
    status: this.status,
    riskLevel: this.riskLevel,
    daysSince: this.daysSincePrediction,
    needsFollowUp: this.needsFollowUp(),
  }
}

// Static method to get predictions by risk level
predictionSchema.statics.getByRiskLevel = function (riskLevel) {
  return this.find({ predictionResult: riskLevel })
    .populate("patient", "firstName lastName age")
    .populate("doctor", "name specialization")
    .sort("-createdAt")
}

// Static method to get recent predictions
predictionSchema.statics.getRecent = function (limit = 10) {
  return this.find({ isArchived: false })
    .populate("patient", "firstName lastName age")
    .populate("doctor", "name specialization")
    .sort("-createdAt")
    .limit(limit)
}

// Pre-save middleware to set follow-up date for high-risk predictions
predictionSchema.pre("save", function (next) {
  if (this.isNew && (this.predictionResult === "High Risk" || this.predictionResult === "Critical Risk")) {
    this.followUpRequired = true
    if (!this.followUpDate) {
      // Set follow-up date to 7 days from now for high risk, 3 days for critical
      const daysToAdd = this.predictionResult === "Critical Risk" ? 3 : 7
      this.followUpDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000)
    }
  }
  next()
})

export default mongoose.model("Prediction", predictionSchema)
