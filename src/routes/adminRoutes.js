const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { authenticateJWT, requireAdmin } = require('../middleware/authenticateJWT');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateJWT);
router.use(requireAdmin);

// ==================== CRUD DE USUARIOS ====================

// Obtener TODOS los usuarios
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    
    // Filtro opcional por rol
    let filter = {};
    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }
    
    const users = await User.find(filter)
      .select('-password') // NO enviar contraseñas
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(filter);
    
    // Contar pedidos por usuario
    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          orderCount
        };
      })
    );
    
    res.json({
      success: true,
      count: users.length,
      total: total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      users: usersWithOrders
    });
    
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios'
    });
  }
});

// Obtener UN usuario específico
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Obtener pedidos del usuario
    const orders = await Order.find({ user: user._id })
      .populate('products.product', 'name price')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        orders: orders,
        totalOrders: orders.length
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuario'
    });
  }
});

// Cambiar ROL de un usuario
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validar rol
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Usa: user o admin'
      });
    }
    
    // Evitar que el admin se cambie a sí mismo a user
    if (req.params.userId === req.user.userId && role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol de administrador'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: `Usuario ${user.username} ahora es ${role === 'admin' ? 'administrador' : 'usuario normal'}`,
      user: user
    });
    
  } catch (error) {
    console.error('Error cambiando rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error cambiando rol del usuario'
    });
  }
});

// Actualizar información de usuario
router.put('/users/:userId', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      user: user
    });
    
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email o usuario ya está en uso'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error actualizando usuario'
    });
  }
});

// ELIMINAR usuario
router.delete('/users/:userId', async (req, res) => {
  try {
    // Evitar que el admin se elimine a sí mismo
    if (req.params.userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta de administrador'
      });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar si tiene pedidos
    const orderCount = await Order.countDocuments({ user: user._id });
    
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar. El usuario tiene ${orderCount} pedido(s) asociado(s)`,
        orderCount: orderCount
      });
    }
    
    await User.findByIdAndDelete(req.params.userId);
    
    res.json({
      success: true,
      message: `Usuario "${user.username}" eliminado correctamente`
    });
    
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando usuario'
    });
  }
});

// ==================== ESTADÍSTICAS DE USUARIOS ====================

router.get('/stats/users', async (req, res) => {
  try {
    const [totalUsers, adminCount, userCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' })
    ]);
    
    // Usuarios con más pedidos
    const topBuyers = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          username: '$userInfo.username',
          email: '$userInfo.email',
          totalOrders: 1,
          totalSpent: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        adminCount,
        userCount,
        topBuyers
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

module.exports = router;