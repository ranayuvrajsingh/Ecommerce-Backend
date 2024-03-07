import express from "express";
import { connectDb } from "./utils/features.js";
import NodeCache from "node-cache";
import { errorMiddleware } from "./middlewares/error.js";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";
// {Importing routes}

import userRoute from "./routes/user.js";
import productRoute from "./routes/product.js";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";

config({
  path: "./.env",
});

console.log(process.env.PORT);

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGO_URI || " ";
const stripeKey = process.env.STRIPE_KEY || " ";

connectDb(mongoUri);

export const stripe = new Stripe(stripeKey);

export const myCache = new NodeCache();
const app = express();
app.use(express.json()); //Middleware
app.use(morgan("dev"));
app.use(cors());
// app.use(
//   cors({
//     origin: "http://localhost:5173/",
//   })
// );
app.get("/", (req, res) => {
  res.send("Api Working with api/v1");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);
app.listen(port, () => console.log("Server Express is running on port 4000"));
