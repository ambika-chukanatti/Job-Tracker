# 💼 Job Tracker: Full-Stack Application Manager

A comprehensive full-stack MERN application designed to help users efficiently manage and track their job applications, interviews, and offers in one centralized location.

**Checkout Live -** [Insert Live Demo Link Here]

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **State Management:** Redux Toolkit / React Context API
- **Authentication:** JWT (JSON Web Tokens)
- **Styling:** CSS Framework (e.g., Tailwind CSS, Bootstrap, Styled Components)

## Features

- **User Authentication** - Secure user registration, login, and route protection using JWT.
- **Job Application Tracking (CRUD)** - Easily add new job listings, edit details, and remove old applications.
- **Dynamic Dashboard & Statistics** - Visual charts and statistics to track application progress (e.g., jobs pending, interviews scheduled, offers received).
- **Filtering and Sorting** - Ability to filter jobs by status, company, or date, and search functionality for quick access.
- **Status Updates** - Categorize and update job status (e.g., Pending, Interview, Rejected, Offer) for clear pipeline visualization.
- **Private Access** - All application data is stored securely and linked to the authenticated user.
- **Fully Responsive** - Seamless user experience across mobile, tablet, and desktop devices.

## Quick Start

Clone the repository

```bash
git clone [https://github.com/ambika-chukanatti/job-tracker.git](https://github.com/ambika-chukanatti/job-tracker.git)
cd job-tracker
```

## Install client dependencies
```bash
cd client
npm install
```

# Install server dependencies
```bash
cd ../server
npm install
```

## Environment Variables
You will need to add the following environment variables to your .env file in the server directory:
```bash
# MongoDB Connection
MONGO_URI=

# JWT Secret Key for Authentication
JWT_SECRET=

# Server Port (e.g., 5000)
PORT=
```

## Run the project 
```bash
# Run server (from the server directory or using a concurrent script)
npm run server

# Run client (from the client directory or using a concurrent script)
npm run client
```

## Deployment

- **Database:** Use MongoDB Atlas for a cloud-hosted database.
- **Backend (Node/Express):** Deploy to a Platform-as-a-Service like Render or Railway.
- **Frontend (React):** Deploy the static build files to Vercel or Netlify.


## License

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

