import "dotenv/config";
import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import sequelize from "./utils/database.js";
import routes from "./routes/routes.js";

const PORT = process.env.PORT || 5000;
const app = express();

const corsOptions = {
  origin: [
    'https://job-tracker-gilt.vercel.app'
  ],
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => res.status(200).send("OK"));

app.use("/uploads", express.static("uploads"));
app.use('/api', routes);

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error(err));