import cron from "node-cron";
import { Op } from "sequelize";
import { Job, User } from "../models/association.js";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

// "Now" and all deadlines are read in this timezone (IANA name, e.g. "Asia/Kolkata").
const APP_TIMEZONE = process.env.APP_TIMEZONE || "UTC";

// Used when a date has no time set
const DEFAULT_TIMES = { follow_up: "09:00", deadline: "23:59" };

// No reminders for jobs that are finished
const FINISHED_STATUSES = ["Not Selected", "I Withdrew", "Accepted"];

// Reminder stages, smallest first
const STAGES = [
  { key: "30_min", minutes: 30, when: "30 minutes", subject: "due in 30 minutes" },
  { key: "6_hours", minutes: 6 * 60, when: "about 6 hours", subject: "due in about 6 hours" },
  { key: "1_day", minutes: 24 * 60, when: "about 1 day", subject: "due in about 1 day" },
];

// How often the email check runs. Must match the cron expression at the bottom.
const EMAIL_INTERVAL_MINUTES = 5;

// The two things a job can be reminded about
const KINDS = {
  follow_up: { dateField: "follow_up", timeField: "follow_up_time" },
  deadline: { dateField: "deadline", timeField: "deadline_time" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Current wall-clock time in APP_TIMEZONE, as a Date whose UTC fields hold that time
const nowInAppTz = () => {
  const s = new Date().toLocaleString("sv-SE", { timeZone: APP_TIMEZONE }); // "YYYY-MM-DD HH:MM:SS"
  return new Date(`${s.replace(" ", "T")}Z`);
};

const asTimeString = (v) => (v ? String(v).slice(0, 5) : null);

const asDateString = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  return new Date(v).toISOString().slice(0, 10);
};

// Which stage a reminder is in right now: "due", one of STAGES, or null (too far away)
const getStage = (minutesLeft) => {
  if (minutesLeft <= 0) return { key: "due" };
  return STAGES.find((s) => minutesLeft <= s.minutes) || null;
};

// Stage whose exact moment falls inside the last email interval (used for emails only).
// e.g. with a 5 min interval, the "30_min" email goes out when 26-30 minutes are left.
const getEmailStage = (minutesLeft) =>
  STAGES.find((s) => minutesLeft > s.minutes - EMAIL_INTERVAL_MINUTES && minutesLeft <= s.minutes) || null;

const buildMessage = (type, role, stage, minutesLeft) => {
  const isFollowUp = type === "follow_up";

  if (stage.key === "due") {
    const overdue = -minutesLeft;
    if (overdue < 60) {
      return isFollowUp
        ? `Time to follow up with the recruiter for ${role}.`
        : `The deadline for ${role} has arrived.`;
    }
    if (overdue < 24 * 60) {
      const h = Math.floor(overdue / 60);
      const hours = `${h} hour${h === 1 ? "" : "s"} ago`;
      return isFollowUp
        ? `Your follow-up for ${role} was due ${hours}.`
        : `The deadline for ${role} passed ${hours}.`;
    }
    const d = Math.floor(overdue / (24 * 60));
    const days = d === 1 ? "yesterday" : `${d} days ago`;
    return isFollowUp
      ? `Your follow-up for ${role} was due ${days}.`
      : `The deadline for ${role} was ${days}.`;
  }

  return isFollowUp
    ? `Your follow-up for ${role} is due in ${stage.when}.`
    : `The deadline for ${role} is in ${stage.when}.`;
};

// Every follow-up / deadline that is currently inside a reminder stage.
// Nothing is stored: it is worked out from the jobs on every call.
const loadReminders = async (userId = null) => {
  const now = nowInAppTz();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const where = {
    status: { [Op.notIn]: FINISHED_STATUSES },
    // dates up to tomorrow (empty dates never match)
    [Op.or]: [{ follow_up: { [Op.lte]: tomorrow } }, { deadline: { [Op.lte]: tomorrow } }],
  };
  if (userId) where.user_id = userId;

  const jobs = await Job.findAll({
    where,
    attributes: [
      "id", "user_id", "job_title", "company_name", "status",
      "follow_up", "follow_up_time", "deadline", "deadline_time",
    ],
  });

  const reminders = [];

  for (const job of jobs) {
    for (const [type, kind] of Object.entries(KINDS)) {
      const date = asDateString(job[kind.dateField]);
      if (!date) continue;

      const time = asTimeString(job[kind.timeField]) || DEFAULT_TIMES[type];
      const minutesLeft = Math.ceil((new Date(`${date}T${time}:00Z`) - now) / 60000);
      const stage = getStage(minutesLeft);
      if (!stage) continue; // more than 1 day away

      reminders.push({
        job,
        type,
        date,
        time,
        minutesLeft,
        stage,
        message: buildMessage(type, `${job.job_title} at ${job.company_name}`, stage, minutesLeft),
      });
    }
  }

  return reminders.sort((a, b) => a.minutesLeft - b.minutesLeft); // most urgent first
};

// ---------------------------------------------------------------------------
// In-app notifications (API)
// ---------------------------------------------------------------------------

export const getNotifications = async (req, res) => {
  try {
    const reminders = await loadReminders(req.user.id);

    const notifications = reminders.map((r) => ({
      job_id: r.job.id,
      job_title: r.job.job_title,
      company_name: r.job.company_name,
      status: r.job.status,
      type: r.type, // "follow_up" | "deadline"
      date: r.date,
      time: r.time,
      reminder_stage: r.stage.key, // "1_day" | "6_hours" | "30_min" | "due"
      minutes_left: r.minutesLeft, // negative when overdue
      is_overdue: r.minutesLeft <= 0,
      message: r.message,
    }));

    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load notifications." });
  }
};

// "Done": clears the date (and time), which removes the notification
const clearReminder = (fields, doneMessage) => async (req, res) => {
  try {
    const job = await Job.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!job) return res.status(404).json({ error: "Job not found." });

    await job.update(fields);
    res.json({ message: doneMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update the reminder." });
  }
};

export const markFollowUpDone = clearReminder(
  { follow_up: null, follow_up_time: null },
  "Follow-up marked as done"
);

export const markDeadlineDone = clearReminder(
  { deadline: null, deadline_time: null },
  "Deadline cleared"
);

// ---------------------------------------------------------------------------
// Email reminders
// ---------------------------------------------------------------------------

// Sends through Resend's HTTP API (works on Render's free tier, where SMTP ports are blocked).
// Env vars: RESEND_API_KEY, EMAIL_FROM (e.g. "Job Tracker <reminders@yourdomain.com>")
const sendEmail = async ({ to, subject, text }) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${await res.text()}`);
};

// Runs every EMAIL_INTERVAL_MINUTES. Stateless: a reminder is emailed only when its
// "1 day / 6 hours / 30 min before" moment falls inside the last interval, so
// nothing needs to be remembered between runs.
export const runEmailCheck = async () => {
  try {
    const reminders = (await loadReminders())
      .map((r) => ({ ...r, emailStage: getEmailStage(r.minutesLeft) }))
      .filter((r) => r.emailStage);
    if (!reminders.length) return;

    const userIds = [...new Set(reminders.map((r) => r.job.user_id))];
    const users = await User.findAll({ where: { id: userIds }, attributes: ["id", "email"] });
    const emailById = new Map(users.map((u) => [u.id, u.email]));

    for (const r of reminders) {
      const to = emailById.get(r.job.user_id);
      if (!to) continue;

      const noun = r.type === "follow_up" ? "Follow-up" : "Deadline";
      try {
        await sendEmail({
          to,
          subject: `${noun} ${r.emailStage.subject}: ${r.job.job_title} at ${r.job.company_name}`,
          text: `${r.message}\n\nStatus: ${r.job.status}\n${noun}: ${r.date} ${r.time}`,
        });
      } catch (err) {
        console.error(err.message); // one failed email shouldn't stop the others
      }
    }
  } catch (error) {
    console.error("Email reminder check failed:", error);
  }
};

// Call once when the server starts
export const startReminderEmails = () => {
  cron.schedule(`*/${EMAIL_INTERVAL_MINUTES} * * * *`, runEmailCheck);
  console.log("Reminder emails scheduled.");
};