const { Todo } = require('../models');
const { encrypt, decrypt } = require('../services/crypto.service');
const redisService = require('../services/redis.service');

const decryptTodo = (todo) => {
  const plain = todo.toJSON ? todo.toJSON() : { ...todo };
  plain.title = decrypt(plain.title) || plain.title;
  plain.description = plain.description ? decrypt(plain.description) : null;
  return plain;
};

// GET /api/todos
const getTodos = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try cache
    const cached = await redisService.getCachedTodos(userId);
    if (cached) return res.json({ success: true, todos: cached, source: 'cache' });

    const todos = await Todo.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    const decrypted = todos.map(decryptTodo);
    await redisService.cacheTodos(userId, decrypted);

    res.json({ success: true, todos: decrypted, source: 'db' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/todos
const createTodo = async (req, res) => {
  try {
    const { title, description, priority, status, dueDate, tags } = req.body;
    const userId = req.user.id;

    const todo = await Todo.create({
      userId,
      title: encrypt(title),
      description: description ? encrypt(description) : null,
      priority,
      status,
      dueDate,
      tags: tags || [],
      isEncrypted: true,
    });

    await redisService.invalidateTodosCache(userId);
    res.status(201).json({ success: true, todo: decryptTodo(todo) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/todos/:id
const updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    const { title, description, priority, status, dueDate, tags } = req.body;
    await todo.update({
      ...(title && { title: encrypt(title) }),
      ...(description !== undefined && { description: description ? encrypt(description) : null }),
      ...(priority && { priority }),
      ...(status && { status }),
      ...(dueDate !== undefined && { dueDate }),
      ...(tags && { tags }),
    });

    await redisService.invalidateTodosCache(req.user.id);
    res.json({ success: true, todo: decryptTodo(todo) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/todos/:id
const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    await todo.destroy();
    await redisService.invalidateTodosCache(req.user.id);
    res.json({ success: true, message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/todos/:id
const getTodoById = async (req, res) => {
  try {
    const todo = await Todo.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, todo: decryptTodo(todo) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, getTodoById };
