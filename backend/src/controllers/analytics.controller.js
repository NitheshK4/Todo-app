const { Todo } = require('../models');
const { Op } = require('sequelize');
const { decrypt } = require('../services/crypto.service');

// GET /api/analytics
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const todos = await Todo.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']],
    });

    const plain = todos.map((t) => {
      const j = t.toJSON();
      j.title = decrypt(j.title) || j.title;
      return j;
    });

    const now = new Date();

    // ── 1. Tasks completed per day (last 14 days) ──────────────
    const completedPerDay = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dateStr = day.toISOString().split('T')[0];
      const count = plain.filter((t) => {
        if (t.status !== 'completed') return false;
        const updated = new Date(t.updatedAt).toISOString().split('T')[0];
        return updated === dateStr;
      }).length;
      completedPerDay.push({ date: dateStr, completed: count });
    }

    // ── 2. Streak tracking ────────────────────────────────────
    const completedDates = [
      ...new Set(
        plain
          .filter((t) => t.status === 'completed')
          .map((t) => new Date(t.updatedAt).toISOString().split('T')[0])
      ),
    ].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const dateStr of completedDates) {
      const d = new Date(dateStr);
      if (prevDate) {
        const diff = (d - prevDate) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = d;
    }

    // Current streak: how many consecutive days ending today/yesterday?
    const todayStr = now.toISOString().split('T')[0];
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    if (completedDates.includes(todayStr) || completedDates.includes(yesterdayStr)) {
      let checkDate = completedDates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);
      currentStreak = 1;
      while (true) {
        const prev = new Date(checkDate.getTime() - 86400000).toISOString().split('T')[0];
        if (completedDates.includes(prev)) {
          currentStreak++;
          checkDate = new Date(prev);
        } else {
          break;
        }
      }
    }

    // ── 3. Avg time to complete (hours) ───────────────────────
    const completedTodos = plain.filter((t) => t.status === 'completed');
    let avgTimeToComplete = 0;
    if (completedTodos.length > 0) {
      const total = completedTodos.reduce((acc, t) => {
        const ms = new Date(t.updatedAt) - new Date(t.createdAt);
        return acc + ms;
      }, 0);
      avgTimeToComplete = Math.round((total / completedTodos.length) / (1000 * 60 * 60));
    }

    // ── 4. Tasks by status ────────────────────────────────────
    const tasksByStatus = {
      pending: plain.filter((t) => t.status === 'pending').length,
      in_progress: plain.filter((t) => t.status === 'in_progress').length,
      completed: plain.filter((t) => t.status === 'completed').length,
      archived: plain.filter((t) => t.status === 'archived').length,
    };

    // ── 5. Tasks by priority ──────────────────────────────────
    const tasksByPriority = {
      low: plain.filter((t) => t.priority === 'low').length,
      medium: plain.filter((t) => t.priority === 'medium').length,
      high: plain.filter((t) => t.priority === 'high').length,
      urgent: plain.filter((t) => t.priority === 'urgent').length,
    };

    // ── 6. Completion rate ────────────────────────────────────
    const completionRate =
      plain.length > 0 ? Math.round((tasksByStatus.completed / plain.length) * 100) : 0;

    // ── 7. Weekly trend (last 7 days created vs completed) ─────
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dateStr = day.toISOString().split('T')[0];
      const created = plain.filter(
        (t) => new Date(t.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      const completed = plain.filter(
        (t) =>
          t.status === 'completed' &&
          new Date(t.updatedAt).toISOString().split('T')[0] === dateStr
      ).length;
      weeklyTrend.push({ date: dateStr, created, completed });
    }

    // ── 8. Top 5 most recently completed tasks ─────────────────
    const recentlyCompleted = completedTodos
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map((t) => ({ id: t.id, title: t.title, updatedAt: t.updatedAt, priority: t.priority }));

    res.json({
      success: true,
      analytics: {
        totalTasks: plain.length,
        completedPerDay,
        currentStreak,
        longestStreak,
        avgTimeToComplete,
        completionRate,
        tasksByStatus,
        tasksByPriority,
        weeklyTrend,
        recentlyCompleted,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAnalytics };
