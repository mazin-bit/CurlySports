import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587');
const secure = process.env.SMTP_SECURE === 'true';
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS?.replace(/^["'](.+(?=["']$))["']$/, '$1'); // remove quotes if present
const from = process.env.SMTP_FROM;
const fromName = process.env.SMTP_FROM_NAME?.replace(/^["'](.+(?=["']$))["']$/, '$1');

async function testSMTP() {
  console.log('Testing SMTP connection with settings:');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`From: ${fromName} <${from}>`);

  if (!user || !pass) {
    console.error('Missing SMTP_USER or SMTP_PASS in .env file');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  try {
    console.log('\nVerifying transport connection...');
    await transporter.verify();
    console.log('SMTP connection successful!');

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: 'mazin@curlysports.com', // Sending to themselves for testing
      subject: 'CurlySports SMTP Test Email',
      text: 'Hello from CurlySports! If you are seeing this, your SMTP configuration is successfully working!',
      html: '<b>Hello from CurlySports!</b><br><br>If you are seeing this, your SMTP configuration is successfully working!',
    };

    console.log('\nSending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);

  } catch (error) {
    console.error('\nError testing SMTP:', error);
  }
}

testSMTP();
