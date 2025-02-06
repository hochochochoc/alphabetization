import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import "dotenv/config";

// const pool = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "IneedAjob123",
//   database: "alphabetization",
// });

const pool = mysql.createPool(process.env.MYSQL_URL);

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/session", async (req, res) => {
  try {
    const {
      target_letter,

      options,
      user_answer,
      correct,
    } = req.body;

    const [result] = await pool.query(
      "INSERT INTO guess_history (target_letter,  options, user_answer, correct) VALUES (?, ?, ?, ?)",
      [target_letter, options.join(","), user_answer, correct],
    );

    res.json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/listening_progress", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        target_letter,
        COUNT(*) as total_attempts,
        GREATEST(0, SUM(CASE WHEN correct = 1 THEN 10 ELSE -10 END)) as progress_percentage
      FROM guess_history
      GROUP BY target_letter
      ORDER BY target_letter
    `);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
