# CourseMate

A full-stack assignment management application built to help students organize and track academic assignments.

## Features

- Add, edit, and delete assignments.
- Set assignment priorities: Low, Medium, and High.
- Mark assignments as completed or pending.
- Search assignments by title, subject, and description.
- Filter assignments by status and priority.
- Track assignments through dashboard statistics.
- Store assignment data in MongoDB.

## Tech Stack

- Frontend: React.js, Vite, CSS
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose

## Getting Started

### Backend

1. Open a terminal in the server folder.
2. Run `npm install`.
3. Configure `MONGODB_URI` in your `.env` file.
4. Run `node server.js`.

### Frontend

1. Open a second terminal in the client folder.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL shown by Vite.

## API Endpoints

- GET `/api/assignments` - Retrieve assignments
- POST `/api/assignments` - Create an assignment
- PUT `/api/assignments/:id` - Update an assignment
- DELETE `/api/assignments/:id` - Delete an assignment

## Author

Kunal Bediskar
