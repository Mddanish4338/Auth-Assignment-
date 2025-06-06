const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs"); // Changed to bcryptjs
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const UserModel = require("./models/User");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", methods: ["GET", "POST"], credentials: true }));
app.use(cookieParser());

mongoose
  .connect("", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB Connection Error:", err));

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Token is missing" });

  jwt.verify(token, "jwt-secret-key", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    if (decoded.role !== "admin") return res.status(403).json({ message: "Access denied" });
    next();
  });
};

app.get("/dashboard", verifyUser, (req, res) => {
  res.json("Success");
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({ name, email, password: hashedPassword, role: "user" });
    res.json({ Status: "Success" });
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "No record found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign({ email: user.email, role: user.role }, "jwt-secret-key", { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, secure: false });
    res.json({ Status: "Success", role: user.role });
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.listen(3001, () => console.log("Server is running on port 3001"));
