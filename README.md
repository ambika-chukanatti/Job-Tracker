# 💼 Job Tracker: Full-Stack Job Application Manager

A full-stack web application that helps users track their job applications, interviews, and offers in one place, with email reminders for deadlines and follow-ups.

**Checkout Live -** [job-tracker-gilt.vercel.app](https://job-tracker-gilt.vercel.app/)

## Tech Stack

- **Frontend:** React (Vite), React Router, Tailwind CSS, Chart.js
- **Backend:** Node.js, Express.js
- **Database:** MySQL (via Sequelize ORM), hosted on Railway
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **Email Reminders:** Nodemailer, node-cron
- **Deployment:** Vercel (frontend), Render (backend), Railway (database)

## Features

- **User Authentication** - Secure user registration, login, and route protection using JWT.
- **Job Application Tracking (CRUD)** - Add new job listings, edit details, and remove old applications.
- **Company Management** - Keep track of the companies you are applying to.
- **Dashboard & Statistics** - Bar and pie charts to track application progress (e.g., pending, interviews, offers, rejections).
- **Application Targets** - Set and track your application goals.
- **Email Reminders** - Automatic emails for upcoming deadlines and follow-ups.
- **Filtering and Sorting** - Filter jobs by status, company, or date.
- **Status Updates** - Categorize and update job status for clear pipeline visualization.
- **Private Access** - All data is linked to the authenticated user.
- **Fully Responsive** - Works across mobile, tablet, and desktop.

## Quick Start

Clone the repository

```bash
git clone https://github.com/ambika-chukanatti/Job-Tracker.git
cd Job-Tracker
```

### Install client dependencies
```bash
cd client
npm install
```

### Install server dependencies
```bash
cd ../server
npm install
```

## Environment Variables

Create a `.env` file in the `server` directory:

```bash
# MySQL database connection
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

# Secret used to sign JWT tokens
SECRET_KEY=

# Server port (e.g., 5000)
PORT=

# Email account used to send reminder emails
EMAIL=
PASSWORD=
```

> The client calls the backend using the `api_url` constant at the top of each file in `client/src/pages/`. Change it to your own backend URL (or `http://localhost:5000/api` for local development).

## Run the project

```bash
# Run server (from the server directory)
npm start

# Run client (from the client directory)
npm run dev
```

## Deployment

- **Database:** MySQL on [Railway](https://railway.app). Use the public connection host and port when the backend is hosted elsewhere.
- **Backend (Node/Express):** Deployed on [Render](https://render.com). Add the environment variables above in the service settings.
- **Frontend (React):** Deployed on [Vercel](https://vercel.com).

## License

[![Apache-2.0 License](https://img.shields.io/badge/License-Apache--2.0-orange.svg)](https://www.apache.org/licenses/LICENSE-2.0)
