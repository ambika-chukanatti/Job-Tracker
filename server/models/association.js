import Job from "./job.js";
import Company from "./company.js";
import User from "./user.js";
import Target from "./target.js";
import Notification from "./notification.js";

// One User can have many Jobs
User.hasMany(Job, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Job.belongsTo(User, { foreignKey: 'user_id' });  // Each Job belongs to one User

// One User can have many Companies
User.hasMany(Company, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Company.belongsTo(User, { foreignKey: 'user_id' });  // Each Company belongs to one User

// One Job has One Company
Company.hasMany(Job, { foreignKey: 'company_id', onDelete: 'CASCADE' });
Job.belongsTo(Company, { foreignKey: 'company_id' });  // Each Job belongs to one Company

User.hasMany(Company, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Company.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Target, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Target.belongsTo(User, { foreignKey: 'user_id' });

Job.hasMany(Notification, { foreignKey: "job_id", onDelete: "CASCADE" });
Notification.belongsTo(Job, { foreignKey: "job_id", as: "job" });

User.hasMany(Notification, { foreignKey: "user_id", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "user_id" });

export { User, Company, Job, Target, Notification };


