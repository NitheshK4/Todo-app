const router = require('express').Router();
const ctrl = require('../controllers/todo.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

router.use(authenticate, apiLimiter);

router.get('/', ctrl.getTodos);
router.get('/:id', ctrl.getTodoById);
router.post('/', ctrl.createTodo);
router.put('/:id', ctrl.updateTodo);
router.delete('/:id', ctrl.deleteTodo);

module.exports = router;
