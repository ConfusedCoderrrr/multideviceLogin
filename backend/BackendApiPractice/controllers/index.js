import bcrypt from "bcrypt";
import { User, Device } from "../model/index.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import speakeasy from "speakeasy";
import DeviceDetector from "device-detector-js";
import nodemailer from "nodemailer";

dotenv.config();

export const testApi = (req, res) => {
  res.send("testing api");
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
});

export const registerUser = async (req, res) => {
  const { email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const secret = speakeasy.generateSecret({
    name: "Multi device login website",
  });
  try {
    const user = User.find({ email, role });
    console.log(user.email, user.role, "  ", role);
    if (!user.email) {
      const newUser = new User({
        password: hashedPassword,
        email,
        secret,
        role,
      });
      await newUser.save();
      res.status(201).send("User created successfully");
    } else {
      res.status(400).send("User already exists");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

export const loginUser = async (req, res) => {
  const { email, password, currentDeviceToken, role } = req.body;

  const userAgent = req.headers["user-agent"];

  const deviceDetector = new DeviceDetector();
  const deviceInfo = deviceDetector.parse(userAgent);

  const browser = deviceInfo?.client?.name || "unknown";
  const os = deviceInfo?.os?.name || "unknown";
  const deviceType = deviceInfo?.device?.type || "unknown";

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch || role !== user.role) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if the user is logging in from a new device
    const existingDevice = await Device.findOne({
      user: user._id,
      browser,
      os,
      device: deviceType,
    });
    if (!existingDevice) {
      // If the device is new, save device information to the database
      const device = new Device({
        user: user._id,
        browser,
        os,
        device: deviceType,
        currentDeviceToken,
      });
      await device.save();
    }

    // Generate JWT token
    const token = await jwt.sign(
      { id: user._id, email: user.email },
      "this is secret key"
    );

    // Set token in cookie and send response
    res.cookie("token", token, { httpOnly: true });
    return res
      .status(200)
      .json({ message: "Login successful", userInfo: user, token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getLoginHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const devices = await Device.find({ user: userId });

    return res.status(200).json({ devices });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logoutDevice = async (req, res) => {
  const userId = req.user.id; // Assuming you have middleware to extract user information from the request
  const deviceId = req.params.deviceId; // Assuming you pass device id in the route parameters

  try {
    // Find the device associated with the user
    const device = await Device.findOne({ user: userId, _id: deviceId });
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    await Device.findByIdAndDelete(deviceId);

    return res.status(200).json({ message: "Device logout successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Logout from all devices
export const logoutAllDevices = async (req, res) => {
  const userId = req.user.id; // Assuming you have middleware to extract user information from the request

  try {
    // Remove all devices associated with the user from the database
    await Device.deleteMany({ user: userId });

    return res.status(200).json({ message: "Logged out from all devices" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyUser = async (req, res) => {
  const { userInfo } = req.body;

  try {
    const verified = speakeasy.totp.verify({
      secret: userInfo.secret,
      encoding: "base32",
      token: userInfo.token,
      window: 2,
    });

    if (verified) {
      res.status(200).json({ message: "OTP is valid" });
    } else {
      res.status(401).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  const updatedInfo = req.body;
  const userId = req.user.id;

  try {
    if (updatedInfo.password) {
      updatedInfo.password = await bcrypt.hash(updatedInfo.password, 10);
    }
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updatedInfo },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
      verify;
    }
    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteUser = async (req, res) => {
  const userId = req.user.id;
  try {
    const del = await User.findOneAndDelete({ _id: userId });
    if (del) {
      return res.status(200).send({ message: "User deleted successfully" });
    } else {
      return res.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export const generateOtp = async (req, res) => {
  try {
    // Generate OTP code (e.g., 6-digit random number)
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    // Send email with OTP code
    await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to: req.body.to, // Recipient's email address
      subject: "Your OTP Code", // Subject line
      html: `<h1>Your OTP is: ${otpCode}</h1>`, // HTML body with the OTP code
    });

    const hashedCode = await bcrypt.hash(otpCode.toString(), 10);
    console.log(hashedCode);

    res.json({ message: "OTP email sent successfully!", hashedCode });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "An error occurred while sending email." });
  }
};

export const verifyOtp = async (req, res) => {
  const { userOtp, hashedOtp } = req.body;

  const compare = await bcrypt.compare(userOtp, hashedOtp);

  console.log(compare);

  if (compare) {
    res.json({ message: "OTP verified successfully!" });
  } else {
    res.status(400).json({ error: "Invalid OTP. Please try again." });
  }
};

export const congratualationRegistration = async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to: req.body.to,
      subject: "Registration successfull",
      html: `<h1>You have successfully registered</h1>`,
    });

    const hashedCode = await bcrypt.hash(otpCode.toString(), 10);
    console.log(hashedCode);

    res.json({ message: "registered successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "An error occurred." });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
