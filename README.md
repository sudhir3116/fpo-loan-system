# FPO Loan Application and Repayment Tracking System

> A secure, role-based full-stack system designed for Farmer Producer Organizations (FPOs) to digitize agricultural loan applications, credit evaluations, supporting document verifications, automated EMI scheduling, and repayment tracking.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-Mongoose-47A248?logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-SDK_v2-3448C5?logo=cloudinary&logoColor=white)
![Security](https://img.shields.io/badge/Auth-JWT_%2B_RBAC-critical)
![Tests](https://img.shields.io/badge/Tests-99%2F99_Passing-brightgreen)

---

## 📌 Overview

A **Farmer Producer Organization (FPO)** is an institutional collective of primary producers (farmers) formed to enhance agricultural productivity, collective bargaining, and access to financial resources. Traditional loan handling in FPOs relies heavily on manual paper-based workflows, physical ledger books, and informal record-keeping. This traditional approach introduces critical operational challenges:

- Slow processing times for seasonal credit applications.
- Missing or misplaced physical land and KYC documentation.
- Absence of real-time visibility for farmers regarding loan approval stages.
- Calculation inaccuracies in repayment schedules, interest computations, and partial payments.
- Lack of centralized audit trails and overdue tracking.

The **FPO Loan Application and Repayment Tracking System** digitizes and automates this end-to-end operational cycle. It provides dedicated access controls for **FARMER** members and **FPO_ADMIN** administrators, establishing a transparent, auditable, and automated financial pipeline for agricultural lending.

---

## 🎯 Objectives

The primary objectives implemented across the architecture include:

- **Digital Loan Application**: Enable verified farmer members to apply for agricultural credit with structured parameters (amount, purpose, tenure, interest rate).
- **Supporting Document Management**: Secure handling of KYC, land records, and bank statements via cloud object storage (Cloudinary).
- **Controlled Multi-Stage Review**: A deterministic state machine preventing illegal workflow jumps during loan review, approval, and rejection.
- **Loan Disbursement**: Dedicated authorization for administrators to record fund disbursement.
- **Automated EMI Calculation**: Precise mathematical computation supporting both standard interest-bearing loans and zero-interest initiatives.
- **Repayment Schedule Generation**: Automatic creation of installment schedules upon disbursement with individual due dates and status indicators.
- **Overdue Monitoring**: System-level checking that automatically flags unpaid past-due installments.
- **Role-Based Security & IDOR Prevention**: Granular data protection ensuring strict isolation between different farmer accounts.

---

## ✨ Key Features

### 👨‍🌾 Farmer Module (`farmer-frontend/`)
- **Self-Registration & Authentication**: Sign up as an active farmer member and authenticate securely via JSON Web Tokens.
- **Loan Application Submission**: Submit agricultural loan requests with custom amounts, tenure durations, and agricultural purpose.
- **Loan Portfolio Dashboard**: View all submitted, under-review, approved, active, and closed loans associated with the logged-in farmer.
- **Document Upload**: Upload essential verification files (Identity Proof, Address Proof, Land 7/12 Records, FPO Membership, Bank Statements) directly to Cloudinary.
- **Repayment Tracking**: Monitor individual installments, payment statuses (`PENDING`, `PARTIAL`, `PAID`, `OVERDUE`), amounts paid, and upcoming due dates.
- **Strict Data Isolation (IDOR Protection)**: Farmers cannot view, upload to, or access another farmer's loans, documents, or repayments.

### 👨‍💼 FPO Admin Module (`frontend/`)
- **Protected Administrator Authentication**: Admin accounts require role verification and secure authentication (including Google OAuth support).
- **Application Queue & Filtering**: Review all loan applications across the organization with status-based filtering (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `DISBURSED`, `CLOSED`).
- **Application Evaluation**: Transition applications from `SUBMITTED` into `UNDER_REVIEW`, followed by `APPROVED` or `REJECTED` (with mandatory rejection remarks).
- **Disbursement Recording**: Disburse approved loans, automatically triggering repayment installment generation.
- **Document Verification**: Review uploaded farmer documents with dedicated actions to mark them `VERIFIED` or `REJECTED` (with recorded rejection reasons and timestamps).
- **Payment Recording**: Record offline, bank transfer, or UPI installment receipts with partial payment support, accumulated payment totals, and transaction reference numbers.
- **Audit Logging & Overdue Monitoring**: Centralized administrative audit trails and overdue loan tracking.

### 💰 Loan Lifecycle State Machine
The backend enforces a strict, deterministic state machine for loan lifecycles:

```
SUBMITTED ──► UNDER_REVIEW ──┬──► APPROVED ──► DISBURSED ──► CLOSED
                             │
                             └──► REJECTED
```

- Unauthorized state bypasses (e.g., attempting to disburse a `SUBMITTED` or `REJECTED` loan) are rejected with HTTP 400.
- State changes store administrative audit trails (`approvedBy`, timestamps, `remarks`).

---

## 📁 Project Structure

```
fpo-loan-system/
├── backend/                       # Express.js REST API Server (Port 5001)
│   ├── config/                    # Database (MongoDB Atlas) & Cloudinary configuration
│   ├── controllers/               # Business logic controllers (Auth, Loan, Doc, Repayment, Audit)
│   ├── middleware/                # Auth (JWT), RBAC, and Multer file upload middlewares
│   ├── models/                    # Mongoose schemas (User, Loan, Document, Repayment, AuditLog)
│   ├── routes/                    # Express API route declarations
│   ├── utils/                     # Financial math (EMI), Token generation, and Overdue checkers
│   ├── server.js                  # Express application entry point
│   ├── package.json
│   └── .env.example
├── frontend/                      # FPO Admin Portal Frontend (Port 5173)
│   ├── src/                       # Admin UI, Dashboards, Loan Reviews, Verification, Audit
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── farmer-frontend/               # Farmer Self-Service Portal Frontend (Port 3000)
│   ├── src/                       # Farmer Portal, Application Form, Document Upload, EMI View
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
└── README.md
```

---

## 🧰 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js (v18+) & Express.js (v5.x) | REST API routing, middleware orchestration, and HTTP request pipeline |
| **Database** | MongoDB Atlas & Mongoose | Cloud NoSQL document database and schema validation |
| **Cloud Storage** | Cloudinary SDK | Cloud storage for farmer KYC and land documentation |
| **Admin Frontend** | React 18, Vite, React Router v7 | FPO Administrator and Officer dashboard management |
| **Farmer Frontend** | React 18, Vite, Tailwind CSS, React Router v6 | Farmer portal for loan applications, uploads, and schedule tracking |
| **Authentication** | JWT (Bearer Tokens) & Google OAuth | Stateless, role-based authorization |
| **Testing** | `mongodb-memory-server` & Custom Suites | 99/99 automated verification test assertions |

---

## 🔐 Security Architecture

- **Cryptographic Password Hashing**: Passwords are never stored in plain text. Hashing is executed via `bcryptjs` with 10 salt rounds. The field is configured with `select: false` at the schema level to prevent leakage in database queries.
- **Stateless JWT Authorization**: API requests are authenticated using signed JSON Web Tokens carrying `{ id, role }`. Expired tokens (`TokenExpiredError`) and malformed tokens return HTTP 401.
- **Role-Based Access Control (RBAC)**: Route-level middleware enforces role segregation (`FARMER` vs. `FPO_ADMIN`), rejecting unauthorized role actions with HTTP 403.
- **Admin Privilege Protection**: Registration as `FPO_ADMIN` strictly requires matching the `ADMIN_SECRET_KEY` configured in the backend environment. Public self-assignment of admin privileges is blocked.
- **Insecure Direct Object Reference (IDOR) Defense**:
  - Farmers cannot access or modify loans belonging to other farmers.
  - Farmers cannot upload documents to loans they do not own.
  - Farmers cannot inspect repayments belonging to other farmers.
- **Input & ID Validation**: All incoming route parameters are validated using `mongoose.Types.ObjectId.isValid()`. Malformed IDs immediately return HTTP 400.
- **Strict File Upload Validation**: Multer enforces both an extension and MIME-type whitelist (`application/pdf`, `image/jpeg`, `image/png`) and a strict 5 MB payload ceiling before Cloudinary is reached.
- **Credential Protection**: Database connection strings, JWT signing keys, and Cloudinary API credentials reside exclusively in environment variables and are excluded via `.gitignore`.

---

## 🔌 REST API Summary

| Module | Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Health** | `GET` | `/api/health` | Public | System health check and model loading status |
| **Auth** | `POST` | `/api/auth/register` | Public | Register user (`FARMER` default, `FPO_ADMIN` with key) |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT token |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |
| **Loans** | `POST` | `/api/loans` | `FARMER` | Submit a new loan application |
| **Loans** | `GET` | `/api/loans/my` | `FARMER` | Get all loans belonging to logged-in farmer |
| **Loans** | `GET` | `/api/loans` | `FPO_ADMIN` | List all loans with optional status filtering |
| **Loans** | `GET` | `/api/loans/:id` | Shared | Get loan details (ownership verified) |
| **Loans** | `PUT` | `/api/loans/:id/under-review` | `FPO_ADMIN` | Transition loan status to `UNDER_REVIEW` |
| **Loans** | `PUT` | `/api/loans/:id/approve` | `FPO_ADMIN` | Approve loan |
| **Loans** | `PUT` | `/api/loans/:id/reject` | `FPO_ADMIN` | Reject loan with mandatory remarks |
| **Loans** | `PUT` | `/api/loans/:id/disburse` | `FPO_ADMIN` | Disburse loan and auto-generate EMI schedule |
| **Docs** | `POST` | `/api/documents/upload` | `FARMER` | Upload document to Cloudinary (multipart/form-data) |
| **Docs** | `GET` | `/api/documents/my` | `FARMER` | Retrieve uploaded documents for logged-in farmer |
| **Docs** | `GET` | `/api/documents/loan/:loanId` | Shared | Retrieve documents for specific loan |
| **Docs** | `GET` | `/api/documents` | `FPO_ADMIN` | Retrieve all documents across organization |
| **Docs** | `PUT` | `/api/documents/:id/verify` | `FPO_ADMIN` | Mark document as `VERIFIED` |
| **Docs** | `PUT` | `/api/documents/:id/reject` | `FPO_ADMIN` | Reject document with reason |
| **Repayments** | `GET` | `/api/repayments/my` | `FARMER` | Retrieve all repayment installments for farmer |
| **Repayments** | `GET` | `/api/repayments/loan/:loanId` | Shared | Retrieve installments for a loan |
| **Repayments** | `GET` | `/api/repayments` | `FPO_ADMIN` | Retrieve all repayment records |
| **Repayments** | `PUT` | `/api/repayments/:id/pay` | `FPO_ADMIN` | Record installment payment (partial or full) |
| **Audit** | `GET` | `/api/audit-logs` | `FPO_ADMIN` | Retrieve system-wide administrative audit trail |

---

## ⚙️ Installation & Running

### 1. Backend Setup (Port 5001)
```bash
cd backend
npm install
# Create backend/.env based on backend/.env.example
npm run dev
```

### 2. Admin Portal Setup (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

### 3. Farmer Portal Setup (Port 3000)
```bash
cd farmer-frontend
npm install
npm run dev
```

---

## 👥 Team Contributions

- **Sasthika D** — Farmer Module Frontend & Self-Service Workflows
- **Rhidhanya K** — Admin Module Frontend & Verification Workflows
- **Sudhir S** — Backend Architecture, Database Engineering & API Design

---

## 📄 License

This project was developed for academic and institutional evaluation.
