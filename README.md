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

# 🎯 End of README
