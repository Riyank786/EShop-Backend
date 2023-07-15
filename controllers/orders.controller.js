const {Order} = require('../schemas/order');
const { OrderItem } = require('../schemas/order-item');

class OrderController {

    async getOrders(req, res) {
        try {
            const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});
            if(!orderList) {
                return res.status(500).json({success: false})
            } 
            res.send(orderList);       
        } catch (error) {
            return res.status(500).json({success: false, error: err}) 
        }
    }

    async getOrder(req, res) {
        try {
            const order = await Order.findById(req.params.id)
            .populate('user', 'name')
            .populate({ 
                path: 'orderItems', populate: {
                    path : 'product', populate: 'category'} 
                });
            if(!order) {
                return res.status(500).json({success: false})
            } 
            res.send(order);       
        } catch (error) {
            return res.status(500).json({success: false, error: err}) 
        }
    }

    async createOrder(req, res) {
        try {
            const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) =>{
                let newOrderItem = new OrderItem({
                    quantity: orderItem.quantity,
                    product: orderItem.product
                })
        
                newOrderItem = await newOrderItem.save();
        
                return newOrderItem._id;
            }))
            const orderItemsIdsResolved =  await orderItemsIds;
        
            const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
                const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
                const totalPrice = orderItem.product.price * orderItem.quantity;
                return totalPrice
            }))
        
            const totalPrice = totalPrices.reduce((a,b) => a +b , 0);
        
            let order = new Order({
                orderItems: orderItemsIdsResolved,
                shippingAddress1: req.body.shippingAddress1,
                shippingAddress2: req.body.shippingAddress2,
                city: req.body.city,
                zip: req.body.zip,
                country: req.body.country,
                phone: req.body.phone,
                status: req.body.status,
                totalPrice: totalPrice,
                user: req.body.user,
            })
        
            order = await order.save();
        
            if(!order) {
                return res.status(404).send('the order cannot be created!')
            } 
            res.send(order);       
        } catch (error) {
            return res.status(500).json({success: false, error: err}) 
        }
    }

    async updateOrder(req, res) {
        try {
            const order = await Order.findByIdAndUpdate(
                req.params.id,
                {
                    status: req.body.status
                },
                { new: true}
            )
        
            if(!order) {
                return res.status(404).send('the order cannot be updated!')
            } 
            res.send(order);       
        } catch (error) {
            return res.status(500).json({success: false, error: err}) 
        }
    }

    async deleteOrder(req, res) {
        try {
            const order = await Order.findByIdAndRemove(req.params.id)
        
            if(!order) {
                return res.status(404).send('the order cannot be deleted!')
            } 
            res.send(order);       
        } catch (error) {
            return res.status(500).json({success: false, error: err}) 
        }
    }

    async getTotalSales(req, res) {
        try {
            const totalSales = await Order.aggregate([
                { $group: { _id: null , totalsales: { $sum: '$totalPrice'}}}
            ])
        
            if(!totalSales) {
                return res.status(404).send('the order sales cannot be generated!')
            } 
            res.send({totalsales: totalSales.pop().totalsales});       
        } catch (error) {
            return res.status(500).json({success: false, error: err}) 
        }
    }

    async getOrderCount(req, res) {
        try {
            const orderCount = await Order.countDocuments((count) => count)
        
            if(!orderCount) {
                return res.status(404).send('No Orders')
            } 
            res.send({orderCount: orderCount});       
        } catch (error) {
            return res.status(500).json({success: false, error: err}) 
        }
    }

    async getUserOrders(req, res) {
        try {
            const userOrderList = await Order.find({user: req.params.userid})
            .populate({ 
                path: 'orderItems', populate: {
                    path : 'product', populate: 'category'} 
                }).sort({'dateOrdered': -1});
        
            if(!userOrderList) {
                return res.status(500).json({success: false})
            } 
            res.send(userOrderList);       
        } catch (error) {
            return res.status(500).json({success: false, error: err}) 
        }
    }

}

module.exports = new OrderController();