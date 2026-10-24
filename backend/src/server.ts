import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";

const app = express();

// Security headers
app.use(helmet());

// Allow all origins (for hackathon dev; tighten for production)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = parseInt(process.env.PORT ?? "8080", 10);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export { app };
