# FarmSphere - Admin Frontend

React.js administration portal for FarmSphere Loan Application and Repayment System.

## Architecture & Structure

```
frontend/
├── src/
│   ├── api/            # Centralized Axios client & API endpoints
│   ├── assets/         # Global styles & CSS tokens
│   ├── components/     # Reusable UI elements (Buttons, Cards, Badges, Modals, Loading, Alerts)
│   ├── context/        # AuthContext (JWT management & FPO_ADMIN state)
│   ├── layouts/        # AdminLayout (Sidebar, Header, Profile, Navigation)
│   ├── pages/          # Admin pages (Dashboard, Farmers, Loans, Loan Detail, Repayments, Reports, Notifications)
│   ├── routes/         # ProtectedRoute & AppRoutes
│   ├── App.jsx         # Root app & route configuration
│   └── main.jsx        # App entry point
├── .env                # Configurable API base URL
├── package.json
└── README.md
```

## Running the Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
