import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageLibrariansPage from './pages/admin/ManageLibrariansPage';
import ManageStudentsPage from './pages/admin/ManageStudentsPage';
import AdminBookManagementPage from './pages/admin/AdminBookManagementPage';
import AdminActivityPage from './pages/admin/AdminActivityPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AdminReservationsPage from './pages/admin/AdminReservationsPage';
import AdminFinesPage from './pages/admin/AdminFinesPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Librarian Pages
import LibrarianDashboard from './pages/librarian/LibrarianDashboard';
import BookManagementPage from './pages/librarian/BookManagementPage';
import IssueBookPage from './pages/librarian/IssueBookPage';
import ReturnBookPage from './pages/librarian/ReturnBookPage';
import ReservationsPage from './pages/librarian/ReservationsPage';
import RenewalsPage from './pages/librarian/RenewalsPage';
import OverdueBooksPage from './pages/librarian/OverdueBooksPage';
import BorrowingHistoryPage from './pages/librarian/BorrowingHistoryPage';
import ManageReviewsPage from './pages/librarian/ManageReviewsPage';
import CirculationPage from './pages/librarian/CirculationPage';
import LibrarianUserManagementPage from './pages/librarian/LibrarianUserManagementPage';
import LibrarianReportsPage from './pages/librarian/LibrarianReportsPage';
import LibrarianSettingsPage from './pages/librarian/LibrarianSettingsPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import BookCatalogPage from './pages/student/BookCatalogPage';
import MyBorrowedBooksPage from './pages/student/MyBorrowedBooksPage';
import MyReservationsPage from './pages/student/MyReservationsPage';
import MyHistoryPage from './pages/student/MyHistoryPage';
import MyFinesPage from './pages/student/MyFinesPage';
import StudentReviewsPage from './pages/student/StudentReviewsPage';
import StudentProfilePage from './pages/student/StudentProfilePage';

// Redirect helper for root path
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'librarian') return <Navigate to="/librarian" replace />;
  return <Navigate to="/student" replace />;
};

function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/librarians" element={<ManageLibrariansPage />} />
          <Route path="/admin/students" element={<ManageStudentsPage />} />
          <Route path="/admin/books" element={<AdminBookManagementPage />} />
          <Route path="/admin/activity" element={<AdminActivityPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/borrowings" element={<AdminActivityPage />} />
          <Route path="/admin/reservations" element={<AdminReservationsPage />} />
          <Route path="/admin/fines" element={<AdminFinesPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* Librarian Routes */}
      <Route element={<ProtectedRoute allowedRoles={['librarian']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/librarian" element={<LibrarianDashboard />} />
          <Route path="/librarian/books" element={<BookManagementPage />} />
          <Route path="/librarian/circulation" element={<CirculationPage />} />
          <Route path="/librarian/issue" element={<IssueBookPage />} />
          <Route path="/librarian/return" element={<ReturnBookPage />} />
          <Route path="/librarian/reservations" element={<ReservationsPage />} />
          <Route path="/librarian/renewals" element={<RenewalsPage />} />
          <Route path="/librarian/users" element={<LibrarianUserManagementPage />} />
          <Route path="/librarian/fines" element={<OverdueBooksPage />} />
          <Route path="/librarian/overdue" element={<OverdueBooksPage />} />
          <Route path="/librarian/reports" element={<LibrarianReportsPage />} />
          <Route path="/librarian/settings" element={<LibrarianSettingsPage />} />
          <Route path="/librarian/history" element={<BorrowingHistoryPage />} />
          <Route path="/librarian/reviews" element={<ManageReviewsPage />} />
        </Route>
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/catalog" element={<BookCatalogPage />} />
          <Route path="/student/borrowed" element={<MyBorrowedBooksPage />} />
          <Route path="/student/reservations" element={<MyReservationsPage />} />
          <Route path="/student/history" element={<MyHistoryPage />} />
          <Route path="/student/fines" element={<MyFinesPage />} />
          <Route path="/student/reviews" element={<StudentReviewsPage />} />
          <Route path="/student/settings" element={<StudentProfilePage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
        </Route>
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
