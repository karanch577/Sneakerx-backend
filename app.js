import express from "express";
const app = express();
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.js";
import collectionRoutes from "./routes/collection.js";
import couponRoutes from "./routes/coupon.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/order.js";
import googleOauthRoutes from "./routes/googleOauth.js";

import swaggerUi from 'swagger-ui-express';
import fs from "fs";
import YAML from 'yaml';
import errorMiddleware from "./middlewares/error.middleware.js";

const file  = fs.readFileSync('./swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)




// middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    credentials: true,
    origin: "*"
    // origin: "http://localhost:3000"
}))

app.use(cookieParser())
app.use(morgan("tiny"))


// routes
app.use("/api/user", userRoutes)
app.use("/api/category", collectionRoutes)
app.use("/api/coupon", couponRoutes)
app.use("/api/product", productRoutes)
app.use("/api/order", orderRoutes)
app.use("/api/google", googleOauthRoutes)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  })
})

// error handler middleware

app.use(errorMiddleware)



export default app;
