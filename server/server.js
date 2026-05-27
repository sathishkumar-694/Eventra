import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { testDB } from "./database/db.js";

dotenv.config();

const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cors());

app.get("/health", async (req, res) => {
  try {
    const data = await testDB();

    return res.status(200).json({
      success: true,
      message: "DB connected",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to connect",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log("Server is running successfully on port", PORT);
});
