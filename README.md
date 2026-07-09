# Library Management System — Frontend

A React + Vite frontend for the StudySpace Library Management System.

---

## 🏗️ Tech Stack

- **React 18** with React Router DOM (client-side routing)
- **Vite 8** (bundler & dev server)
- **Vanilla CSS** (no Tailwind)
- **API Base URL**: `https://test.edu2all.in/library`

---

## 📋 Prerequisites

- Node.js >= 18.x
- npm >= 9.x

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://gitlab.com/librarymangementnew/librarymangement_frontend.git
cd librarymangement_frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

The app will start at: **http://localhost:5273**

> Port is locked to `5273` via `vite.config.js`. If this port is in use, free it before starting.

### 4. Build for production

```bash
npm run build
```

The compiled output will be in the `dist/` folder.

### 5. Preview the production build locally

```bash
npm run preview
```

---

## 🗂️ Project Structure

```
src/
├── App.jsx               # Main app with routes and all views
├── main.jsx              # Entry point — wraps App in BrowserRouter
├── index.css             # Global styles
└── components/
    ├── AddStudentModal.jsx
    ├── PayNowModal.jsx
    └── Toast.jsx
```

---

## 🔗 Routes

| Path          | Description                |
|---------------|----------------------------|
| /login        | Owner / Student login page |
| /onboarding   | New library signup wizard  |
| /dashboard    | Owner admin dashboard      |
| /student      | Student portal             |
| *             | Redirects to /login        |

---

## 🌐 API Configuration

API base URL is defined in `src/App.jsx`:

```js
const API_BASE_URL = 'https://test.edu2all.in/library';
```

To point at a local backend instead, change this to:

```js
const API_BASE_URL = 'http://localhost:5007';
```

---

## 🔑 Authentication

- JWT tokens are stored in `localStorage` under the key `token`.
- All authenticated API requests send the token as `Authorization: <token>` header.
- Logout clears `token` and `role` from `localStorage` and redirects to `/login`.

---

## 🧩 Backend Repository

Backend Spring Boot project:
https://gitlab.com/librarymangementnew/librarymanagement_backend

---

## ⚙️ Backend — How to Run

```bash
# Clone backend
git clone https://gitlab.com/librarymangementnew/librarymanagement_backend.git
cd librarymanagement_backend

# Run with staging profile (requires VPN for DB access)
mvn spring-boot:run -Dspring-boot.run.profiles=staging

# Or run with local profile
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Backend runs on **port 5007** by default.
