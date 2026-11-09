import express from 'express';
const router = express.Router();

import auth from "../middlewares/auth.js";
import { createJob, getJobsByUser, getJobById, updateJob, deleteJob } from "../controllers/jobs.js";
import { createCompany, getCompaniesByUser, getCompanyById, updateCompany, deleteCompany } from "../controllers/companies.js";
import { getTargetByUser, updateTarget } from "../controllers/targets.js";
import { getUser, createUser, verifyUser, deleteUser, updateUser } from "../controllers/users.js";
import { getPieChartData, getBarChartData } from '../controllers/statistics.js';
import { upload } from "../utils/upload.js";
import { getNotifications, markFollowUpDone } from "../controllers/notification.js";


router.get("/user", auth, getUser);
router.post("/user/create", createUser);
router.post("/user/verify", verifyUser);
router.put("/user", auth, updateUser);
router.delete("/user", auth, deleteUser);

router.post("/job", auth, upload.single("resume"), createJob);
router.get("/job", auth, getJobsByUser);
router.get("/job/:id", auth, getJobById);
router.put("/job/:id", auth, upload.single("resume"), updateJob);
router.delete("/job/:id", auth, deleteJob);

router.post("/company", auth, createCompany);
router.get("/company", auth, getCompaniesByUser);
router.get("/company/:id", auth, getCompanyById);
router.put("/company/:id", auth, updateCompany);
router.delete("/company/:id", auth, deleteCompany);

router.get("/target", auth, getTargetByUser);
router.put("/target", auth, updateTarget);

router.get("/chart/bar", auth, getBarChartData);
router.get("/chart/pie", auth, getPieChartData);

router.get("/notification", auth, getNotifications);
router.patch("/notification/:id/done", auth, markFollowUpDone);

export default router;