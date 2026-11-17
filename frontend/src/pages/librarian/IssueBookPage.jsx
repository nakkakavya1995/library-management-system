import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertMessage from '../../components/AlertMessage';

const IssueBookPage = () => {
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [issuedRecord, setIssuedRecord] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [booksRes, studentsRes] = await Promise.all([
        api.get('/books'),
        api.get('/users?role=student')
      ]);

      setBooks(booksRes.data.books);
      setStudents(studentsRes.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueBook = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIssuedRecord(null);

    if (!selectedBookId || !selectedStudentId) {
      setError('Please select both a book and a student');
      return;
    }

    try {
      setIssuing(true);
      const res = await api.post('/issues', {
        bookId: selectedBookId,
        studentId: selectedStudentId
      });

      setSuccess('Book has been successfully issued to the student!');
      setIssuedRecord(res.data.issue);

      // Reset selection and refresh book availability
      setSelectedBookId('');
      setSelectedStudentId('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setIssuing(false);
    }
  };

  const selectedBook = books.find((b) => b._id === selectedBookId);
  const selectedStudent = students.find((s) => s._id === selectedStudentId);

  // Calculate default due date (14 days from now)
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);

  if (loading) return <LoadingSpinner text="Preparing book issuance form..." />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Issue Book</h3>
          <p className="text-muted small mb-0">Issue a book to a registered student</p>
        </div>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header">
              <i className="bi bi-journal-plus me-2"></i>Issue Book
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleIssueBook}>
                {/* Book Selection */}
                <div className="mb-4">
                  <label className="form-label small fw-semibold">Select Book *</label>
                  <select
                    className="form-select"
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Book --</option>
                    {books.map((book) => (
                      <option
                        key={book._id}
                        value={book._id}
                        disabled={book.availableCopies <= 0}
                      >
                        {book.title} by {book.author} ({book.availableCopies} available)
                        {book.availableCopies <= 0 ? ' [OUT OF STOCK]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Selection */}
                <div className="mb-4">
                  <label className="form-label small fw-semibold">Select Student *</label>
                  <select
                    className="form-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.studentId || 'No ID'} • {student.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Loan Term Information */}
                <div className="bg-light p-3 rounded border mb-4">
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="text-muted small">Duration</div>
                      <div className="fw-bold">14 Days</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Due Date</div>
                      <div className="fw-bold text-dark">{defaultDueDate.toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-dark w-100 py-2 fw-semibold"
                  disabled={issuing || !selectedBookId || !selectedStudentId}
                >
                  {issuing ? (
                    <span><span className="spinner-border spinner-border-sm me-2"></span>Issuing Book...</span>
                  ) : (
                    <span><i className="bi bi-check-circle me-2"></i>Issue Book</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Selected Summary Card */}
        <div className="col-lg-5">
          <div className="card mb-4">
            <div className="card-header bg-light">
              <i className="bi bi-info-circle me-2"></i>Summary
            </div>
            <div className="card-body">
              {selectedBook ? (
                <div className="mb-3 pb-3 border-bottom">
                  <div className="small text-muted text-uppercase fw-semibold">Book:</div>
                  <div className="fw-bold">{selectedBook.title}</div>
                  <div className="small text-muted">Author: {selectedBook.author}</div>
                  <div className="small mt-1">
                    Available Copies:{' '}
                    <span className="badge bg-light text-dark border">{selectedBook.availableCopies}</span>
                  </div>
                </div>
              ) : (
                <div className="text-muted small mb-3 pb-3 border-bottom">
                  No book selected yet.
                </div>
              )}

              {selectedStudent ? (
                <div>
                  <div className="small text-muted text-uppercase fw-semibold">Student:</div>
                  <div className="fw-bold">{selectedStudent.name}</div>
                  <div className="small text-muted">ID: {selectedStudent.studentId || 'N/A'}</div>
                  <div className="small text-muted">Email: {selectedStudent.email}</div>
                  <div className="small text-muted">Phone: {selectedStudent.phone || 'N/A'}</div>
                </div>
              ) : (
                <div className="text-muted small">
                  No student selected yet.
                </div>
              )}
            </div>
          </div>

          {issuedRecord && (
            <div className="alert alert-secondary border">
              <h6 className="fw-bold mb-2"><i className="bi bi-check2-circle me-1"></i>Book Issued Successfully</h6>
              <div className="small">
                <strong>ID:</strong> {issuedRecord._id}<br />
                <strong>Book:</strong> {issuedRecord.book?.title}<br />
                <strong>Student:</strong> {issuedRecord.student?.name}<br />
                <strong>Due Date:</strong> {new Date(issuedRecord.dueDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueBookPage;

