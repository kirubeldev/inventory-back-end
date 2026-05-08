const express = require('express');
const { login, forgotPassword, resetPassword, setPassword, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/set-password/:token', setPassword);   // invitation link
router.get('/me', protect, getMe);

module.exports = router;
