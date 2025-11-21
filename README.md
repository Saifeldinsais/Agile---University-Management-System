# University Management System – MERN (Frontend + Backend)

This project is part of the Agile Software Engineering course and follows the Scrum framework.  
It contains a **React (Vite) frontend** and a **Node.js + Express + MongoDB backend**.

---

## 📦 Project Structure

```
Agile---University-Management-System/
│
├── Backend/              # Node.js + Express backend
│   ├── Controllers/      # API controllers (student, facilities, etc.)
│   ├── Routes/           # API routes
│   ├── Models/           # Mongoose models
│   ├── Db_config/        # MongoDB connection file
│   ├── server.js         # Main server entry file
│   └── .env              # Backend environment variables
│
└── frontend/             # React (Vite) frontend
    ├── src/
    │   ├── components/   # Reusable UI components (Navbar, etc.)
    │   ├── layouts/      # Layout wrappers with <Outlet />
    │   ├── pages/        # App pages (Login, Signup, Home, etc.)
    │   ├── services/     # API client + services
    │   └── assets/       # Global CSS
    ├── index.html
    ├── vite.config.js
    └── .env              # Frontend environment variables
```

---

# 🚀 How to Run the Project

## 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd Agile---University-Management-System
```

---

# 🌐 Backend Setup (Node.js + MongoDB)

Go to backend:

```bash
cd Backend
```

### Install dependencies:

```bash
npm install
```

### Create `.env`:

```
MONGO_URI=mongodb://localhost:27017/ums
PORT=5000
JWT_SECRET=yourjwtsecret
```

### Start the backend:

```bash
npm start
```

Backend runs on:

```
http://localhost:5000
```

---

# 🎨 Frontend Setup (React + Vite)

Open new terminal:

```bash
cd frontend
```

### Install dependencies:

```bash
npm install
```

### Create `.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Start frontend:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 🔗 API Usage

Frontend uses central Axios client:

```js
baseURL = import.meta.env.VITE_API_BASE_URL
```

---

# 🧪 Features Implemented

✔ User Login / Signup  
✔ MongoDB Integration  
✔ React Router + Layouts  
✔ Navbar  
✔ Environment configuration  
✔ Simple form validation  
✔ API services  

---

# 📁 Folder Purpose Summary

| Folder | Purpose |
|--------|---------|
| Controllers | Logic for API endpoints |
| Routes | Define backend routes |
| Models | Mongoose schemas |
| Db_config | MongoDB connection |
| pages | React pages |
| layouts | Layouts with outlet |
| components | UI components |
| services | Axios + APIs |
| assets | Global styling |

---

# ✔ README Acceptance Criteria Met

This README includes:
- Installation steps  
- Run commands  
- `.env` setup  
- Folder structure + purpose  

---

# 🔧 Functionalities Implemented So Far

This section summarizes all backend and frontend features that are fully implemented at this stage of the University Management System.

---

## 🧑‍🎓 Student Authentication

- Student Sign Up (with email + password)

- Student Login (JWT authentication)

- Password hashing using bcrypt

- Email validation + duplicate email prevention

- Rejects any student email containing "@admin" for security

## 🧑‍💼 Admin Features

Admins are created manually by the system (no public signup).

✔ Admin Login

- Secure login using JWT

- Password hashing & verification

## 🏫 Classroom Management (Admin)
✔ Create Classroom

- Create hall/lab with:

    - roomName

    - capacity

    - type

    - optional bookedSchedule

- Validation for duplicates & constraints

✔ View All Classrooms

- Returns all classrooms with full details.

✔ Update Classroom

- Admin can edit:

    - capacity

    - type

    - isWorking (maintenance mode)

    - any other field

✔ Delete Classroom

- Deletes classroom by ID

- Returns updated list

✔ Classroom Status

Returns:

- working / not working state

- all booked time slots

- which doctor booked each slot

✔ Assign Classroom to Doctor

- Doctor + Timeslot assignment

- Prevents double booking of same timeslot

- Prevents booking if classroom is under maintenance (isWorking === false)

- Automatically records doctor in requested_by

✔ Unassign Classroom

- Removes booking from bookedSchedule

- Removes doctor from requested_by

- Checks:

    - timeslot exists

    - doctor matches the one who booked it (safe index check)

## 📚 Course Management (Admin)
✔ Create Course

- Fields: title, code, credits, department, description

- Prevents duplicate codes

✔ Update Course

- Admin can update any course field

✔ Delete Course

- Deletes by ID

- Returns updated list

✔ Assign Course to Doctor

- Adds course to doctor’s courses[]

- Checks duplicates safely (ObjectId safe compare)

✔ Unassign Course from Doctor

- Removes course from doctor’s courses[]

- Prevents unassigning a non-assigned course

🖥️ Frontend Functionality (React + Vite)
✔ Authentication Pages

- Student signup

- Student/admin login

- Frontend detects:

    - If email contains @admin → call admin login endpoint

    - Otherwise → student login

✔ Navigation Based on User Role

- Students → navigate to /

- Admins → navigate to /admin/dashboard

✔ Layout + Routing

- Global layout with Navbar using <Outlet />

- Pages:

    - Home

    - Facilities

    - Dashboard

    - Admin Dashboard

    - Login

    - Signup

    - NotFound

✔ Axios API Layer

- Centralized Axios client (apiClient.js)

- Error interceptor included

- Environment-based API URL via VITE_API_BASE_URL

# 🎯 End of README
