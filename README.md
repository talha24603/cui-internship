# Internship Management System

A comprehensive web-based Internship Management System developed to streamline the internship process between universities, students, supervisors, and internship providers. The system centralizes internship management, report submission, evaluations, and communication, eliminating manual paperwork and improving transparency.

---

## Table of Contents

- Overview
- Features
- User Roles
- System Workflow
- Technology Stack
- Architecture
- Project Structure
- Installation
- Environment Variables
- Database
- API Endpoints
- Security
- Future Enhancements
- Contributors
- License

---

# Overview

The Internship Management System digitizes the complete internship lifecycle. It enables universities to manage internship placements, monitor student progress, collect weekly reports, conduct evaluations, and calculate final grades from a single platform.

The application supports multiple user roles, each with dedicated functionality and permissions.

---

# Features

## Student

- Secure authentication
- View internship details
- Submit weekly internship reports
- View supervisor feedback
- Track internship progress
- View final evaluation and grades

## Supervisor

- View assigned student groups
- Review weekly reports
- Approve or reject reports
- Provide feedback
- Evaluate student performance
- Monitor internship progress

## Internship Provider (Site)

- View assigned students
- Submit internship performance evaluations
- Update internship status

## Admin

- Manage students
- Manage supervisors
- Manage internship providers
- Create internship groups
- Assign supervisors
- Manage internships
- Monitor overall system activity
- Generate reports

---

# User Roles

| Role | Description |
|------|-------------|
| Student | Submits reports and monitors internship progress |
| Supervisor | Reviews reports and evaluates students |
| Internship Provider | Evaluates students during internships |
| Admin | Manages the complete internship process |

---

# System Workflow

1. Admin registers internship providers.
2. Students are assigned to internship sites.
3. Students are grouped according to their internship provider.
4. A university supervisor is assigned to each group.
5. Students submit weekly internship reports.
6. Supervisors review reports and provide feedback.
7. Internship providers submit performance evaluations.
8. Supervisors complete final evaluations.
9. Final grades are calculated based on predefined criteria.

---

# Evaluation Criteria

The final internship marks are calculated using:

- Internship Provider Evaluation
- Supervisor Evaluation
- Presentation Marks

---

# Technology Stack

## Frontend

- Angular
- TypeScript
- Angular Material
- RxJS

## Backend

- Next.js
- TypeScript
- REST API

## Database

- PostgreSQL

## Authentication

- JSON Web Token (JWT)
- Role-Based Access Control (RBAC)

---

# Architecture

```
                   +----------------------+
                   |      Angular UI      |
                   +----------+-----------+
                              |
                              |
                        REST API Calls
                              |
                              ▼
                 +-------------------------+
                 |     Next.js Backend     |
                 +-----------+-------------+
                             |
                             |
                    Database Queries
                             |
                             ▼
                     PostgreSQL Database
```

---

# Project Structure

```
Internship-Management-System/
│
├── frontend/
│   ├── src/
│   ├── angular.json
│   └── package.json
│
├── backend/
│   ├── app/
│   ├── api/
│   ├── lib/
│   ├── services/
│   ├── middleware/
│   └── package.json
│
├── database/
│
├── docs/
│
└── README.md
```

---

# Core Modules

- Authentication
- User Management
- Student Management
- Supervisor Management
- Internship Provider Management
- Internship Group Management
- Weekly Reports
- Evaluations
- Final Grading

---

# Installation

## Clone Repository

```bash
git clone https://github.com/your-username/internship-management-system.git

cd internship-management-system
```

---

## Frontend Setup

```bash
cd frontend

npm install

ng serve
```

Application runs at:

```
http://localhost:4200
```

---

## Backend Setup

```bash
cd backend

npm install

npm run dev
```

Backend runs at:

```
http://localhost:3000
```

---

# Environment Variables

Create a `.env` file inside the backend folder.

```env
DATABASE_URL=postgresql://username:password@localhost:5432/internship_db

JWT_SECRET=your-secret-key

JWT_EXPIRES_IN=7d
```

---

# Database

The database contains the following major entities:

- Users
- Students
- Supervisors
- Internship Providers
- Internship Groups
- Weekly Reports
- Evaluations
- Presentations
- Final Grades

---

# REST API

## Authentication

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
```

## Students

```
GET    /api/students
GET    /api/students/:id
PUT    /api/students/:id
```

## Weekly Reports

```
POST   /api/reports
GET    /api/reports
PUT    /api/reports/:id
DELETE /api/reports/:id
```

## Evaluations

```
POST   /api/evaluations
GET    /api/evaluations
```

---

# Security

- JWT Authentication
- Password Hashing
- Role-Based Authorization
- Protected Routes
- Request Validation
- Secure API Endpoints

---

# Future Enhancements

- Mobile Application
- Email Notifications
- Internship Attendance
- AI-based Performance Analytics
- Calendar Integration
- File Uploads
- Real-time Notifications
- Chat System
- Dashboard Analytics

---

# Contributors

| Name | Role |
|------|------|
| Talha | Full Stack Developer |

---

# License

This project was developed as a Final Year Project (FYP) for academic purposes.

---

## Screenshots

Add screenshots of the following pages after completing the project:

- Login Page
- Student Dashboard
- Supervisor Dashboard
- Admin Dashboard
- Weekly Report Submission
- Evaluation Module

---

## Acknowledgements

This project was developed to simplify internship management for educational institutions by providing a centralized platform for students, supervisors, internship providers, and administrators.
