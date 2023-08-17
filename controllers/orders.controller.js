const {Order} = require('../schemas/order');
const {Product} = require('../schemas/product');
const { OrderItem } = require('../schemas/order-item');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
class OrderController {

    async getOrders(req, res) {
        try {
            const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});
            if(!orderList) {
                return res.status(500).json({success: false})
            } 
            res.send(orderList);       
        } catch (error) {
            return res.status(500).json({success: false, error: error}) 
        }
    }

    async getOrderById(req, res) {
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
            return res.status(500).json({success: false, error: error}) 
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
                return res.status(500).send('the order cannot be created!')
            } 
            res.send(order);       
        } catch (error) {
            return res.status(500).json({success: false, error: error}) 
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
                return res.status(500).send('the order cannot be updated!')
            } 
            res.send(order);       
        } catch (error) {
            return res.status(500).json({success: false, error: error}) 
        }
    }

    async deleteOrder(req, res) {
        try {
            const order = await Order.findByIdAndRemove(req.params.id)
        
            if(!order) {
                return res.status(500).send('the order cannot be deleted!')
            } 
            res.send(order);       
        } catch (error) {
            return res.status(500).json({success: false, error: error}) 
        }
    }

    async getTotalSales(req, res) {
        try {
            const totalSales = await Order.aggregate([
                { $group: { _id: null , totalsales: { $sum: '$totalPrice'}}}
            ])
            console.log(totalSales);
            if(typeof totalSales === 'undefined') {
                return res.status(500).send('the order sales cannot be generated!')
            } 
            let extractedTotalSales; 
            if(totalSales.length) extractedTotalSales = totalSales.pop().totalsales;
            else extractedTotalSales = 0;
            res.send({totalsales:  extractedTotalSales});       
        } catch (error) {
            console.log(error);
            return res.status(500).json({success: false, error: error}) 
        }
    }

    async getTotalOrders(req, res) {
        try {
            const orderCount = await Order.countDocuments((count) => count)
            
            if(orderCount !== 0 && !orderCount) {
                return res.status(500).send('No Orders')
            } 
            res.send({orderCount: orderCount});       
        } catch (error) {
            return res.status(500).json({success: false, error: error}) 
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
            return res.status(500).json({success: false, error: error}) 
        }
    }

    async createCheckoutSession(req, res) {
        try {
            const orderItems = req.body;
            if(!orderItems) {
                return res.status(500).send('the order cannot be created!')
            }

            const lineItems = await Promise.all(
                orderItems.map(async (orderItem) => {
                    const product = await Product.findById(orderItem.product);
                    return {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: product.name
                            },
                            unit_amount: product.price * 100
                        },
                        quantity: orderItem.quantity
                    }
                })
            );

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `http://localhost:4200/success`,
                cancel_url: `http://localhost:4200/error`,
            });

            res.json({id: session.id});
        } catch (error) {
            return res.status(500).json({success: false, error: error})    
        }
    }

}

module.exports = new OrderController();