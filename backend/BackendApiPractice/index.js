import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { connect } from "./connection/index.js";
import router from "./routes/index.js";
import dotenv from "dotenv";

dotenv.config();

connect(process.env.DB_URL);

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);

export function verifyToken(req, res, next) {
  let token = req.cookies.token;

  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, "this is secret key");

    req.user = decoded;
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

app.listen(5000, () => {
  console.log("app is listening port 5000");
});
