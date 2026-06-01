require('dotenv').config();
const { sendDueTaskReminder, sendDailyDigest } = require('./email.service');
const { encrypt } = require('./crypto.service');

const runTest = async () => {
  console.log('🧪 Starting email service end-to-end test...');

  // Mock encrypted tasks (since they are decrypted in email.service using crypto.service)
  const mockTasks = [
    {
      id: 'task-1',
      title: encrypt('Submit Q2 Financial Reports'),
      description: encrypt('Consolidate Razorpay transaction logs, update analytics dashboards, and email to stakeholders.'),
      priority: 'urgent',
      dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      status: 'in_progress',
    },
    {
      id: 'task-2',
      title: encrypt('Renew Kubernetes SSL Certificates'),
      description: encrypt('Certbot cert renewal, update secrets.yaml, and reload nginx deployments.'),
      priority: 'high',
      dueDate: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
      status: 'pending',
    },
    {
      id: 'task-3',
      title: encrypt('Database Cleanup and Index Optimization'),
      description: null,
      priority: 'medium',
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours (not in 24h reminder, but in daily digest)
      status: 'pending',
    },
  ];

  const testEmail = 'nithesh@example.com';
  const testName = 'Nithesh Kumar';

  try {
    console.log('\n1️⃣  Testing Due Task Reminders (Tasks due in < 24h)...');
    const tasksDueSoon = mockTasks.filter(t => {
      const hoursLeft = (new Date(t.dueDate) - new Date()) / (1000 * 60 * 60);
      return hoursLeft > 0 && hoursLeft <= 24;
    });

    const reminderInfo = await sendDueTaskReminder(testEmail, testName, tasksDueSoon);
    console.log('✅ Due task reminder test passed.');

    console.log('\n2️⃣  Testing Daily Productivity Digest...');
    const digestInfo = await sendDailyDigest(testEmail, testName, mockTasks);
    console.log('✅ Daily digest test passed.');

    console.log('\n🎉 All email service tests completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Email test failed:', err.message);
    process.exit(1);
  }
};

runTest();
