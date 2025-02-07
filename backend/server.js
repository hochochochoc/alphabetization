import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "IneedAjob123",
  database: "alphabetization",
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/listening_progress", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      WITH LastTenAttempts AS (
        SELECT 
          target_letter,
          correct,
          ROW_NUMBER() OVER (PARTITION BY target_letter ORDER BY id DESC) as attempt_rank
        FROM guess_history
        HAVING attempt_rank <= 10
      )
      SELECT 
        target_letter,
        COUNT(*) as total_attempts,
        CASE 
          WHEN COUNT(*) < 4 THEN 0
          ELSE GREATEST(0, ((SUM(correct) / COUNT(*) - 0.25) / 0.75) * 100)
        END as progress_percentage
      FROM LastTenAttempts
      GROUP BY target_letter
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
