import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    browser: {
      type: String,
      required: true,
    },
    os: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      required: true,
    },
    currentDeviceToken: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Device = mongoose.model("Device", deviceSchema);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    qrCode: {
      type: String,
    },
    secret: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
