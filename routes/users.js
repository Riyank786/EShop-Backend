const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');

router.get(`/`, userController.getUsers);

router.get('/:id', userController.getUserById);

router.post('/', userController.addUser);

router.put('/:id', userController.updateUser);

router.post('/login', userController.userLogin);

router.post('/register', userController.userRegister);

router.delete('/:id', userController.deleteUser);

router.get(`/get/count`, userController.getTotalUsers);

module.exports = router;