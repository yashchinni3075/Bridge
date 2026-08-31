import express from "express";
import cors from "cors";
import config from "./config/index.js";
import routes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
