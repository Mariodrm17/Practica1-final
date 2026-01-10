const Product = require('../models/Product');
const Order = require('../models/Order');

const resolvers = {
  Query: {
    hello: () => '¡Hola desde GraphQL!',
    
    getProducts: async () => {
      return await Product.find();
    },
    
    getProduct: async (_, { id }) => {
      return await Product.findById(id);
    },
    
    getOrders: async () => {
      // populate ayuda a traer los datos reales del producto dentro del pedido
      return await Order.find().populate('products.product');
    }
  },
  
  Mutation: {
    createOrder: async (_, { userId, products, total }) => {
      const newOrder = new Order({
        user: userId,
        products: products.map(p => ({
            product: p.productId,
            quantity: p.quantity,
            price: p.price
        })),
        total: total,
        status: 'pending'
      });
      
      await newOrder.save();
      return newOrder;
    }
  }
};

module.exports = resolvers;