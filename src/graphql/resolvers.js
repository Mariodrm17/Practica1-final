const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

const resolvers = {
  Query: {
    // Test
    hello: () => '¡Hola desde GraphQL! 🏀',
    
    // ==================== PRODUCTOS ====================
    getProducts: async () => {
      try {
        return await Product.find({ isActive: true })
          .populate('createdBy', 'username')
          .sort({ createdAt: -1 });
      } catch (error) {
        throw new Error('Error obteniendo productos: ' + error.message);
      }
    },
    
    getProduct: async (_, { id }) => {
      try {
        const product = await Product.findById(id)
          .populate('createdBy', 'username email');
        
        if (!product || !product.isActive) {
          throw new Error('Producto no encontrado');
        }
        
        return product;
      } catch (error) {
        throw new Error('Error obteniendo producto: ' + error.message);
      }
    },
    
    getProductsByLeague: async (_, { league }) => {
      try {
        return await Product.find({ league, isActive: true })
          .populate('createdBy', 'username')
          .sort({ createdAt: -1 });
      } catch (error) {
        throw new Error('Error obteniendo productos por liga: ' + error.message);
      }
    },
    
    // ==================== PEDIDOS ====================
    getOrders: async (_, { status }) => {
      try {
        const filter = status ? { status } : {};
        
        return await Order.find(filter)
          .populate('user', 'username email')
          .populate('products.product', 'name price image category league')
          .sort({ createdAt: -1 });
      } catch (error) {
        throw new Error('Error obteniendo pedidos: ' + error.message);
      }
    },
    
    getOrder: async (_, { id }) => {
      try {
        const order = await Order.findById(id)
          .populate('user', 'username email')
          .populate('products.product', 'name price image category league');
        
        if (!order) {
          throw new Error('Pedido no encontrado');
        }
        
        return order;
      } catch (error) {
        throw new Error('Error obteniendo pedido: ' + error.message);
      }
    },
    
    getMyOrders: async (_, { userId }) => {
      try {
        return await Order.find({ user: userId })
          .populate('products.product', 'name price image category league')
          .sort({ createdAt: -1 });
      } catch (error) {
        throw new Error('Error obteniendo mis pedidos: ' + error.message);
      }
    },
    
    // ==================== CARRITO ====================
    getCart: async (_, { userId }) => {
      try {
        let cart = await Cart.findOne({ user: userId })
          .populate('items.product', 'name price image category league sizes stock');
        
        if (!cart) {
          cart = new Cart({ user: userId, items: [] });
          await cart.save();
        }
        
        return cart;
      } catch (error) {
        throw new Error('Error obteniendo carrito: ' + error.message);
      }
    },
    
    // ==================== ESTADÍSTICAS ====================
    getOrderStats: async () => {
      try {
        const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
          Order.countDocuments(),
          Order.countDocuments({ status: 'pending' }),
          Order.countDocuments({ status: 'completed' })
        ]);
        
        const revenueData = await Order.aggregate([
          { $match: { status: 'completed' } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$total' },
              averageOrderValue: { $avg: '$total' }
            }
          }
        ]);
        
        const revenue = revenueData[0] || { totalRevenue: 0, averageOrderValue: 0 };
        
        return {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue: revenue.totalRevenue,
          averageOrderValue: revenue.averageOrderValue
        };
      } catch (error) {
        throw new Error('Error obteniendo estadísticas: ' + error.message);
      }
    }
  },
  
  Mutation: {
    // ==================== CREAR PEDIDO DESDE CARRITO ====================
    createOrderFromCart: async (_, { userId }) => {
      try {
        // Obtener carrito del usuario
        const cart = await Cart.findOne({ user: userId })
          .populate('items.product');
        
        if (!cart || !cart.items || cart.items.length === 0) {
          throw new Error('El carrito está vacío');
        }
        
        // Verificar stock de todos los productos
        let total = 0;
        for (const item of cart.items) {
          const product = item.product;
          
          if (!product || !product.isActive) {
            throw new Error(`Producto ${product?.name || 'desconocido'} no disponible`);
          }
          
          if (product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${product.name}`);
          }
          
          total += product.price * item.quantity;
        }
        
        // Crear pedido
        const newOrder = new Order({
          user: userId,
          products: cart.items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price
          })),
          total: total,
          status: 'pending'
        });
        
        await newOrder.save();
        
        // Reducir stock
        for (const item of cart.items) {
          await Product.findByIdAndUpdate(
            item.product._id,
            {
              $inc: { 
                stock: -item.quantity,
                sales: item.quantity
              }
            }
          );
        }
        
        // Vaciar carrito del usuario
        await Cart.findOneAndUpdate(
          { user: userId },
          { items: [] }
        );
        
        await newOrder.populate('products.product', 'name price image');
        
        return newOrder;
      } catch (error) {
        throw new Error('Error creando pedido: ' + error.message);
      }
    },
    
    // ==================== ACTUALIZAR ESTADO DE PEDIDO ====================
    updateOrderStatus: async (_, { orderId, status }) => {
      try {
        if (!['pending', 'completed'].includes(status)) {
          throw new Error('Estado inválido');
        }
        
        const order = await Order.findByIdAndUpdate(
          orderId,
          { status },
          { new: true }
        )
          .populate('user', 'username email')
          .populate('products.product', 'name price');
        
        if (!order) {
          throw new Error('Pedido no encontrado');
        }
        
        return order;
      } catch (error) {
        throw new Error('Error actualizando estado: ' + error.message);
      }
    },
    
    // ==================== AÑADIR AL CARRITO ====================
    addToCart: async (_, { userId, productId, quantity, size }) => {
      try {
        const product = await Product.findById(productId);
        
        if (!product || !product.isActive) {
          throw new Error('Producto no disponible');
        }
        
        if (product.stock < quantity) {
          throw new Error('Stock insuficiente');
        }
        
        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
          cart = new Cart({ user: userId, items: [] });
        }
        
        const existingItem = cart.items.find(item => 
          item.product.toString() === productId && item.size === size
        );
        
        if (existingItem) {
          existingItem.quantity += quantity;
          existingItem.price = product.price;
        } else {
          cart.items.push({
            product: productId,
            quantity: quantity,
            size: size,
            price: product.price
          });
        }
        
        await cart.save();
        await cart.populate('items.product', 'name price image category');
        
        return cart;
      } catch (error) {
        throw new Error('Error añadiendo al carrito: ' + error.message);
      }
    },
    
    // ==================== ELIMINAR DEL CARRITO ====================
    removeFromCart: async (_, { userId, itemId }) => {
      try {
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
          throw new Error('Carrito no encontrado');
        }
        
        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        
        await cart.save();
        await cart.populate('items.product', 'name price image category');
        
        return cart;
      } catch (error) {
        throw new Error('Error eliminando del carrito: ' + error.message);
      }
    },
    
    // ==================== VACIAR CARRITO ====================
    clearCart: async (_, { userId }) => {
      try {
        const cart = await Cart.findOneAndUpdate(
          { user: userId },
          { items: [] },
          { new: true }
        );
        
        return cart || new Cart({ user: userId, items: [] });
      } catch (error) {
        throw new Error('Error vaciando carrito: ' + error.message);
      }
    }
  }
};

module.exports = resolvers;