const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Book = require('./models/Book');
const IssueRecord = require('./models/IssueRecord');
const Reservation = require('./models/Reservation');
const Review = require('./models/Review');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/library_management_system');
    console.log('MongoDB connected for seeding with Indian names and Indian Rupees (₹)...');

    // Clear existing data
    await User.deleteMany();
    await Book.deleteMany();
    await IssueRecord.deleteMany();
    await Reservation.deleteMany();
    await Review.deleteMany();
    console.log('Cleared existing records.');

    // 1. Create Default Users (Admin, Librarian, Students) with Indian names
    const admin = await User.create({
      name: 'Rajesh Sharma',
      email: 'admin@library.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 98765 00001',
      status: 'active'
    });

    const librarian = await User.create({
      name: 'Priya Sundaram',
      email: 'librarian@library.com',
      password: 'librarian123',
      role: 'librarian',
      phone: '+91 98765 00002',
      status: 'active'
    });

    const student1 = await User.create({
      name: 'Aarav Patel',
      email: 'student@library.com',
      password: 'student123',
      role: 'student',
      studentId: '2024-CSE-001',
      phone: '+91 98765 43210',
      status: 'active'
    });

    const student2 = await User.create({
      name: 'Ananya Iyer',
      email: 'ananya@library.com',
      password: 'student123',
      role: 'student',
      studentId: '2024-ECE-015',
      phone: '+91 98765 43211',
      status: 'active'
    });

    console.log('Seeded users: Admin, Librarian, 2 Students with Indian names.');

    // 2. Create Sample Books with popular Indian & Academic titles
    const sampleBooks = [
      {
        title: 'Wings of Fire: An Autobiography',
        author: 'Dr. A.P.J. Abdul Kalam & Arun Tiwari',
        isbn: '978-8173711466',
        category: 'Biography',
        description: 'An inspirational autobiography of former President Dr. A.P.J. Abdul Kalam detailing his journey from humble origins to spearheading Indian space research.',
        totalCopies: 6,
        availableCopies: 5
      },
      {
        title: 'Data Structures and Algorithms Made Easy',
        author: 'Narasimha Karumanchi',
        isbn: '978-8193245279',
        category: 'Computer Science',
        description: 'A comprehensive guide designed for computer science engineering students preparing for technical interviews and university examinations.',
        totalCopies: 5,
        availableCopies: 4
      },
      {
        title: 'Concepts of Physics (Part 1)',
        author: 'Dr. H.C. Verma',
        isbn: '978-8177091878',
        category: 'Science',
        description: 'The premier physics textbook in India, renowned for its conceptual clarity, solved examples, and numerical exercises.',
        totalCopies: 4,
        availableCopies: 4
      },
      {
        title: 'Higher Engineering Mathematics',
        author: 'Dr. B.S. Grewal',
        isbn: '978-8193328491',
        category: 'Mathematics',
        description: 'The standard reference textbook for Indian engineering colleges covering calculus, linear algebra, vector analysis, and differential equations.',
        totalCopies: 4,
        availableCopies: 4
      },
      {
        title: 'The Immortals of Meluha',
        author: 'Amish Tripathi',
        isbn: '978-9380658742',
        category: 'Fiction',
        description: 'First book of the Shiva Trilogy following the Tibetan immigrant Shiva in the kingdom of Meluha.',
        totalCopies: 5,
        availableCopies: 5
      },
      {
        title: 'India After Gandhi: The History of the World’s Largest Democracy',
        author: 'Ramachandra Guha',
        isbn: '978-9382618898',
        category: 'History',
        description: 'A magisterial history of independent India covering partition, constitution framing, wars, elections, and cultural movements.',
        totalCopies: 3,
        availableCopies: 3
      },
      {
        title: 'The White Tiger',
        author: 'Aravind Adiga',
        isbn: '978-8172238421',
        category: 'Literature',
        description: 'Man Booker Prize-winning novel chronicling the ascent of Balram Halwai from rural village poverty to an entrepreneur in Bangalore.',
        totalCopies: 5,
        availableCopies: 4
      },
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        category: 'Computer Science',
        description: 'Essential software engineering practices on readable syntax, meaningful naming, refactoring, and test-driven development.',
        totalCopies: 5,
        availableCopies: 4
      }
    ];

    const books = await Book.insertMany(sampleBooks);
    console.log(`Seeded ${books.length} sample books.`);

    // 3. Create Sample Issue Records
    // Active issue: Wings of Fire to Aarav Patel (due in 8 days)
    const activeDueDate = new Date();
    activeDueDate.setDate(activeDueDate.getDate() + 8);
    await IssueRecord.create({
      book: books[0]._id,
      student: student1._id,
      issuedBy: librarian._id,
      issueDate: new Date(),
      dueDate: activeDueDate,
      status: 'issued'
    });

    // Overdue issue: Data Structures to Aarav Patel (issued 20 days ago, due 6 days ago -> 6 days * ₹5 = ₹30 fine)
    const pastIssueDate = new Date();
    pastIssueDate.setDate(pastIssueDate.getDate() - 20);
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 6);
    await IssueRecord.create({
      book: books[1]._id,
      student: student1._id,
      issuedBy: librarian._id,
      issueDate: pastIssueDate,
      dueDate: pastDueDate,
      status: 'issued'
    });

    // Returned issue: The White Tiger to Aarav Patel (returned on time)
    const returnedIssueDate = new Date();
    returnedIssueDate.setDate(returnedIssueDate.getDate() - 25);
    const returnedDueDate = new Date();
    returnedDueDate.setDate(returnedDueDate.getDate() - 11);
    const returnedReturnDate = new Date();
    returnedReturnDate.setDate(returnedReturnDate.getDate() - 13);
    await IssueRecord.create({
      book: books[6]._id,
      student: student1._id,
      issuedBy: librarian._id,
      issueDate: returnedIssueDate,
      dueDate: returnedDueDate,
      returnDate: returnedReturnDate,
      status: 'returned',
      fineAmount: 0,
      finePaid: true,
      returnNotes: 'Returned in excellent condition'
    });

    // 4. Create Sample Review
    await Review.create({
      book: books[6]._id,
      student: student1._id,
      rating: 5,
      comment: 'An enthralling, razor-sharp novel about ambition and perseverance. Highly recommended for every university student.'
    });

    // 5. Create Sample Reservation
    await Reservation.create({
      book: books[0]._id,
      student: student2._id,
      status: 'pending',
      notes: 'Need this book for our engineering college seminar.'
    });

    console.log('Seeded sample issue records with ₹ fines, reviews, and reservations.');
    console.log('\n=======================================');
    console.log('ADMIN CREDENTIALS:');
    console.log('Email:    admin@library.com');
    console.log('Password: admin123');
    console.log('Name:     Rajesh Sharma');
    console.log('---------------------------------------');
    console.log('LIBRARIAN CREDENTIALS:');
    console.log('Email:    librarian@library.com');
    console.log('Password: librarian123');
    console.log('Name:     Priya Sundaram');
    console.log('---------------------------------------');
    console.log('STUDENT CREDENTIALS:');
    console.log('Email:    student@library.com');
    console.log('Password: student123');
    console.log('Name:     Aarav Patel');
    console.log('=======================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
