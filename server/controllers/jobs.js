import { Op } from "sequelize";
import { Job, User, Company } from "../models/association.js";
import sequelize from "../utils/database.js";
import cron from "node-cron";
import nodemailer from "nodemailer";

// FormData sends everything as strings, so empty dates arrive as ""
const toDate = (v) => (v === "" || v === "null" || v === undefined ? null : v);

const getEmailTemplate = (type, jobTitle, companyName, date) => {
  const templates = {
    deadlineReminder: `Subject: Upcoming Deadline for ${jobTitle} at ${companyName}  

Dear Candidate,  

This is a friendly reminder that the application deadline for the **${jobTitle}** position at **${companyName}** is tomorrow (${date}). 
Please ensure that your application is complete and submitted on time.  

Best regards,  
Job Application Tracker`,

    deadlineToday: `Subject: Final Reminder – Application Deadline Today for ${jobTitle} at ${companyName}  

Dear Candidate,  

The application deadline for the **${jobTitle}** position at **${companyName}** is today (${date}). 
If you have not yet completed your submission, please do so as soon as possible to ensure consideration for this opportunity.  

Best regards,  
Job Application Tracker`,

    followUpReminder: `Subject: Follow-Up Reminder – ${jobTitle} Application at ${companyName}  

Dear Candidate,  

We recommend following up on your job application for the **${jobTitle}** position at **${companyName}**. 
A well-timed follow-up can demonstrate your enthusiasm and interest in the role. If you have already reached out, kindly disregard this message.  

Best regards,  
Job Application Tracker`,
  };

  return templates[type] || "No template found.";
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const scheduleEmail = (email, type, jobTitle, companyName, date) => {
  try {
    if (!date) return;

    const formattedDate = new Date(date);
    const emailText = getEmailTemplate(type, jobTitle, companyName, formattedDate.toDateString());

    const cronExpression = `0 9 ${formattedDate.getDate()} ${formattedDate.getMonth() + 1} *`;
    console.log(`Cron Expression: ${cronExpression}`);

    cron.schedule(cronExpression, () => {
      transporter.sendMail(
        {
          from: process.env.EMAIL,
          to: email,
          subject: "Job Application Reminder",
          text: emailText,
          html: emailText.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"),
        },
        (err, info) => {
          if (err) console.error("Email error:", err);
          else console.log("Email sent:", info.response);
        }
      );
    });
  } catch (err) {
    console.log(err);
  }
};

const scheduleJobEmails = (email, jobTitle, companyName, deadline, followUp) => {
  if (deadline) {
    const dayBeforeDeadline = new Date(deadline);
    dayBeforeDeadline.setDate(dayBeforeDeadline.getDate() - 1);

    scheduleEmail(email, "deadlineReminder", jobTitle, companyName, dayBeforeDeadline);
    scheduleEmail(email, "deadlineToday", jobTitle, companyName, deadline);
  }

  if (followUp) {
    scheduleEmail(email, "followUpReminder", jobTitle, companyName, followUp);
  }
};

export const createJob = async (req, res) => {
  try {
    const user_id = req.user.id;

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      company_id, job_title, job_url, company_name, location, salary,
      job_description, status, notes, deadline, date_applied, follow_up,
    } = req.body;

    const deadlineDate = toDate(deadline);
    const appliedDate = toDate(date_applied);
    const followUpDate = toDate(follow_up);

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
      deadline: deadlineDate,
      date_applied: appliedDate,
      follow_up: followUpDate,
    });

    scheduleJobEmails(user.email, job_title, company_name, deadlineDate, followUpDate);

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

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      id, company_id, job_title, job_url, company_name, location, salary,
      job_description, status, notes, deadline, date_applied, follow_up,
    } = req.body;

    // Only the owner can update a job
    const job = await Job.findOne({ where: { id, user_id } });
    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    const deadlineDate = toDate(deadline);
    const appliedDate = toDate(date_applied);
    const followUpDate = toDate(follow_up);

    const updates = {
      job_title,
      job_url,
      company_name,
      location,
      salary,
      job_description,
      status,
      notes,
      deadline: deadlineDate,
      date_applied: appliedDate,
      follow_up: followUpDate,
    };

    if (company_id) updates.company_id = company_id;
    // Only replace the resume when a new file was uploaded
    if (req.file) updates.resume = req.file.filename;

    await job.update(updates);

    scheduleJobEmails(user.email, job_title, company_name, deadlineDate, followUpDate);

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