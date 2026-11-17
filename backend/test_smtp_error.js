const nodemailer = require('nodemailer');
require('dotenv').config();


async function triggerSmtpConnectionError() {
  console.log('=');
  console.log('SMTP MAIL SERVER CONNECTION TEST');
  console.log('=\n');

  console.log('[1/3] Attempting TCP socket handshake with SMTP host...');
  console.log('Host: 127.0.0.1 (Local SMTP Relay)');
  console.log('Port: 587');
  console.log('Encryption: STARTTLS\n');

  const transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: 587,
    secure: false,
    connectionTimeout: 3000,
    auth: {
      user: process.env.EMAIL_USER || 'admin@library.com',
      pass: process.env.EMAIL_PASS || 'dummy_secret_pass'
    }
  });

  try {
    console.log('[2/3] Sending EHLO greeting command...');
    await transporter.verify();
    console.log('[3/3] Connected successfully.');
  } catch (error) {
    console.log('[3/3] Handshake failed!\n');
    console.error('-');
    console.error('ERROR: SMTP SERVER NOT CONNECTING (CONNECTION REFUSED)');
    console.error('-');
    console.error(`Message     : ${error.message}`);
    console.error(`Error Code  : ${error.originalCode || error.code || 'ECONNREFUSED'}`);
    console.error(`Syscall     : ${error.syscall || 'connect'}`);
    console.error(`Target Host : ${error.address || '127.0.0.1'}:${error.port || 587}`);
    console.error(`Command     : ${error.command || 'CONN'}`);
    console.error('-');
    console.error('Full Stack Trace:');
    console.error(error.stack);
    console.error('\n');

    console.log('Diagnostic Summary:');
    console.log('• The mail client cannot establish a socket connection on port 587.');
    console.log('• Cause: No SMTP daemon running locally or target mail server is unreachable.');
    console.log('• Recommendation: Use live Gmail SMTP (smtp.gmail.com) with a Google App Password.');
  }
}

triggerSmtpConnectionError();
