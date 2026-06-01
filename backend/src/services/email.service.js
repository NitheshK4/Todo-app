const nodemailer = require('nodemailer');
const { decrypt } = require('./crypto.service');

let transporter = null;

/**
 * Lazily initialize and return the Nodemailer transporter.
 * If SMTP credentials in .env are placeholders, it automatically generates
 * and prints credentials for a temporary Ethereal test account.
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  const isPlaceholder =
    !process.env.SMTP_USER ||
    process.env.SMTP_USER.includes('your-email') ||
    process.env.SMTP_USER === 'placeholder';

  if (isPlaceholder) {
    console.log('📬 SMTP_USER is placeholder. Generating Ethereal test email account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`✉️  Ethereal SMTP User: ${testAccount.user}`);
    console.log(`✉️  Ethereal SMTP Pass: ${testAccount.pass}`);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

// Helper to decrypt task titles and descriptions
const decryptTask = (task) => {
  return {
    ...task,
    title: decrypt(task.title) || task.title,
    description: task.description ? decrypt(task.description) : '',
  };
};

// Priority styling helper
const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'urgent':
      return { border: '#fca5a5', bg: '#fee2e2', text: '#ef4444' };
    case 'high':
      return { border: '#ef4444', bg: '#fef2f2', text: '#ef4444' };
    case 'medium':
      return { border: '#f59e0b', bg: '#fef3c7', text: '#d97706' };
    default:
      return { border: '#10b981', bg: '#d1fae5', text: '#059669' };
  }
};

/**
 * Send consolidation of tasks due in less than 24 hours.
 */
const sendDueTaskReminder = async (userEmail, userName, tasks) => {
  const decryptedTasks = tasks.map(decryptTask);
  const client = await getTransporter();

  const taskListHTML = decryptedTasks
    .map((task) => {
      const styles = getPriorityStyles(task.priority);
      const dueDateStr = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'No due date';

      return `
      <div style="border-left: 4px solid ${styles.border}; padding: 12px; margin-bottom: 12px; background: rgba(255,255,255,0.02); border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <strong style="color: #f3f4f6; font-size: 1.05rem;">${task.title}</strong>
          <span style="font-size: 0.75rem; font-weight: bold; text-transform: uppercase; background: ${styles.bg}; color: ${styles.text}; padding: 2px 6px; border-radius: 4px; display: inline-block;">
            ${task.priority}
          </span>
        </div>
        ${task.description ? `<p style="color: #9ca3af; margin: 4px 0; font-size: 0.9rem;">${task.description}</p>` : ''}
        <div style="color: #6b7280; font-size: 0.8rem; margin-top: 4px;">
          📅 Due: <strong>${dueDateStr}</strong>
        </div>
      </div>`;
    })
    .join('');

  const html = `
  <div style="background-color: #0b0f19; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 20px; text-align: left; color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 1.5rem; font-weight: bold; color: #8b5cf6;">✦ TodoPro Enterprise</span>
      </div>
      <h2 style="color: #ffffff; margin-top: 0; font-size: 1.4rem;">Tasks Due Soon ⏰</h2>
      <p style="color: #9ca3af; line-height: 1.5;">Hi ${userName},</p>
      <p style="color: #9ca3af; line-height: 1.5;">The following tasks are due in the next 24 hours. Don't forget to complete them!</p>
      
      <div style="margin: 24px 0;">
        ${taskListHTML}
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:30001'}" 
           style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Open Dashboard
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #1f2937; margin: 32px 0;">
      <p style="color: #6b7280; font-size: 0.75rem; text-align: center; margin: 0;">
        You are receiving this because you enabled due-date reminders. 
        Manage your notification settings in your <a href="${process.env.FRONTEND_URL || 'http://localhost:30001'}" style="color: #8b5cf6; text-decoration: none;">Account Settings</a>.
      </p>
    </div>
  </div>`;

  const info = await client.sendMail({
    from: '"TodoPro Enterprise" <reminders@todopro.internal>',
    to: userEmail,
    subject: `🔔 Reminder: ${tasks.length} task${tasks.length !== 1 ? 's' : ''} due within 24 hours`,
    html,
  });

  console.log(`✉️  Due date reminder sent to ${userEmail}. Message ID: ${info.messageId}`);
  if (nodemailer.getTestMessageUrl(info)) {
    console.log(`🔗  Test Email Link: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
};

/**
 * Send daily productivity digest email containing all pending and active tasks.
 */
const sendDailyDigest = async (userEmail, userName, tasks) => {
  const decryptedTasks = tasks.map(decryptTask);
  const client = await getTransporter();

  const activeTasks = decryptedTasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
  const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const upcomingTasks = activeTasks.filter(t => !t.dueDate || new Date(t.dueDate) >= new Date());

  const overdueHTML = overdueTasks.length === 0 
    ? '' 
    : `
    <h3 style="color: #ef4444; margin-top: 20px; font-size: 1.1rem; border-bottom: 1px solid rgba(239, 68, 68, 0.2); padding-bottom: 4px;">⚠️ Overdue</h3>
    ${overdueTasks.map(task => `
      <div style="padding: 8px 12px; margin-bottom: 8px; background: rgba(239, 68, 68, 0.05); border-left: 3px solid #ef4444; border-radius: 4px;">
        <strong style="color: #fca5a5;">${task.title}</strong>
        <span style="font-size: 0.7rem; float: right; color: #fca5a5; font-weight: bold; text-transform: uppercase;">${task.priority}</span>
        ${task.description ? `<div style="font-size: 0.85rem; color: #9ca3af; margin-top: 2px;">${task.description}</div>` : ''}
      </div>`).join('')}`;

  const upcomingHTML = upcomingTasks.length === 0
    ? '<p style="color: #9ca3af; font-style: italic;">No active tasks today! You are all caught up. 🎉</p>'
    : `
    <h3 style="color: #8b5cf6; margin-top: 20px; font-size: 1.1rem; border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 4px;">📋 Pending Tasks</h3>
    ${upcomingTasks.map(task => {
      const styles = getPriorityStyles(task.priority);
      return `
      <div style="padding: 8px 12px; margin-bottom: 8px; background: rgba(255,255,255,0.02); border-left: 3px solid ${styles.border}; border-radius: 4px;">
        <strong style="color: #f3f4f6;">${task.title}</strong>
        <span style="font-size: 0.7rem; float: right; background: ${styles.bg}; color: ${styles.text}; padding: 1px 4px; border-radius: 2px; font-weight: bold; text-transform: uppercase;">${task.priority}</span>
        ${task.description ? `<div style="font-size: 0.85rem; color: #9ca3af; margin-top: 2px;">${task.description}</div>` : ''}
      </div>`;
    }).join('')}`;

  const html = `
  <div style="background-color: #0b0f19; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 20px; text-align: left; color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 1.5rem; font-weight: bold; color: #8b5cf6;">✦ TodoPro Enterprise</span>
      </div>
      <h2 style="color: #ffffff; margin-top: 0; font-size: 1.4rem;">Your Daily Task Digest 🚀</h2>
      <p style="color: #9ca3af; line-height: 1.5;">Hi ${userName},</p>
      <p style="color: #9ca3af; line-height: 1.5;">Here is your productivity brief for today. You have <strong>${activeTasks.length} active</strong> task${activeTasks.length !== 1 ? 's' : ''} in total.</p>
      
      <div style="margin: 24px 0;">
        ${overdueHTML}
        ${upcomingHTML}
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:30001'}" 
           style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Open Dashboard
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #1f2937; margin: 32px 0;">
      <p style="color: #6b7280; font-size: 0.75rem; text-align: center; margin: 0;">
        You are receiving this because you enabled the daily digest. 
        Manage your preferences in your <a href="${process.env.FRONTEND_URL || 'http://localhost:30001'}" style="color: #8b5cf6; text-decoration: none;">Account Settings</a>.
      </p>
    </div>
  </div>`;

  const info = await client.sendMail({
    from: '"TodoPro Enterprise" <digest@todopro.internal>',
    to: userEmail,
    subject: `🌅 Daily Productivity Brief: ${activeTasks.length} pending tasks`,
    html,
  });

  console.log(`✉️  Daily digest sent to ${userEmail}. Message ID: ${info.messageId}`);
  if (nodemailer.getTestMessageUrl(info)) {
    console.log(`🔗  Test Email Link: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
};

module.exports = { sendDueTaskReminder, sendDailyDigest };
