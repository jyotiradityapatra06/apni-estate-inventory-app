# APNI ESTATE – Construction Supplier ERP

A modern full-stack ERP (Enterprise Resource Planning) system built for construction material suppliers. The application helps suppliers manage inventory, stock movements, business operations, and future financial workflows through a responsive web interface.

> **Project Status:** MVP (Minimum Viable Product)

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Backend

- Node.js
- Express.js
- Prisma ORM
- SQLite
- JWT Authentication
- bcrypt
- Zod Validation

---

# Current Features

### Authentication

- User Registration
- User Login
- JWT Authentication
- Protected Routes
- Session Persistence
- Secure Logout

### Inventory Management

- Add Material
- Edit Material
- Delete Material
- Stock In
- Stock Out
- Search Inventory
- Location Filtering
- Responsive Inventory Dashboard

### Dashboard

- Business Overview
- Inventory Summary
- Alerts
- Responsive KPI Cards

### Sales Module (MVP)

- Customer List
- Statement View
- Ledger View
- Call Integration
- Responsive Interface

> **Note:** Sales currently uses demo data for presentation. Backend integration is planned for Phase 2.

### Responsive Design

- Mobile
- Tablet
- Desktop

---

# Project Structure

```
Mobile ERP for Construction Suppliers/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── public/
│   └── brand/
│
├── src/
│   ├── api/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── styles/
│   └── types/
│
├── package.json
├── vite.config.ts
└── README.md
```

---

# Installation

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd "Mobile ERP for Construction Suppliers"
```

---

# Frontend Setup

Install dependencies

```bash
npm install
```

Run the frontend

```bash
npm run dev
```

Frontend URL

```
http://localhost:5173
```

---

# Backend Setup

Navigate to backend

```bash
cd backend
```

Install dependencies

```bash
npm install
```

Copy the environment template

```bash
cp .env.example .env
```

(Windows users can manually copy `.env.example` to `.env`.)

Generate Prisma Client

```bash
npx prisma generate
```

Run database migrations

```bash
npx prisma migrate dev
```

Seed the database

```bash
npm run prisma:seed
```

Start backend server

```bash
npm run dev
```

Backend URL

```
http://localhost:5000
```

---

# Demo Login

### Admin Account

Email

```
admin@shrikrishnatraders.com
```

Password

```
Admin@123
```

---

# API Highlights

## Authentication

- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

## Business

- GET `/api/business`
- PATCH `/api/business`

## Inventory

- GET `/api/inventory`
- GET `/api/inventory/:id`
- POST `/api/inventory`
- PUT `/api/inventory/:id`
- DELETE `/api/inventory/:id`
- PATCH `/api/inventory/:id/stock`

---

# Current Project Status

## Completed

- Responsive UI
- Backend Architecture
- Authentication
- Business Isolation
- Inventory CRUD
- Stock Management
- Dashboard
- Protected Routes
- Statement View
- Ledger View
- Call Integration
- APNI ESTATE Branding

---

# Planned Features (Phase 2)

- Sales Backend
- Customer Management
- Purchase Orders
- Supplier Management
- Delivery Management
- Finance & Accounting
- GST Reports
- Barcode Scanner
- WhatsApp Notifications
- Analytics Dashboard
- AI-Based Demand Forecasting
- Role-Based Access Control

---

# Notes

- SQLite is currently used for development.
- PostgreSQL/MySQL can be integrated in future versions.
- Some modules currently display demo data for UI demonstration and will be connected to backend services in Phase 2.

---

# Developed By

**Jyotiraditya Patra**

B.Tech Computer Science & Engineering  
ITER, Siksha 'O' Anusandhan University

---

# License

This project is developed for educational, internship, and portfolio purposes.
