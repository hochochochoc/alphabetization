import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/listening_progress", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        target_letter,
        COUNT(*) as total_attempts,
        ROUND((SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as progress_percentage
      FROM guess_history 
      GROUP BY target_letter
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Enhanced session endpoint that handles all test types
app.post("/api/session", async (req, res) => {
  try {
    const {
      target_letter,
      options,
      user_answer,
      correct,
      test_type = "listening", // Default to listening if not specified
    } = req.body;

    const [result] = await pool.query(
      "INSERT INTO guess_history (target_letter, options, user_answer, correct, test_type) VALUES (?, ?, ?, ?, ?)",
      [
        target_letter,
        options.join(","),
        user_answer,
        correct ? 1 : 0,
        test_type,
      ],
    );

    res.json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get progress for writing tests
app.get("/api/writing_progress", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        target_letter,
        COUNT(*) as total_attempts,
        ROUND((SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as progress_percentage
      FROM guess_history 
      WHERE test_type = 'writing'
      GROUP BY target_letter
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
