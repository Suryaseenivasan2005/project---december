# Jarvis Productivity Dashboard

A full-stack productivity dashboard built with React, Vite, Node.js, Express, and MongoDB.

## Overview

This repository contains a personal productivity dashboard called **Jarvis** with the following sections:

- **Dashboard**: productivity metrics, active projects, DSA progress, AI-style assistant cards.
- **Projects**: project portfolio management with CRUD support.
- **Reading**: book tracking, reading sessions, notes, genre analytics, and progress monitoring.
- **Document Vault**: secure file upload, sharing links, vault access, and file management.
- **DSA**: algorithm challenge tracking and progress overview.
- **Stocks & News**: stock data and news feed powered by Yahoo Finance.

## Repository Structure

- `backend/`
  - `server.js` — Express server entrypoint
  - `routes/` — API routes for projects, news, stocks, etc.
  - `models/` — Mongoose models for app data
  - `dsa/`, `reading/`, `vault/`, `portfolio/` — domain-specific modules
- `frontend/`
  - `src/` — React application source code
  - `src/pages/` — page-level components
  - `src/components/` — shared UI components
  - `public/` — static assets

## Tech Stack

- Frontend: React, Vite, Axios, Lucide Icons, Recharts
- Backend: Node.js, Express, Mongoose, MongoDB, dotenv
- Other: CORS, Multer, JSON Web Token, Yahoo Finance API

## Requirements

- Node.js 18+ (recommended)
- npm or yarn
- MongoDB database

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with the following variables:

```env
MONGO_URI=mongodb+srv://username:password@cluster.example.com/mydatabase
PORT=5000
```

Start the backend server:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The React app runs on `http://localhost:5173` by default.

## Available Backend Scripts

From `backend/`:

- `npm start` — start the server with Node
- `npm run dev` — start the server with Nodemon
- `npm run server` — alias for `node server.js`

## Available Frontend Scripts

From `frontend/`:

- `npm run dev` — run the Vite dev server
- `npm run build` — build production assets
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Notes

- The frontend currently points to the backend API at `http://localhost:5000`
- The backend requires a MongoDB connection string in `MONGO_URI`
- The app uses a development-only user flow for demo features

## API Highlights

Key API endpoints include:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/reading`
- `PUT /api/reading/:id/progress`
- `GET /api/vault`
- `POST /api/vault`
- `GET /api/news`
- `GET /api/health`

## License

This project is provided as-is for development and learning purposes.
