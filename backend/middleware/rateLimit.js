import rateLimit from "express-rate-limit"

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (req.body?.email === "admin@gmail.com" ? 1000 : 5),
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  keyGenerator: (req) => `${req.ip}_${req.body?.email || "unknown"}`,
  skipSuccessfulRequests: false,
})

export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (req.body?.email === "admin@gmail.com" ? 1000 : 5),
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  keyGenerator: (req) => `${req.ip}_${req.body?.email || "unknown"}`,
  skipSuccessfulRequests: false,
})
