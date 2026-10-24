import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import authRouter from "./routes/auth.js";
import participantsRouter from "./routes/participants.js";
import teamsRouter from "./routes/teams.js";
import mentorsRouter from "./routes/mentors.js";
import profileRouter from "./routes/profile.js";

const app = express();

// Security headers
app.use(helmet());

// Allow all origins (for hackathon dev; tighten for production)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Auth routes
app.use("/auth", authRouter);

// Resource routes
app.use("/participants", participantsRouter);
app.use("/teams", teamsRouter);
app.use("/mentors", mentorsRouter);
app.use("/profile", profileRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = parseInt(process.env.PORT ?? "8080", 10);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export { app };
