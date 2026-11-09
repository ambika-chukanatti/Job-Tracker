import { Op } from "sequelize";
import { Job, User, Notification } from "../models/association.js";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

// "today" is calculated in this timezone (IANA name, e.g. "Europe/London").
// Set APP_TIMEZONE on Render, otherwise UTC is used.
const APP_TIMEZONE = process.env.APP_TIMEZONE || "UTC";

// Notify when a deadline is today, tomorrow, or the day after
const DEADLINE_NOTICE_DAYS = 2;

// Only notify about follow-ups that became due in the last 14 days,
// so old data doesn't flood the page the first time this runs
const FOLLOW_UP_LOOKBACK_DAYS = 14;

// No reminders for jobs that are finished
const CLOSED_STATUSES = ["Not Selected", "I Withdrew", "Accepted"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Date helpers (all dates are "YYYY-MM-DD" strings)
// ---------------------------------------------------------------------------

const todayString = () => new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });

const asDateString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
};

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const daysBetween = (fromStr, toStr) =>
  Math.round((new Date(`${toStr}T00:00:00Z`) - new Date(`${fromStr}T00:00:00Z`)) / 86400000);

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ---------------------------------------------------------------------------
// Text builders
// ---------------------------------------------------------------------------

const buildMessage = (notification, job, today) => {
  const days = daysBetween(today, notification.due_date);
  const role = `${job.job_title} at ${job.company_name}`;

  if (notification.type === "deadline") {
    if (days === 0) return `The application deadline for ${role} is today.`;
    if (days === 1) return `The application deadline for ${role} is tomorrow.`;
    if (days > 1) return `The application deadline for ${role} is in ${plural(days, "day")}.`;
    return `The application deadline for ${role} passed ${plural(Math.abs(days), "day")} ago.`;
  }

  if (days >= 0) return `Time to follow up on your application for ${role}.`;
  return `Your follow-up for ${role} was due ${plural(Math.abs(days), "day")} ago.`;
};

const buildDefaultEmail = (job, username) => ({
  subject: `Following up on my application for ${job.job_title}`,
  message: `Hi,

I hope you're doing well. I'm writing to follow up on my application for the ${job.job_title} position at ${job.company_name}. I remain very interested in the opportunity and would love to hear about any updates on the hiring process.

Thank you for your time and consideration.

Best regards,
${username || ""}`.trim(),
});

// ---------------------------------------------------------------------------
// Creating / cleaning up notifications
// ---------------------------------------------------------------------------

// Is this notification still true for the job as it is right now?
const isStillRelevant = (notification, job) => {
  if (!job) return false;
  if (CLOSED_STATUSES.includes(job.status)) return false;

  if (notification.type === "deadline") {
    // Once you've applied, the deadline no longer matters
    return asDateString(job.deadline) === notification.due_date && !job.date_applied;
  }
  return asDateString(job.follow_up) === notification.due_date;
};

// Runs every time the notifications page is opened, so it doesn't depend on
// a scheduler (which would not run reliably while the server is asleep).
const syncNotifications = async (user_id) => {
  const today = todayString();
  const deadlineLimit = addDays(today, DEADLINE_NOTICE_DAYS);
  const followUpStart = addDays(today, -FOLLOW_UP_LOOKBACK_DAYS);

  const jobs = await Job.findAll({
    where: {
      user_id,
      [Op.or]: [{ deadline: { [Op.ne]: null } }, { follow_up: { [Op.ne]: null } }],
    },
    attributes: ["id", "status", "deadline", "date_applied", "follow_up"],
  });

  // 1. Create new notifications
  const toCreate = [];
  for (const job of jobs) {
    if (CLOSED_STATUSES.includes(job.status)) continue;

    const deadline = asDateString(job.deadline);
    if (deadline && !job.date_applied && deadline >= today && deadline <= deadlineLimit) {
      toCreate.push({ user_id, job_id: job.id, type: "deadline", due_date: deadline });
    }

    const followUp = asDateString(job.follow_up);
    if (followUp && followUp <= today && followUp >= followUpStart) {
      toCreate.push({ user_id, job_id: job.id, type: "follow_up", due_date: followUp });
    }
  }

  if (toCreate.length) {
    // ignoreDuplicates skips ones that already exist (including dismissed ones)
    await Notification.bulkCreate(toCreate, { ignoreDuplicates: true });
  }

  // 2. Remove notifications that are no longer true
  //    (job deleted, date changed, already applied, job closed...)
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const existing = await Notification.findAll({ where: { user_id } });
  const staleIds = existing
    .filter((n) => !isStillRelevant(n, jobsById.get(n.job_id)))
    .map((n) => n.id);

  if (staleIds.length) {
    await Notification.destroy({ where: { id: staleIds } });
  }
};

// ---------------------------------------------------------------------------
// Sending email
// ---------------------------------------------------------------------------

// Render's free plan blocks SMTP ports, so this uses Brevo's HTTPS API instead of
// nodemailer. Only this function knows about the provider, so it's easy to swap.
const sendEmail = async ({ to, subject, text, replyTo, fromName }) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: process.env.MAIL_SENDER_EMAIL },
      replyTo,
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email provider error ${response.status}: ${detail}`);
  }
};

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;

    await syncNotifications(user_id);

    const [user, rows] = await Promise.all([
      User.findByPk(user_id, { attributes: ["username"] }),
      Notification.findAll({
        where: { user_id, dismissed: false },
        include: [{ model: Job, as: "job", attributes: ["id", "job_title", "company_name"] }],
        order: [
          ["is_read", "ASC"], // unread first
          ["due_date", "DESC"],
          ["id", "DESC"],
        ],
      }),
    ]);

    const today = todayString();
    const notifications = rows
      .filter((n) => n.job)
      .map((n) => ({
        id: n.id,
        type: n.type,
        job_id: n.job_id,
        job_title: n.job.job_title,
        company_name: n.job.company_name,
        due_date: n.due_date,
        message: buildMessage(n, n.job, today),
        is_read: n.is_read,
        email_sent_at: n.email_sent_at,
        defaultEmail: n.type === "follow_up" ? buildDefaultEmail(n.job, user?.username) : null,
      }));

    res.json({
      notifications,
      unread: notifications.filter((n) => !n.is_read).length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load notifications." });
  }
};

export const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!notification) return res.status(404).json({ error: "Notification not found." });

    await notification.update({ is_read: true });
    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update the notification." });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update notifications." });
  }
};

export const dismissNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!notification) return res.status(404).json({ error: "Notification not found." });

    await notification.update({ dismissed: true, is_read: true });
    res.json({ message: "Notification dismissed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to dismiss the notification." });
  }
};

export const sendFollowUpEmail = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { to, subject, message } = req.body;

    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id },
    });
    if (!notification) return res.status(404).json({ error: "Notification not found." });
    if (notification.type !== "follow_up") {
      return res.status(400).json({ error: "This notification doesn't have an email to send." });
    }
    // One email per notification, so this can't be used to spam someone
    if (notification.email_sent_at) {
      return res.status(409).json({ error: "A follow-up email was already sent for this." });
    }

    const recipient = String(to || "").trim();
    const cleanSubject = String(subject || "").replace(/[\r\n]+/g, " ").trim();
    const body = String(message || "").trim();

    if (!EMAIL_REGEX.test(recipient)) {
      return res.status(400).json({ error: "Enter a valid recruiter email address." });
    }
    if (!cleanSubject || cleanSubject.length > 200) {
      return res.status(400).json({ error: "Subject is required (200 characters max)." });
    }
    if (!body || body.length > 5000) {
      return res.status(400).json({ error: "Message is required (5000 characters max)." });
    }

    if (!process.env.BREVO_API_KEY || !process.env.MAIL_SENDER_EMAIL) {
      console.error("BREVO_API_KEY or MAIL_SENDER_EMAIL is not set");
      return res.status(500).json({ error: "Email sending isn't set up on the server yet." });
    }

    const user = await User.findByPk(user_id, { attributes: ["username", "email"] });
    const displayName = String(user.username || "Job Tracker").replace(/["<>\r\n]/g, "");

    try {
      await sendEmail({
        to: recipient,
        subject: cleanSubject,
        text: body,
        // Replies from the recruiter go straight to the user
        replyTo: { email: user.email, name: displayName },
        fromName: `${displayName} (via Job Tracker)`,
      });
    } catch (err) {
      console.error(err);
      return res.status(502).json({ error: "Couldn't send the email. Try again in a bit." });
    }

    await notification.update({ email_sent_at: new Date(), is_read: true });

    res.json({
      message: "Follow-up email sent",
      email_sent_at: notification.email_sent_at,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send the follow-up email." });
  }
};