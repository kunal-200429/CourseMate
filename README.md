# CourseMate — Assignment Management System

CourseMate is a full-stack web application that helps students organize, manage, and track their academic assignments through a simple dashboard.

## Features

- Create, view, edit, and delete assignments.
- Set assignment priorities: Low, Medium, and High.
- Mark assignments as Pending or Completed.
- Search assignments by title, subject, and description.
- Filter assignments by status and priority.
- View dashboard statistics.
- Store assignment data persistently in MongoDB.
- Validate assignment data through the backend API.

## Tech Stack

- **Frontend:** React.js, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **API:** REST API

## Project Structure

```text
CourseMate/
├── client/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
├── server/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm
- MongoDB running locally or a MongoDB connection URI
- A web browser

## Getting Started

### 1. Configure the Backend

Open a terminal in the project root and run:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory and configure your MongoDB connection:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/coursemate
```

Use your own connection URI if your MongoDB setup is different.

Start the backend:

```bash
node server.js
```

The API should run at `http://localhost:5000` when the server starts successfully.

### 2. Configure the Frontend

Open a **second terminal** in the project root and run:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser. The development URL may vary.

### 3. Verify the Application

- Open the frontend in your browser.
- Add an assignment and verify that it appears in the dashboard.
- Edit and save an assignment.
- Change its status and test the filters and search.
- Delete a test assignment.
- Refresh the page and verify that saved data remains available.

## API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/assignments` | Retrieve assignments |
| POST | `/api/assignments` | Create an assignment |
| PUT | `/api/assignments/:id` | Update an assignment |
| DELETE | `/api/assignments/:id` | Delete an assignment |

### Assignment Fields

Assignments support the following fields:

- `title` — Assignment title
- `subject` — Subject name
- `description` — Assignment description
- `dueDate` — Assignment due date
- `priority` — Low, Medium, or High
- `status` — Pending or Completed

## Data Storage

CourseMate uses MongoDB to store assignment records. Mongoose defines the assignment schema and interacts with the database. Express routes handle API requests, while the React frontend communicates with the backend to perform assignment operations.

## Author

**Kunal Bediskar**

## Academic Project

Developed as a full-stack web development project to practice React, Node.js, Express.js, REST APIs, and MongoDB integration.
