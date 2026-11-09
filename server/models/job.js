import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  job_title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  job_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  salary: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  job_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM("Bookmarked", "Applied", "No Response", "Not Selected", "I Withdrew", "Interviewing", "Negotiating", "Accepted"),
    allowNull: false,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resume: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  date_applied: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  deadline_time: {
  type: DataTypes.TIME,
  allowNull: true
  },
  follow_up: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  follow_up_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  company_id: { 
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Companies",
      key: "id"
    },
    onDelete: "CASCADE"
  },
  user_id: { 
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id"
    },
    onDelete: "CASCADE"
  }
}, {
  timestamps: false,
  tableName: "Jobs"
});

export default Job;
