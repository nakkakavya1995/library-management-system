const nodemailer = require('nodemailer');

let transporterInstance = null;

const getTransporter = async () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  let user = (process.env.EMAIL_USER || '').trim();
  if (!user || user.includes('your_') || !user.includes('@')) {
    user = 'nakkakavya801@gmail.com';
  }

  let pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
  if (!pass || pass.includes('your_') || pass.length !== 16) {
    pass = 'yrijmlhwjrgwgqri';
  }

  try {
    transporterInstance = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    console.log(`[Email Service] Configured live Gmail SMTP for: ${user}`);
    return transporterInstance;
  } catch (err) {
    console.error('[Email Service] Error initializing Gmail transporter:', err.message);
    return null;
  }
};

const getSender = () => {
  let user = (process.env.EMAIL_USER || '').trim();
  if (!user || user.includes('your_') || !user.includes('@')) {
    user = 'nakkakavya801@gmail.com';
  }
  return `"Library Management System" <${user}>`;
};

// Route emails to registered recipient AND primary administrator inbox so all notifications are received
const resolveRecipients = (email) => {
  const defaultAdmin = 'nakkakavya801@gmail.com';
  const recipients = new Set();

  if (email && email.trim() && email.includes('@')) {
    const clean = email.trim().toLowerCase();
    recipients.add(clean);
  }

  // Always ensure registered admin/developer inbox receives a copy
  recipients.add(defaultAdmin);

  return Array.from(recipients).join(', ');
};
const resolveRecipient = resolveRecipients;

/**
 * Dispatch email via HTTPS Relay (Port 443 - works on Render Free Tier) or direct SMTP (Port 465)
 */
const dispatchEmail = async ({ to, subject, text, html }) => {
  const relayUrl = (process.env.GMAIL_RELAY_URL || process.env.GOOGLE_SCRIPT_URL || '').trim();

  // 1. Try HTTPS Relay first if configured (Bypasses Render Free Tier outbound SMTP port restrictions)
  if (relayUrl && relayUrl.startsWith('http')) {
    try {
      const response = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, text, html }),
        redirect: 'follow'
      });
      const textResponse = await response.text();
      let data = {};
      try {
        data = JSON.parse(textResponse);
      } catch (parseErr) {
        data = { raw: textResponse };
      }
      console.log(`[Email Service] Delivered via HTTPS Relay to ${to}`);
      return { success: true, via: 'https_relay', data };
    } catch (relayErr) {
      console.error('[Email Service] HTTPS Relay error, trying direct SMTP:', relayErr.message);
    }
  }

  // 2. Direct Nodemailer SMTP
  const transporter = await getTransporter();
  if (!transporter) {
    return { success: false, error: 'No email transport configured' };
  }

  const info = await transporter.sendMail({
    from: getSender(),
    to,
    subject,
    text,
    html
  });

  console.log(`[Email Service] Delivered via SMTP to ${to} (MessageId: ${info.messageId})`);
  return { success: true, via: 'smtp', messageId: info.messageId };
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

    const result = await dispatchEmail({
      to: resolveRecipients(userEmail),
      subject,
      text,
      html
    });

    return result;
  } catch (error) {
    console.error(`[Email] Failed to send login alert to ${userEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send overdue late fine notification email
 */
const sendOverdueFineEmail = async ({
  studentName,
  studentEmail,
  bookTitle,
  bookAuthor,
  bookIsbn,
  dueDate,
  overdueDays,
  fineAmount,
  customMessage
}) => {
  try {
    if (!studentEmail) return { success: false, reason: 'No email provided' };

    const transporter = await getTransporter();
    const formattedDueDate = dueDate
      ? new Date(dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Past Due';

    const subject = `Late Fine Notification: "${bookTitle}" Exceeded Due Date`;
    const text = `Dear ${studentName || 'Student'},

This is an urgent notification from the Central Library. Your borrowed book "${bookTitle}" has exceeded its return due date and is currently overdue.

Overdue & Late Fine Details:
• Book Title: ${bookTitle}${bookAuthor ? `\n• Author: ${bookAuthor}` : ''}${bookIsbn ? `\n• ISBN: ${bookIsbn}` : ''}
• Return Due Date: ${formattedDueDate}
• Days Overdue: ${overdueDays} day(s)
• Late Fine Rate: ₹5.00 per day
• Total Accumulated Fine: ₹${fineAmount}
• Status: Overdue (Late Return Penalty Active)

${customMessage ? `Librarian Note: ${customMessage}\n\n` : ''}Please return this book to the library circulation desk immediately to avoid incurring additional daily late fines.

If you have already returned this book today, please contact the librarian to update your account records.

Thank you,
Central Library Management System`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background: #111827; padding: 22px 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">Central Library Management</h2>
          <p style="margin: 6px 0 0; font-size: 13px; color: #f87171; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Late Fine &amp; Overdue Alert</p>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${studentName || 'Student'}</strong>,</p>
          <p style="font-size: 15px; color: #111827;">
            This is an urgent notification regarding your borrowed book. The loan period for <strong>"${bookTitle}"</strong> has expired and exceeded its return due date.
          </p>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 12px; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #991b1b; letter-spacing: 0.5px;">Overdue &amp; Late Fine Breakdown:</p>
            <p style="margin: 6px 0; color: #111827;"><strong>Book Title:</strong> ${bookTitle}</p>
            ${bookAuthor ? `<p style="margin: 6px 0; color: #111827;"><strong>Author:</strong> ${bookAuthor}</p>` : ''}
            <p style="margin: 6px 0; color: #111827;"><strong>Return Due Date:</strong> ${formattedDueDate}</p>
            <p style="margin: 6px 0; color: #dc2626;"><strong>Days Overdue:</strong> ${overdueDays} day(s)</p>
            <p style="margin: 6px 0; color: #111827;"><strong>Daily Fine Rate:</strong> ₹5.00 / day</p>
            <p style="margin: 6px 0; font-size: 16px; color: #b91c1c;"><strong>Total Accumulated Late Fine:</strong> ₹${fineAmount}</p>
            <p style="margin: 6px 0; color: #dc2626;"><strong>Status:</strong> Immediate Return Required</p>
          </div>

          ${
            customMessage
              ? `<div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                   <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Librarian Note:</strong> ${customMessage}</p>
                 </div>`
              : ''
          }

          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 14px 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
              <strong>Action Required:</strong> Please return this physical copy to the library circulation desk immediately to stop further late penalties from accumulating. If you have already returned the book, please contact the librarian to clear your account.
            </p>
          </div>

          <p style="margin: 24px 0 4px;">Thank you for your cooperation,</p>
          <p style="margin: 0; font-weight: bold; color: #111827;">Central Library Management System</p>
        </div>
      </div>
    `;

    return await dispatchEmail({
      to: resolveRecipients(studentEmail),
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('[Email] Failed to send overdue fine email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send due date approaching reminder email (when book may exceed due date soon)
 */
const sendDueDateReminderEmail = async ({
  studentName,
  studentEmail,
  bookTitle,
  bookAuthor,
  dueDate,
  hoursRemaining
}) => {
  try {
    if (!studentEmail) return { success: false, reason: 'No email provided' };

    const transporter = await getTransporter();
    const formattedDueDate = dueDate
      ? new Date(dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Soon';

    const subject = `Due Date Reminder: "${bookTitle}" is Due Soon - Central Library`;
    const text = `Dear ${studentName || 'Student'},

This is a reminder that your borrowed book "${bookTitle}" is due for return on ${formattedDueDate}.

Please return the book to the library or request a renewal through your student dashboard before the due date to avoid late return fines (₹5.00/day).

Thank you,
Central Library Management System`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background: #111827; padding: 22px 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">Central Library Management</h2>
          <p style="margin: 6px 0 0; font-size: 13px; color: #f59e0b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Upcoming Due Date Reminder</p>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${studentName || 'Student'}</strong>,</p>
          <p style="font-size: 15px; color: #111827;">
            This is a friendly reminder that your borrowed book <strong>"${bookTitle}"</strong> is approaching its return due date.
          </p>

          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #b45309; letter-spacing: 0.5px;">Borrowing Summary:</p>
            <p style="margin: 6px 0; color: #111827;"><strong>Book Title:</strong> ${bookTitle}</p>
            ${bookAuthor ? `<p style="margin: 6px 0; color: #111827;"><strong>Author:</strong> ${bookAuthor}</p>` : ''}
            <p style="margin: 6px 0; color: #111827;"><strong>Return Due Date:</strong> ${formattedDueDate}</p>
            <p style="margin: 6px 0; color: #92400e;"><strong>Time Remaining:</strong> ~${hoursRemaining} hour(s)</p>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5;">
              To prevent late return penalty fines (₹5.00 / day), please return this book on time to the library or submit a renewal request in your student dashboard.
            </p>
          </div>

          <p style="margin: 24px 0 4px;">Thank you,</p>
          <p style="margin: 0; font-weight: bold; color: #111827;">Central Library Management System</p>
        </div>
      </div>
    `;

    return await dispatchEmail({
      to: resolveRecipients(studentEmail),
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('[Email] Failed to send due date reminder:', error.message);
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

    return await dispatchEmail({
      to: resolveRecipients(studentEmail),
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('[Email] Failed to send reservation email:', error.message);
    return { success: false, error: error.message };
  }
};

const sendReservationApprovedEmail = async ({ studentName, studentEmail, bookTitle, bookAuthor, dueDate }) => {
  try {
    if (!studentEmail) return { success: false, reason: 'No email provided' };

    const transporter = await getTransporter();
    const formattedDueDate = dueDate
      ? new Date(dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

    const subject = `Reserved Book is Accepted - You Can Borrow: "${bookTitle}"`;
    const text = `Dear ${studentName || 'Student'},

Your reserved book "${bookTitle}" has been accepted by the librarian. You can borrow this book!

Reservation Details:
• Book Title: ${bookTitle}${bookAuthor ? `\n• Author: ${bookAuthor}` : ''}
• Status: Reserved book is accepted (You can borrow)
• Borrowing Duration: 14 Days
• Return Due Date: ${formattedDueDate}

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
            <p style="margin: 0 0 10px; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #4b5563; letter-spacing: 0.5px;">Reservation &amp; Loan Details:</p>
            <p style="margin: 6px 0;"><strong>Book Title:</strong> ${bookTitle}</p>
            ${bookAuthor ? `<p style="margin: 6px 0;"><strong>Author:</strong> ${bookAuthor}</p>` : ''}
            <p style="margin: 6px 0;"><strong>Status:</strong> Reserved book is accepted (You can borrow)</p>
            <p style="margin: 6px 0;"><strong>Borrowing Duration:</strong> 14 Days</p>
            <p style="margin: 6px 0; color: #b45309;"><strong>Return Due Date:</strong> <strong>${formattedDueDate}</strong></p>
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

    return await dispatchEmail({
      to: resolveRecipients(studentEmail),
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('[Email] Failed to send acceptance email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email when a user registers a new account
 */
const sendRegistrationWelcomeEmail = async ({ userName, userEmail, role, studentId }) => {
  try {
    if (!userEmail) return { success: false, reason: 'No email provided' };

    const transporter = await getTransporter();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const formattedRole = role
      ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
      : 'Student';

    const subject = 'Welcome to Library Management System - Registration Successful';

    const text = `Hello ${userName || 'User'},

Welcome to the Library Management System! Your account has been registered successfully.

Registration Details:
- User Name: ${userName || 'User'}
- Registered Email: ${userEmail}
- Role: ${formattedRole}
${studentId ? `- Student ID: ${studentId}\n` : ''}- Registration Date: ${formattedDate} at ${formattedTime}

You can now log in to the library portal to browse our book catalog, reserve books, and manage borrowings.

Thank you,
Library Management System Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
        <div style="background-color: #111827; color: #ffffff; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px; font-weight: bold;">Welcome to Library Management System</h2>
          <p style="margin: 6px 0 0; font-size: 14px; color: #10b981;">Account Registration Successful</p>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${userName || 'User'}</strong>,</p>
          <p style="font-size: 15px; color: #111827;">
            <strong>Welcome to the Library Management System!</strong> Your student account has been registered successfully.
          </p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 12px; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #4b5563; letter-spacing: 0.5px;">Registered Account Details:</p>
            <p style="margin: 6px 0;"><strong>User Name:</strong> ${userName || 'User'}</p>
            <p style="margin: 6px 0;"><strong>Registered Email:</strong> ${userEmail}</p>
            <p style="margin: 6px 0;"><strong>Role:</strong> ${formattedRole}</p>
            ${studentId ? `<p style="margin: 6px 0;"><strong>Student ID:</strong> ${studentId}</p>` : ''}
            <p style="margin: 6px 0;"><strong>Registration Date:</strong> ${formattedDate} at ${formattedTime}</p>
          </div>

          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #065f46;">
              You can now browse the catalog, reserve books, and manage your borrowings online.
            </p>
          </div>

          <p style="margin: 24px 0 4px;">Thank you,</p>
          <p style="margin: 0; font-weight: bold; color: #111827;">Library Management System Team</p>
        </div>
      </div>
    `;

    return await dispatchEmail({
      to: resolveRecipients(userEmail),
      subject,
      text,
      html
    });
  } catch (error) {
    console.error(`[Email] Failed to send registration email to ${userEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendRenewalDecisionEmail = async ({
  studentName,
  studentEmail,
  bookTitle,
  action,
  extensionDays = 14,
  newDueDate,
  currentDueDate
}) => {
  try {
    if (!studentEmail) return { success: false, reason: 'No email provided' };

    const isApproved = action === 'approve';
    const formattedDueDate = newDueDate
      ? new Date(newDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const formattedCurrentDue = currentDueDate
      ? new Date(currentDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    const subject = isApproved
      ? `Renewal Request Approved: "${bookTitle}" (+${extensionDays} days)`
      : `Renewal Request Update: "${bookTitle}"`;

    const text = isApproved
      ? `Dear ${studentName || 'Student'},\n\nYour renewal request for "${bookTitle}" has been APPROVED by the librarian.\nExtension Granted: ${extensionDays} days\nNew Return Due Date: ${formattedDueDate}\n\nThank you,\nLibrary Management System`
      : `Dear ${studentName || 'Student'},\n\nYour renewal request for "${bookTitle}" was not approved at this time.\nCurrent Due Date: ${formattedCurrentDue}\nPlease return the book on time to avoid overdue fines.\n\nThank you,\nLibrary Management System`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background: #111827; padding: 20px 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Library Management System</h2>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${studentName || 'Student'}</strong>,</p>
          <div style="background: ${isApproved ? '#ecfdf5' : '#fef2f2'}; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0; font-size: 15px; font-weight: bold; color: ${isApproved ? '#065f46' : '#991b1b'};">
              ${isApproved ? `Renewal Request Approved (+${extensionDays} Days)` : 'Renewal Request Not Approved'}
            </p>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #4b5563;">Book Loan Details:</p>
            <p style="margin: 6px 0;"><strong>Book Title:</strong> ${bookTitle}</p>
            <p style="margin: 6px 0;"><strong>Student Name:</strong> ${studentName || 'Student'}</p>
            ${isApproved ? `<p style="margin: 6px 0;"><strong>Extension Period:</strong> ${extensionDays} days</p>` : ''}
            <p style="margin: 6px 0; color: ${isApproved ? '#059669' : '#b45309'};">
              <strong>${isApproved ? 'New Due Date:' : 'Current Due Date:'}</strong> <strong>${isApproved ? formattedDueDate : formattedCurrentDue}</strong>
            </p>
          </div>

          <p style="color: #4b5563; font-size: 14px;">
            ${isApproved
              ? 'Your borrowed book due date has been updated in your student dashboard.'
              : 'Please return the book to the library before the due date to prevent overdue fines.'}
          </p>

          <p style="margin: 24px 0 4px;">Thank you,</p>
          <p style="margin: 0; font-weight: bold; color: #111827;">Library Management System</p>
        </div>
      </div>
    `;

    return await dispatchEmail({
      to: resolveRecipients(studentEmail),
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('[Email] Failed to send renewal decision email:', error.message);
    return { success: false, error: error.message };
  }
};

const sendReturnAcceptedEmail = async ({ studentName, studentEmail, bookTitle }) => {
  try {
    if (!studentEmail) return { success: false, reason: 'No email provided' };

    const subject = `Book Return Accepted & Restocked: "${bookTitle}"`;
    const text = `Dear ${studentName || 'Student'},\n\nYour return for "${bookTitle}" has been accepted by the librarian. The book is restocked and your active loan count has been updated.\n\nYou can now borrow another book from the library catalog.\n\nThank you,\nLibrary Management System`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background: #111827; padding: 20px 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Library Management System</h2>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${studentName || 'Student'}</strong>,</p>
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0; font-size: 15px; font-weight: bold; color: #065f46;">
              Return Accepted &amp; Restocked
            </p>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-weight: bold; font-size: 13px; text-transform: uppercase; color: #4b5563;">Return Details:</p>
            <p style="margin: 6px 0;"><strong>Book Title:</strong> ${bookTitle}</p>
            <p style="margin: 6px 0;"><strong>Student Name:</strong> ${studentName || 'Student'}</p>
            <p style="margin: 6px 0; color: #059669;"><strong>Status:</strong> Returned &amp; Completed</p>
          </div>

          <p style="color: #4b5563; font-size: 14px;">
            Your active loan slot is now freed up. You can browse the book catalog and borrow another book anytime.
          </p>

          <p style="margin: 24px 0 4px;">Thank you,</p>
          <p style="margin: 0; font-weight: bold; color: #111827;">Library Management System</p>
        </div>
      </div>
    `;

    return await dispatchEmail({
      to: resolveRecipients(studentEmail),
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('[Email] Failed to send return accepted email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getTransporter,
  sendLoginAlertEmail,
  sendRegistrationWelcomeEmail,
  sendOverdueFineEmail,
  sendDueDateReminderEmail,
  sendBookAvailableEmail,
  sendReservationApprovedEmail,
  sendRenewalDecisionEmail,
  sendReturnAcceptedEmail
};
