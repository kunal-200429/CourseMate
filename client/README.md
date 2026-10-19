# CourseMate 🎓

A full-stack assignment management application built to help students organize and track their academic work.

## Features

- Add assignments with title, subject, description, and due date.
- Set priorities: Low, Medium, and High.
- Edit and delete assignments.
- Mark assignments as completed or pending.
- Search assignments by title, subject, or description.
- Filter assignments by status and priority.
- Dashboard statistics for assignment tracking.
- Store assignment data in MongoDB.

## Tech Stack

- **Frontend:** React.js, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose

## Project Structure

```text
CourseMate/
├── client/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
├── server/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env
└── README.md
```

## Getting Started

### Prerequisites

Install Node.js, npm, and MongoDB.

### 1. Start the Backend

Open a terminal:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/coursemate
```

Start the server:

```bash
node server.js
```

### 2. Start the Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL shown by Vite, usually http://localhost:5174.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/assignments` | Get assignments |
| POST | `/api/assignments` | Create an assignment |
| PUT | `/api/assignments/:id` | Update an assignment |
| DELETE | `/api/assignments/:id` | Delete an assignment |

## Author

**Kunal Bediskar**

Built as a full-stack web development project to practice React, Express, Node.js, and MongoDB.
