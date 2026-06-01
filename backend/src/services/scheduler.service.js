const cron = require('node-cron');
const { Op } = require('sequelize');
const { User, Todo } = require('../models');
const { sendDueTaskReminder, sendDailyDigest } = require('./email.service');
const redis = require('../config/redis');

/**
 * Scan database for tasks due in less than 24 hours
 * and send consolidated reminders to users.
 */
const runDueRemindersCheck = async () => {
  console.log('⏰ Starting due tasks reminder scan...');
  try {
    const now = new Date();
    const target = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Find users who have reminders enabled and have pending/in-progress tasks due in the next 24 hours
    const users = await User.findAll({
      where: { emailRemindersEnabled: true },
      include: [
        {
          model: Todo,
          as: 'todos',
          where: {
            status: { [Op.notIn]: ['completed', 'archived'] },
            dueDate: {
              [Op.and]: [{ [Op.gt]: now }, { [Op.lte]: target }],
            },
          },
        },
      ],
    });

    console.log(`⏰ Found ${users.length} users with tasks due in the next 24 hours.`);

    for (const user of users) {
      const unsentTasks = [];
      
      for (const todo of user.todos) {
        const cacheKey = `reminder_sent:${todo.id}`;
        const alreadySent = await redis.get(cacheKey);
        if (!alreadySent) {
          unsentTasks.push(todo);
        }
      }

      if (unsentTasks.length > 0) {
        try {
          await sendDueTaskReminder(user.email, user.name, unsentTasks);
          
          // Prevent sending another reminder for these tasks for 24 hours
          for (const todo of unsentTasks) {
            await redis.setex(`reminder_sent:${todo.id}`, 24 * 60 * 60, '1');
          }
        } catch (mailErr) {
          console.error(`❌ Failed to send reminder email to ${user.email}:`, mailErr.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error running due tasks reminder scan:', err.message);
  }
};

/**
 * Scan database and send a daily summary digest of all pending/in-progress tasks to users.
 */
const runDailyDigestCheck = async () => {
  console.log('🌅 Starting daily productivity digest run...');
  try {
    // Find users who have daily digest enabled and have active tasks
    const users = await User.findAll({
      where: { dailyDigestEnabled: true },
      include: [
        {
          model: Todo,
          as: 'todos',
          where: {
            status: { [Op.notIn]: ['completed', 'archived'] },
          },
        },
      ],
    });

    console.log(`🌅 Found ${users.length} users with active tasks for daily digest.`);

    for (const user of users) {
      if (user.todos && user.todos.length > 0) {
        try {
          await sendDailyDigest(user.email, user.name, user.todos);
        } catch (mailErr) {
          console.error(`❌ Failed to send daily digest to ${user.email}:`, mailErr.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error running daily digest scan:', err.message);
  }
};

/**
 * Initialize background cron jobs
 */
const init = () => {
  console.log('⚙️ Initializing Background Scheduler...');

  // 1. Hourly due task check: Runs at minute 0 of every hour
  cron.schedule('0 * * * *', () => {
    runDueRemindersCheck();
  });

  // 2. Daily digest: Runs at 8:00 AM every day
  cron.schedule('0 8 * * *', () => {
    runDailyDigestCheck();
  });

  console.log('✅ Cron schedules registered:');
  console.log('   - Due Reminders Scan: Hourly (0 * * * *)');
  console.log('   - Daily Digests Send: Daily at 8:00 AM (0 8 * * *)');

  // Trigger an initial scan 10 seconds after startup to verify it's working
  setTimeout(() => {
    runDueRemindersCheck();
  }, 10000);
};

module.exports = {
  init,
  runDueRemindersCheck,
  runDailyDigestCheck,
};
