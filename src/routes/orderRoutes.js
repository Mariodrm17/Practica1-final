const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateJWT, requireAdmin } = require('../middleware/authenticateJWT');

const router = express.Router();

// ==================== RUTAS DE USUARIO ====================

// Crear pedido desde el carrito (CHECKOUT)
router.post('/checkout', authenticateJWT, async (req, res) => {
  try {
    // 1. Obtener carrito del usuario
    const cart = await Cart.findOne({ user: req.user.userId })
      .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }
    
    // 2. Verificar stock de todos los productos
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `El producto "${item.product.name}" ya no está disponible`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`
        });
      }
    }
    
    // 3. Crear el pedido
    const orderProducts = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price
    }));
    
    const order = new Order({
      user: req.user.userId,
      products: orderProducts,
      total: cart.total,
      status: 'pending'
    });
    
    await order.save();
    
    // 4. Reducir stock de los productos
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
    
    // 5. Vaciar el carrito
    cart.items = [];
    await cart.save();
    
    // 6. Devolver el pedido creado
    await order.populate('products.product', 'name price image category');
    
    res.status(201).json({
      success: true,
      message: '¡Pedido realizado con éxito! 🎉',
      order: order
    });
    
  } catch (error) {
    console.error('Error en checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el pedido',
      error: error.message
    });
  }
});

// Obtener MIS pedidos (usuario logueado)
router.get('/my-orders', authenticateJWT, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('products.product', 'name price image category league')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      orders: orders
    });
    
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pedidos'
    });
  }
});

// Obtener detalle de UN pedido específico
router.get('/:orderId', authenticateJWT, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('products.product', 'name price image category league stock')
      .populate('user', 'username email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    // Verificar que el pedido pertenece al usuario (o es admin)
    if (order.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este pedido'
      });
    }
    
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pedido'
    });
  }
});

// ==================== RUTAS DE ADMIN ====================

// Obtener TODOS los pedidos (solo admin)
router.get('/admin/all', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Filtro opcional por estado
    let filter = {};
    if (status && ['pending', 'completed'].includes(status)) {
      filter.status = status;
    }
    
    const orders = await Order.find(filter)
      .populate('user', 'username email')
      .populate('products.product', 'name price image category league')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      count: orders.length,
      total: total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      orders: orders
    });
    
  } catch (error) {
    console.error('Error obteniendo todos los pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pedidos'
    });
  }
});

// Cambiar estado de un pedido (solo admin)
router.put('/admin/:orderId/status', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Usa: pending o completed'
      });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status: status },
      { new: true }
    )
      .populate('user', 'username email')
      .populate('products.product', 'name price');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: `Pedido marcado como ${status === 'completed' ? 'completado' : 'pendiente'}`,
      order: order
    });
    
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando estado del pedido'
    });
  }
});

// Obtener estadísticas de pedidos (solo admin)
router.get('/admin/stats', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'completed' })
    ]);
    
    // Calcular ingresos totales
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
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: revenue.totalRevenue.toFixed(2),
        averageOrderValue: revenue.averageOrderValue.toFixed(2)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// Eliminar pedido (solo admin) - con precaución
router.delete('/admin/:orderId', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Pedido eliminado correctamente'
    });
    
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando pedido'
    });
  }
});

module.exports = router;