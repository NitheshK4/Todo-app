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

module.exports = router;
