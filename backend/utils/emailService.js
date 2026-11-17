const nodemailer = require('nodemailer');

let transporterInstance = null;

const getTransporter = async () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  const isRealGmail =
    user &&
    pass &&
    user !== 'your_email@gmail.com' &&
    pass !== 'your_app_password';

  if (isRealGmail) {
    transporterInstance = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
    console.log(`[Email Service] Configured live Gmail SMTP for: ${user}`);
    return transporterInstance;
  }

  // Fallback for development testing
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporterInstance = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return transporterInstance;
  } catch (err) {
    transporterInstance = {
      sendMail: async (opts) => {
        console.log(`[Email] Mock email to ${opts.to}: ${opts.subject}`);
        return { messageId: `mock-${Date.now()}` };
      }
    };
    return transporterInstance;
  }
};

const getSender = () => {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  return `"Library Management System" <${user || 'no-reply@library.com'}>`;
};

/**
 * Send automatic login alert email
 */
const sendLoginAlertEmail = async ({ userName, userEmail, role, loginDate, loginTime }) => {
  try {
    if (!userEmail) return { success: false, reason: 'No email provided' };

    const transporter = await getTransporter();

    const now = new Date();
    const formattedDate =
      loginDate ||
      now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    const formattedTime =
      loginTime ||
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

    const formattedRole = role
      ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
      : 'Student';

    const subject = 'Welcome to Library Management System';

    const text = `Hello ${userName || 'User'},

Welcome to the Library Management System! You have successfully logged into the website.

Login Details:
- User Name: ${userName || 'User'}
- Registered Email: ${userEmail}
- Role: ${formattedRole}
- Login Date: ${formattedDate}
- Login Time: ${formattedTime}

We are glad to have you with us. If this login was not performed by you, please contact the library administrator immediately.

Thank you,
Library Management System Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
        <div style="background-color: #111827; color: #ffffff; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px; font-weight: bold;">Welcome to Library Management System</h2>
          <p style="margin: 6px 0 0; font-size: 14px; color: #9ca3af;">Login Confirmation &amp; Account Alert</p>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${userName || 'User'}</strong>,</p>
          <p style="font-size: 15px; color: #111827;">
            <strong>Welcome to the Library Management System!</strong> You have successfully logged into the website.
          </p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 12px; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #4b5563; letter-spacing: 0.5px;">Login Details:</p>
            <p style="margin: 6px 0;"><strong>User Name:</strong> ${userName || 'User'}</p>
            <p style="margin: 6px 0;"><strong>Registered Email:</strong> ${userEmail}</p>
            <p style="margin: 6px 0;"><strong>Role:</strong> ${formattedRole}</p>
            <p style="margin: 6px 0;"><strong>Login Date:</strong> ${formattedDate}</p>
            <p style="margin: 6px 0;"><strong>Login Time:</strong> ${formattedTime}</p>
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              If this login was not performed by you, please contact the library administrator immediately.
            </p>
          </div>

          <p style="margin: 24px 0 4px;">Thank you,</p>
          <p style="margin: 0; font-weight: bold; color: #111827;">Library Management System Team</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: getSender(),
      to: userEmail,
      subject,
      text,
      html
    });

    console.log(`[Email] Login alert sent to ${userEmail}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Preview URL: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email] Failed to send login alert to ${userEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send overdue fine notification email
 */
const sendOverdueFineEmail = async ({
  studentName,
  studentEmail,
  bookTitle,
  overdueDays,
  fineAmount
}) => {
  try {
    if (!studentEmail) return { success: false, reason: 'No email provided' };

    const transporter = await getTransporter();
    const subject = `Overdue Notice: "${bookTitle}" - Library`;
    const text = `Dear ${studentName || 'Student'},

The book "${bookTitle}" borrowed by you is ${overdueDays} days overdue. Current fine is ₹${fineAmount}.

Please return the book to the library as soon as possible.

Thank you,
Library Management System`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
        <h3 style="color: #dc2626; margin-top: 0;">Overdue Book Notice</h3>
        <p>Dear <strong>${studentName || 'Student'}</strong>,</p>
        <p>The book <strong>"${bookTitle}"</strong> borrowed by you is <strong>${overdueDays} days overdue</strong>.</p>
        <p>Current Fine: <strong>₹${fineAmount}</strong></p>
        <p>Please return the book to the library desk as soon as possible.</p>
        <p>Thank you,<br/>Library Management System</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: getSender(),
      to: studentEmail,
      subject,
      text,
      html
    });

    console.log(`[Email] Overdue notice sent to ${studentEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send overdue email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send reservation notification when book becomes available
 */
const sendBookAvailableEmail = async ({ studentName, studentEmail, bookTitle }) => {
  try {
    if (!studentEmail) return { success: false, reason: 'No email provided' };

    const transporter = await getTransporter();
    const subject = `Reserved Book Available: "${bookTitle}"`;
    const text = `Dear ${studentName || 'Student'},

Your reserved book "${bookTitle}" is now available at the library. Please collect it within 48 hours.

Thank you,
Library Management System`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
        <h3 style="color: #2563eb; margin-top: 0;">Reserved Book Ready for Pickup</h3>
        <p>Dear <strong>${studentName || 'Student'}</strong>,</p>
        <p>Your reserved book <strong>"${bookTitle}"</strong> is now ready for pickup at the library desk.</p>
        <p>Please collect it within 48 hours.</p>
        <p>Thank you,<br/>Library Management System</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: getSender(),
      to: studentEmail,
      subject,
      text,
      html
    });

    console.log(`[Email] Reservation notice sent to ${studentEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send reservation email:', error.message);
    return { success: false, error: error.message };
  }
};

const sendReservationApprovedEmail = async ({ studentName, studentEmail, bookTitle, bookAuthor }) => {
  try {
    if (!studentEmail) return { success: false, reason: 'No email provided' };

    const transporter = await getTransporter();
    const subject = `Reserved Book is Accepted - You Can Borrow: "${bookTitle}"`;
    const text = `Dear ${studentName || 'Student'},

Your reserved book "${bookTitle}" has been accepted by the librarian. You can borrow this book!

Reservation Details:
• Book Title: ${bookTitle}${bookAuthor ? `\n• Author: ${bookAuthor}` : ''}
• Status: Reserved book is accepted (You can borrow)
• Borrowing Duration: 14 Days

The book is now active under your "Borrowed Books" section in the student dashboard. Please visit the library circulation desk to collect your physical copy.

Thank you,
Central Library Management System`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background: #111827; padding: 20px 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">Central Library Management</h2>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${studentName || 'Student'}</strong>,</p>
          <p style="font-size: 15px; color: #111827;">
            Your reserved book <strong>"${bookTitle}"</strong> has been accepted by the librarian. <strong>You can borrow this book!</strong>
          </p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #4b5563; letter-spacing: 0.5px;">Reservation & Loan Details:</p>
            <p style="margin: 6px 0;"><strong>Book Title:</strong> ${bookTitle}</p>
            ${bookAuthor ? `<p style="margin: 6px 0;"><strong>Author:</strong> ${bookAuthor}</p>` : ''}
            <p style="margin: 6px 0;"><strong>Status:</strong> Reserved book is accepted (You can borrow)</p>
            <p style="margin: 6px 0;"><strong>Borrowing Duration:</strong> 14 Days</p>
            <p style="margin: 6px 0;"><strong>Registered Email:</strong> ${studentEmail}</p>
          </div>

          <p style="color: #374151;">
            This book is now active under your <strong>Borrowed Books</strong> section. Please visit the library circulation desk to collect your copy.
          </p>

          <p style="margin: 24px 0 4px;">Thank you,</p>
          <p style="margin: 0; font-weight: bold; color: #111827;">Central Library Management System</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: getSender(),
      to: studentEmail,
      subject,
      text,
      html
    });

    console.log(`[Email] "Reserved book is accepted you can borrow" sent to ${studentEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send acceptance email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getTransporter,
  sendLoginAlertEmail,
  sendOverdueFineEmail,
  sendBookAvailableEmail,
  sendReservationApprovedEmail
};
