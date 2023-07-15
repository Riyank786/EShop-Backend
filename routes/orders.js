const express = require('express');
const router = express.Router();

const OrderController = require('../controllers/orders.controller');

router.get(`/`, OrderController.getOrders);

router.get('/:id', OrderController.getOrderById);

router.post('/', OrderController.addOrder);

router.put('/:id', OrderController.updateOrder);

router.delete('/:id', OrderController.deleteOrder);

router.get(`/get/totalsales`, OrderController.getTotalSales);

router.get(`/get/count`, OrderController.getTotalOrders);

router.get(`/get/userorders/:userid`, OrderController.getUserOrders);

module.exports =router;