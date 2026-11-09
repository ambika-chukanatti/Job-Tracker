import cron from "node-cron";
import { Op } from "sequelize";
import { Job, User } from "../models/association.js";

const APP_TIMEZONE = process.env.APP_TIMEZONE || "UTC";

const DEFAULT_TIMES = { follow_up: "09:00", deadline: "23:59" };

const FINISHED_STATUSES = ["Not Selected", "I Withdrew", "Accepted"];

const STAGES = [
  { key: "30_min", minutes: 30, when: "30 minutes", subject: "due in 30 minutes" },
  { key: "6_hours", minutes: 6 * 60, when: "about 6 hours", subject: "due in about 6 hours" },
  { key: "1_day", minutes: 24 * 60, when: "about 1 day", subject: "due in about 1 day" },
];

const EMAIL_INTERVAL_MINUTES = 1;

const KINDS = {
  follow_up: { dateField: "follow_up", timeField: "follow_up_time" },
  deadline: { dateField: "deadline", timeField: "deadline_time" },
};

const nowInAppTz = () => {
  const s = new Date().toLocaleString("sv-SE", { timeZone: APP_TIMEZONE });
  return new Date(`${s.replace(" ", "T")}Z`);
};

const asTimeString = (v) => (v ? String(v).slice(0, 5) : null);

const asDateString = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  return new Date(v).toISOString().slice(0, 10);
};

const getStage = (minutesLeft) => {
  if (minutesLeft <= 0) return null;
  return STAGES.find((s) => minutesLeft <= s.minutes) || null;
};

const getEmailStage = (minutesLeft) =>
  STAGES.find((s) => minutesLeft > s.minutes - EMAIL_INTERVAL_MINUTES && minutesLeft <= s.minutes) || null;

const buildMessage = (type, role, stage) =>
  type === "follow_up"
    ? `Your follow-up for ${role} is due in ${stage.when}.`
    : `The deadline for ${role} is in ${stage.when}.`;

const loadReminders = async (userId = null) => {
  const now = nowInAppTz();
  const dayMs = 24 * 60 * 60 * 1000;
  const yesterday = new Date(now.getTime() - dayMs).toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + dayMs).toISOString().slice(0, 10);

  const where = {
    status: { [Op.notIn]: FINISHED_STATUSES },
    [Op.or]: [
      { follow_up: { [Op.between]: [yesterday, tomorrow] } },
      { deadline: { [Op.between]: [yesterday, tomorrow] } },
    ],
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
      if (!stage) continue;

      reminders.push({
        job,
        type,
        date,
        time,
        minutesLeft,
        stage,
        message: buildMessage(type, `${job.job_title} at ${job.company_name}`, stage),
      });
    }
  }

  return reminders.sort((a, b) => a.minutesLeft - b.minutesLeft);
};

export const getNotifications = async (req, res) => {
  try {
    const reminders = await loadReminders(req.user.id);

    const notifications = reminders.map((r) => ({
      job_id: r.job.id,
      job_title: r.job.job_title,
      company_name: r.job.company_name,
      status: r.job.status,
      type: r.type,
      date: r.date,
      time: r.time,
      reminder_stage: r.stage.key,
      minutes_left: r.minutesLeft,
      message: r.message,
    }));

    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load notifications." });
  }
};

const sendEmail = async ({ to, subject, text }) => {
  if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("BREVO_API_KEY and EMAIL_FROM must be set.");
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME || "Job Tracker" },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });

  if (!res.ok) throw new Error(`Email failed (${res.status}): ${await res.text()}`);
  console.log(`Reminder email sent to ${to}: ${subject}`);
};

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
        console.error(err.message);
      }
    }
  } catch (error) {
    console.error("Email reminder check failed:", error);
  }
};

export const startReminderEmails = () => {
  cron.schedule(`*/${EMAIL_INTERVAL_MINUTES} * * * *`, runEmailCheck);
  console.log("Reminder emails scheduled.");
};