import { Op } from "sequelize";
import { Job, User, Company } from "../models/association.js";
import sequelize from "../utils/database.js";

// FormData sends everything as strings, so empty dates arrive as ""
const toDate = (v) => (v === "" || v === "null" || v === undefined ? null : v);
// Same idea for times ("17:30"): empty means "no time set"
const toTime = (v) => (v === "" || v === "null" || v === undefined ? null : v);

export const createJob = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      company_id, job_title, job_url, company_name, location, salary,
      job_description, status, notes, deadline, deadline_time, date_applied, follow_up, follow_up_time,
    } = req.body;

    const job = await Job.create({
      user_id,
      company_id,
      job_title,
      job_url,
      company_name,
      location,
      salary,
      job_description,
      status,
      notes,
      resume: req.file ? req.file.filename : null,
      deadline: toDate(deadline),
      deadline_time: toTime(deadline_time),
      date_applied: toDate(date_applied),
      follow_up: toDate(follow_up),
      follow_up_time: toTime(follow_up_time),
    });

    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const getJobsByUser = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { filter, search, sortBy, order } = req.query;

    // Initialize whereClause with user_id
    const whereClause = { user_id };

    // Filtering by status
    if (filter && filter.toLowerCase() !== "all") {
      whereClause.status = { [Op.eq]: filter };
    }

    // Searching across multiple fields
    if (search) {
      whereClause[Op.or] = [
        { job_title: { [Op.like]: `%${search}%` } },
        { company_name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
        { status: { [Op.like]: `%${search}%` } },
        sequelize.where(sequelize.cast(sequelize.col("salary"), "CHAR"), {
          [Op.like]: `%${search}%`,
        }),
        sequelize.where(sequelize.fn("DATE_FORMAT", sequelize.col("deadline"), "%Y-%m-%d"), {
          [Op.like]: `%${search}%`,
        }),
        sequelize.where(sequelize.fn("DATE_FORMAT", sequelize.col("date_applied"), "%Y-%m-%d"), {
          [Op.like]: `%${search}%`,
        }),
        sequelize.where(sequelize.fn("DATE_FORMAT", sequelize.col("follow_up"), "%Y-%m-%d"), {
          [Op.like]: `%${search}%`,
        }),
      ];
    }

    const orderClause = [];
    orderClause.push([sortBy ? sortBy : "id", order === "desc" ? "DESC" : "ASC"]);

    // Fetch jobs from the database
    const jobs = await Job.findAll({
      where: whereClause,
      order: orderClause,
    });

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const job = await Job.findOne({
      where: { id, user_id },
      include: [User, Company],
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    res.json(job);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      id, company_id, job_title, job_url, company_name, location, salary,
      job_description, status, notes, deadline, deadline_time, date_applied, follow_up, follow_up_time,
    } = req.body;

    // Only the owner can update a job
    const job = await Job.findOne({ where: { id, user_id } });
    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    const updates = {
      job_title,
      job_url,
      company_name,
      location,
      salary,
      job_description,
      status,
      notes,
      deadline: toDate(deadline),
      deadline_time: toTime(deadline_time),
      date_applied: toDate(date_applied),
      follow_up: toDate(follow_up),
      follow_up_time: toTime(follow_up_time),
    };

    if (company_id) updates.company_id = company_id;
    // Only replace the resume when a new file was uploaded
    if (req.file) updates.resume = req.file.filename;

    await job.update(updates);

    res.json({ message: "Job updated successfully", job });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const job = await Job.findOne({ where: { id, user_id } });
    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    await job.destroy();
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};