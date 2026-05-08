const express = require('express');
const { getUsers, createUser, updateUser, getRoles, createRole, updateRole, getPermissions } = require('../controllers/user.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

// Static routes must come before dynamic /:id routes
router.get('/roles', authorize('manage_roles'), getRoles);
router.post('/roles', authorize('manage_roles'), createRole);
router.put('/roles/:id', authorize('manage_roles'), updateRole);
router.get('/permissions', authorize('manage_roles'), getPermissions);

router.get('/', authorize('manage_users'), getUsers);
router.post('/', authorize('manage_users'), createUser);
router.put('/:id', authorize('manage_users'), updateUser);

module.exports = router;
