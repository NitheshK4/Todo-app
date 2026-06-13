const router = require('express').Router();
const ctrl = require('../controllers/todo.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');
const { validateTodo } = require('../middleware/validation.middleware');

router.use(authenticate, apiLimiter);

router.get('/', ctrl.getTodos);
router.post('/bulk-update', ctrl.bulkUpdateTodos);
router.post('/bulk-delete', ctrl.bulkDeleteTodos);
router.get('/:id', ctrl.getTodoById);
router.post('/', validateTodo, ctrl.createTodo);
router.put('/:id', validateTodo, ctrl.updateTodo);
router.delete('/:id', ctrl.deleteTodo);

// Subtasks routes
router.post('/:todoId/subtasks', ctrl.createSubtask);
router.put('/:todoId/subtasks/:subtaskId', ctrl.updateSubtask);
router.delete('/:todoId/subtasks/:subtaskId', ctrl.deleteSubtask);

module.exports = router;
