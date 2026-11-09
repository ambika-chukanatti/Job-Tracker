import { Op } from "sequelize";
import { Job } from "../models/association.js";

// "Today" is worked out in this timezone (IANA name, e.g. "Europe/London").
// Set APP_TIMEZONE on Render, otherwise UTC is used.
const APP_TIMEZONE = process.env.APP_TIMEZONE || "UTC";

// No follow-up reminders for jobs that are finished
const FINISHED_STATUSES = ["Not Selected", "I Withdrew", "Accepted"];

const todayString = () => new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });

const asDateString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
};

const daysBetween = (fromStr, toStr) =>
  Math.round((new Date(`${toStr}T00:00:00Z`) - new Date(`${fromStr}T00:00:00Z`)) / 86400000);

// A notification is just a job whose follow-up date has arrived.
// Nothing is stored: it's worked out from the jobs every time, and it goes away
// when the follow-up date is cleared or changed to a later day.
export const getNotifications = async (req, res) => {
  try {
    const today = todayString();

    const jobs = await Job.findAll({
      where: {
        user_id: req.user.id,
        follow_up: { [Op.lte]: today }, // dates in the past or today (empty dates never match)
        status: { [Op.notIn]: FINISHED_STATUSES },
      },
      attributes: ["id", "job_title", "company_name", "status", "follow_up"],
      order: [["follow_up", "ASC"]],
    });

    const notifications = jobs.map((job) => {
      const followUp = asDateString(job.follow_up);
      const daysAgo = daysBetween(followUp, today);
      const role = `${job.job_title} at ${job.company_name}`;

      let message = `Time to follow up with the recruiter for ${role}.`;
      if (daysAgo === 1) message = `Your follow-up for ${role} was due yesterday.`;
      if (daysAgo > 1) message = `Your follow-up for ${role} was due ${daysAgo} days ago.`;

      return {
        job_id: job.id,
        job_title: job.job_title,
        company_name: job.company_name,
        status: job.status,
        follow_up: followUp,
        days_overdue: daysAgo,
        message,
      };
    });

    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load notifications." });
  }
};

// "Done": clears the job's follow-up date, which removes the notification
export const markFollowUpDone = async (req, res) => {
  try {
    const job = await Job.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!job) return res.status(404).json({ error: "Job not found." });

    await job.update({ follow_up: null });
    res.json({ message: "Follow-up marked as done" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update the follow-up." });
  }
};