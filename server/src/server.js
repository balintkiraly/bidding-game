import express from "express";
import { postBidHandler } from "./handlers.js";

const app = express();

function corsHeaders(_req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(corsHeaders);

app.post("/bid", postBidHandler);
app.get("/ping", (_req, res) => res.json({ message: "PONG" }) );

export default app;
