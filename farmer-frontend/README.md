# FPO Loan Application - Farmer Module Frontend

This is the frontend application for the Farmer Module of the FPO Loan Application and Repayment Tracking System. It's built with React.js, Vite, Tailwind CSS, and Axios.

## Project Structure

```
farmer-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── StatusBadges.jsx
│   │   ├── UI.jsx
│   │   └── Modal.jsx
│   ├── context/            # React Context for state management
│   │   └── AuthContext.jsx
│   ├── hooks/              # Custom React hooks
│   │   └── useAuth.js
│   ├── pages/              # Page components
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── ApplyLoanPage.jsx
│   │   ├── MyLoansPage.jsx
│   │   ├── LoanDetailsPage.jsx
│   │   ├── DocumentsPage.jsx
│   │   ├── RepaymentSchedulePage.jsx
│   │   └── NotificationsPage.jsx
│   ├── services/           # API service layers
│   │   ├── api.js         # Axios configuration with interceptors
│   │   ├── auth.js        # Authentication service
│   │   └── loan.js        # Loan, document, and repayment services
│   ├── App.jsx            # Main application component with routing
│   ├── main.jsx           # React DOM entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

## Features Implemented

### Authentication
- ✅ User Registration with validation
- ✅ User Login with JWT token storage
- ✅ Protected routes with authentication checks
- ✅ Session restoration on app load
- ✅ Automatic logout on 401 errors
- ✅ Logout functionality

### Dashboard
- ✅ Summary cards showing loan statistics
- ✅ Recent loan applications listing
- ✅ Quick action links for applying and viewing loans

### Loan Management
- ✅ Apply for new loans with form validation
- ✅ View all loans with status filtering
- ✅ View detailed loan information
- ✅ Rejection remarks display
- ✅ Loan status tracking
- ✅ Navigation to documents and repayment schedules

### Document Management
- ✅ Upload documents with file validation
- ✅ File size and type validation (5 MB max, PDF/JPG/PNG)
- ✅ Document status tracking
- ✅ View uploaded documents
- ✅ Document type categorization

### Repayment Tracking
- ✅ View repayment schedules
- ✅ EMI amount breakdown
- ✅ Payment status tracking
- ✅ Summary statistics (total due, paid, outstanding)
- ✅ Payment history view

### User Profile
- ✅ View farmer profile information
- ✅ Display all personal details
- ✅ Account information display

### Notifications
- ✅ Notification UI structure (ready for backend integration)
- ✅ Notification preferences settings
- ✅ Placeholder notifications for demonstration

## Technology Stack

- **Frontend Framework:** React 18.2
- **Build Tool:** Vite 4.5
- **CSS Framework:** Tailwind CSS 3.3
- **Routing:** React Router v6
- **HTTP Client:** Axios 1.6
- **State Management:** React Context API
- **Authentication:** JWT (Bearer tokens)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Backend server running on http://localhost:5001

## Installation

1. Navigate to the project directory:
```bash
cd farmer-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `farmer-frontend` directory with the backend URL:
```
VITE_BACKEND_URL=http://localhost:5001
```

## Running the Application

### Development Server
```bash
npm run dev
```
The application will start on `http://localhost:3000` and automatically open in your browser.

### Production Build
```bash
npm run build
```
This creates an optimized production build in the `dist` folder.

### Preview Production Build
```bash
npm run preview
```

## API Integration

The application integrates with the following backend endpoints:

### Authentication
- `POST /api/auth/register` - Register new farmer
- `POST /api/auth/login` - Login farmer
- `GET /api/auth/me` - Get current farmer profile

### Loans
- `POST /api/loans` - Create new loan application
- `GET /api/loans/my` - Get all farmer's loans
- `GET /api/loans/:id` - Get specific loan details

### Documents
- `POST /api/documents/upload` - Upload document (multipart/form-data)
- `GET /api/documents/my` - Get all farmer's documents
- `GET /api/documents/loan/:loanId` - Get loan's documents

### Repayments
- `GET /api/repayments/my` - Get all farmer's repayments
- `GET /api/repayments/loan/:loanId` - Get specific loan's repayments

## Routes

### Public Routes
- `/login` - Farmer login page
- `/register` - Farmer registration page

### Protected Farmer Routes
- `/farmer/dashboard` - Dashboard with overview
- `/farmer/profile` - User profile page
- `/farmer/loans` - List all loans
- `/farmer/loans/:id` - Loan details
- `/farmer/loans/:id/documents` - Loan documents
- `/farmer/loans/:id/repayments` - Repayment schedule
- `/farmer/apply-loan` - Apply for new loan
- `/farmer/notifications` - Notifications center

## Authentication Flow

1. User registers or logs in
2. JWT token is stored in localStorage
3. Token is automatically attached to all API requests via Axios interceptor
4. If token expires (401 response), user is redirected to login
5. Protected routes check authentication status before rendering

## Form Validation

- Email validation with regex pattern
- Password minimum 6 characters
- Password confirmation matching
- Numeric field validation
- Required field validation
- File upload validation (size, type)

## Error Handling

- API error messages displayed to users
- Network error handling
- 401 Unauthorized redirect to login
- Form validation errors displayed inline
- Retry functionality for failed operations
- User-friendly error messages

## Component Highlights

### Reusable Components
- `LoadingSpinner` - Loading state indicator
- `ErrorMessage` - Error display with retry
- `EmptyState` - Empty state placeholder
- `Card` - Generic card container
- `SummaryCard` - Summary statistics card
- `Button` - Styled button with variants
- `LoanStatusBadge` - Loan status indicator
- `RepaymentStatusBadge` - Repayment status indicator
- `DocumentStatusBadge` - Document status indicator
- `Modal` - Dialog box component
- `Toast` - Notification/toast component

### Service Layer
- Centralized API configuration
- Request/response interceptors
- Error handling
- Token management
- Organized service functions

## Styling

The application uses Tailwind CSS for styling with custom theme colors:
- Primary: Green (#10b981)
- Secondary: Emerald (#059669)
- Danger: Red (#ef4444)
- Warning: Amber (#f59e0b)
- Info: Blue (#3b82f6)

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
