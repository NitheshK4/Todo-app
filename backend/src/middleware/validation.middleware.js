const validateTodo = (req, res, next) => {
  const { title, priority, status, dueDate, tags } = req.body;

  // Title is required for creation, and if provided in update, it must not be empty
  if (req.method === 'POST' && (!title || typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ success: false, message: 'Title is required and must be a non-empty string' });
  }
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ success: false, message: 'Title must be a non-empty string' });
  }

  // Priority validation
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (priority !== undefined && !validPriorities.includes(priority)) {
    return res.status(400).json({ success: false, message: `Priority must be one of: ${validPriorities.join(', ')}` });
  }

  // Status validation
  const validStatuses = ['pending', 'in_progress', 'completed', 'archived'];
  if (status !== undefined && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  // Due date validation
  if (dueDate !== undefined && dueDate !== null && isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ success: false, message: 'dueDate must be a valid ISO date string or null' });
  }

  // Tags validation
  if (tags !== undefined && tags !== null) {
    if (!Array.isArray(tags) || !tags.every(tag => typeof tag === 'string')) {
      return res.status(400).json({ success: false, message: 'Tags must be an array of strings' });
    }
  }

  next();
};

module.exports = { validateTodo };
