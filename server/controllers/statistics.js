import { Op, fn, col } from "sequelize";
import { Job } from "../models/association.js";

const PATTERNS = {
  year: /^\d{4}$/,
  month: /^\d{4}-(0[1-9]|1[0-2])$/,
};

// Returns { start, end, daysInMonth? } or null if picker/filter are invalid
const getRange = (picker, filter) => {
  if (!PATTERNS[picker]?.test(filter ?? "")) return null;

  if (picker === "year") {
    return { start: `${filter}-01-01`, end: `${filter}-12-31` };
  }

  // month
  const [y, m] = filter.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  return {
    start: `${filter}-01`,
    end: `${filter}-${String(daysInMonth).padStart(2, "0")}`,
    daysInMonth,
  };
};

export const getBarChartData = async (req, res) => {
  try {
    const { picker, filter } = req.query;
    const range = getRange(picker, filter);
    if (!range) return res.status(400).json({ error: "Invalid picker or filter value" });

    const isYear = picker === "year";
    const jobs = await Job.findAll({
      attributes: [
        [fn(isYear ? "MONTH" : "DAY", col("date_applied")), "bucket"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        user_id: req.user.id,
        date_applied: { [Op.between]: [range.start, range.end] },
      },
      group: ["bucket"],
      raw: true,
    });

    const data = new Array(isYear ? 12 : range.daysInMonth).fill(0);
    jobs.forEach(({ bucket, count }) => {
      data[bucket - 1] = Number(count);
    });

    return res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch bar chart data" });
  }
};

export const getPieChartData = async (req, res) => {
  try {
    const { picker, filter } = req.query;
    const range = getRange(picker, filter);
    if (!range) return res.status(400).json({ error: "Invalid picker or filter value" });

    const jobs = await Job.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      where: {
        user_id: req.user.id,
        date_applied: { [Op.between]: [range.start, range.end] },
      },
      group: ["status"],
      raw: true,
    });

    const categories = ["Bookmarked", "Applied", "No Response", "Not Selected", "I Withdrew", "Interviewing", "Negotiating", "Accepted"];
    const data = new Array(categories.length).fill(0);
    jobs.forEach(({ status, count }) => {
      const index = categories.indexOf(status);
      if (index !== -1) data[index] = Number(count);
    });

    return res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch pie chart data" });
  }
};