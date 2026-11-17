# Library Management System (MERN Stack)

A complete, full-featured Library Management System developed with the **MERN Stack (MongoDB, Express.js, React.js, Node.js, and Bootstrap)**. Designed with a clean MVC backend architecture and a responsive, modern sidebar dashboard interface for three distinct user roles: **Admin**, **Librarian**, and **Student**.

---

## 1. Technology Stack

- **Frontend:** React.js, React Router DOM (v7), Bootstrap 5, Bootstrap Icons, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs password hashing
- **Styling:** Bootstrap 5 with clean custom CSS variables

---

## 2. Default Test Credentials

Use the **Quick Demo Fill** buttons on the Login page (`http://localhost:3000/login`) or sign in manually with these pre-seeded accounts:

| Role | Name | Email | Password | Access / Dashboard |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Rajesh Sharma | `admin@library.com` | `admin123` | `/admin` (Full system administration) |
| **Librarian** | Priya Sundaram | `librarian@library.com` | `librarian123` | `/librarian` (Book catalog, circulation, returns, reservations) |
| **Student** | Aarav Patel | `student@library.com` | `student123` | `/student` (Catalog browsing, reservations, renewals, fines) |

> **Note on Security:** Student accounts can self-register via the Registration page. Librarian and Administrator accounts cannot self-register and are provisioned securely by the Administrator.

---

## 3. Project Folder Structure

```text
library-management-system/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection via Mongoose
│   │   └── constants.js       # Centralized business limits & fine configuration
│   ├── controllers/
│   │   ├── authController.js        # User registration, login, and token generation
│   │   ├── userController.js        # Admin user management (CRUD)
│   │   ├── bookController.js        # Book inventory catalog management
│   │   ├── issueController.js       # Book issue, return, renewal, and fine calculations
│   │   ├── reservationController.js # Hold and reservation request workflow
│   │   ├── reviewController.js      # Student ratings & review submissions
│   │   └── reportController.js      # Dashboard analytics & activity reports
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification & role authorization (403 guard)
│   │   └── errorMiddleware.js       # Global 404 and error handling
│   ├── models/
│   │   ├── User.js            # User schema with bcrypt pre-save hash
│   │   ├── Book.js            # Book schema with ISBN uniqueness
│   │   ├── IssueRecord.js     # Issue / return transaction schema
│   │   ├── Reservation.js     # Book reservation requests
│   │   └── Review.js          # Book ratings and reviews (unique compound index)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── issueRoutes.js
│   │   ├── reservationRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── reportRoutes.js
│   ├── utils/
│   │   └── calculateFine.js   # Dynamic fine calculation utility ($2/day overdue)
│   ├── .env                   # Environment variables (PORT, MONGO_URI, JWT_SECRET)
│   ├── seed.js                # Database seeder with sample data & default accounts
│   ├── server.js              # Express app entry point
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   │   └── styles.css           # Clean custom dashboard styling
    │   ├── components/
    │   │   ├── AlertMessage.jsx     # Reusable alert notifications
    │   │   ├── LoadingSpinner.jsx   # Consistent loading indicators
    │   │   ├── Navbar.jsx           # Top header with user details and logout
    │   │   ├── ProtectedRoute.jsx   # Role-based route guard
    │   │   ├── Sidebar.jsx          # Dynamic sidebar filtered by user role
    │   │   └── StatsCard.jsx        # Professional dashboard metric card
    │   ├── context/
    │   │   └── AuthContext.jsx      # Global authentication state & JWT management
    │   ├── layouts/
    │   │   └── DashboardLayout.jsx  # Main application dashboard layout
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx    # Common login with quick demo credentials
    │   │   │   └── RegisterPage.jsx # Student self-registration
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.jsx             # Key metrics & quick feature navigation
    │   │   │   ├── ManageLibrariansPage.jsx       # Add, update, view, and manage librarians
    │   │   │   ├── ManageStudentsPage.jsx         # View registrations, update, & manage students
    │   │   │   ├── AdminBookManagementPage.jsx    # Inventory copies (total/available/borrowed) & CRUD books
    │   │   │   ├── AdminActivityPage.jsx          # Live transaction & activity monitoring
    │   │   │   └── AdminReportsPage.jsx           # Activity & financial reports generation
    │   │   ├── librarian/
    │   │   │   ├── LibrarianDashboard.jsx         # Overview & quick action approvals
    │   │   │   ├── BookManagementPage.jsx         # Add, edit, delete books
    │   │   │   ├── IssueBookPage.jsx              # Issue books with limit validation
    │   │   │   ├── ReturnBookPage.jsx             # Return books & calculate fines
    │   │   │   ├── ReservationsPage.jsx           # Approve/reject student holds
    │   │   │   ├── RenewalsPage.jsx               # Approve/reject loan renewals
    │   │   │   ├── OverdueBooksPage.jsx           # Overdue tracking & penalties
    │   │   │   ├── BorrowingHistoryPage.jsx       # Complete transaction history
    │   │   │   └── ManageReviewsPage.jsx          # Reviews and ratings management
    │   │   ├── student/
    │   │   │   ├── StudentDashboard.jsx           # Student overview & active loans
    │   │   │   ├── BookCatalogPage.jsx            # Browse, filter, and reserve books
    │   │   │   ├── MyBorrowedBooksPage.jsx        # Active loans & request renewal
    │   │   │   ├── MyReservationsPage.jsx         # Track reservation requests
    │   │   │   ├── MyHistoryPage.jsx              # Past loans & leave reviews
    │   │   │   ├── MyFinesPage.jsx                # Breakdown of overdue fines
    │   │   │   └── StudentProfilePage.jsx         # View and update student personal information
    │   │   └── NotFoundPage.jsx
    │   ├── services/
    │   │   └── api.js               # Axios instance with JWT interceptor
    │   ├── App.jsx                  # Route definitions
    │   └── main.jsx                 # React root & Provider setup
    ├── vite.config.js               # Vite proxy to backend port 5000
    └── package.json
```

---

## 4. Setup and Installation

### Step 1: Ensure Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** running locally on `mongodb://localhost:27017`

### Step 2: Install Backend Dependencies & Seed Database
Open a terminal in the project root:
```bash
cd backend
npm install
npm run seed
```
> Running `npm run seed` creates sample users, sample books across multiple categories, active and overdue borrowings, reviews, and reservations.

### Step 3: Start the Backend Server
```bash
cd backend
npm start
```
The backend server runs on `http://localhost:5000`.

### Step 4: Install Frontend Dependencies & Start Client
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend client runs on `http://localhost:3000`.

---

## 5. Key System Rules & Features

1. **Role-Based Access Control (RBAC):**
   - Routes on both backend (`authMiddleware.js`) and frontend (`ProtectedRoute.jsx`) strictly verify roles.
   - Non-permitted attempts return `403 Forbidden` on the backend and redirect to the user's dashboard on the frontend.
2. **Borrowing Limits & Issue Rules:**
   - Maximum active loans per student: **3 books** (configured in `constants.js`).
   - Books with **0 available copies** cannot be issued.
   - A student cannot borrow a duplicate active copy of a book they already hold.
   - Default loan period: **14 days**.
3. **Due Dates and Automatic Fine Calculation:**
   - Overdue rate: **₹5.00 per day** overdue (in Indian Rupees).
   - Fines are calculated dynamically for unreturned books and finalized upon return.
   - Librarians can record fine payments upon return or in the Overdue Management page.
4. **Renewal Policy:**
   - Students can request **1 renewal per loan**.
   - Renewals are prohibited if the book is **already overdue** or **reserved by another student**.
   - Upon approval by a librarian, the due date is extended by **7 days**.
5. **Reservations:**
   - Students can reserve available books.
   - Duplicate active reservations for the same book by the same student are prevented.
   - Librarians review and approve/reject reservations.
6. **Reviews and Ratings:**
   - Students can submit a 1 to 5-star rating and comment.
   - Only students who have **previously or currently borrowed** the book can review it.
   - Duplicate reviews by the same student for the same book are strictly prevented.

---

## 6. Postman API Reference

All protected endpoints require the header:
```http
Authorization: Bearer <your_jwt_token>
```

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a student account
- `POST /api/auth/login` - Login (Admin, Librarian, Student)
- `GET /api/auth/me` - Get current authenticated user profile

### Book Catalog (`/api/books`)
- `GET /api/books` - Get all books (supports `?search=` and `?category=`)
- `GET /api/books/categories` - Get distinct category list
- `GET /api/books/:id` - Get single book details
- `POST /api/books` - Add a new book *(Librarian, Admin)*
- `PUT /api/books/:id` - Update book details *(Librarian, Admin)*
- `DELETE /api/books/:id` - Delete book *(Librarian, Admin)*

### Circulation & Issues (`/api/issues`)
- `POST /api/issues` - Issue a book to a student *(Librarian, Admin)*
- `PUT /api/issues/:id/return` - Return an issued book *(Librarian, Admin)*
- `GET /api/issues` - Get all borrowings *(Librarian, Admin)*
- `GET /api/issues/my-borrowings` - Get student's borrowings *(Student)*
- `POST /api/issues/:id/request-renewal` - Request loan renewal *(Student)*
- `PUT /api/issues/:id/handle-renewal` - Approve/reject renewal *(Librarian, Admin)*
- `PUT /api/issues/:id/pay-fine` - Mark fine settled *(Librarian, Admin)*

### Reservations (`/api/reservations`)
- `POST /api/reservations` - Create reservation request *(Student)*
- `GET /api/reservations/my-reservations` - Get student's reservations *(Student)*
- `GET /api/reservations` - Get all reservations *(Librarian, Admin)*
- `PUT /api/reservations/:id/status` - Approve or reject reservation *(Librarian, Admin)*
- `PUT /api/reservations/:id/cancel` - Cancel pending reservation *(Student)*

### Reviews & Ratings (`/api/reviews`)
- `POST /api/reviews` - Submit review for borrowed book *(Student)*
- `GET /api/reviews/book/:bookId` - Get all reviews and average rating for a book

### Reports & Analytics (`/api/reports`)
- `GET /api/reports/stats` - Overall dashboard KPI statistics
- `GET /api/reports/activity` - Detailed circulation audit and overdue list *(Admin, Librarian)*

### Users (`/api/users`)
- `GET /api/users` - List users with role filter & search *(Admin, Librarian)*
- `POST /api/users` - Create user *(Admin)*
- `PUT /api/users/:id` - Update user *(Admin)*
- `DELETE /api/users/:id` - Delete user *(Admin)*

