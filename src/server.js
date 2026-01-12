// server.js - VERSIÓN CON GRAPHQL COMPLETO (Queries + Mutations)
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Importar modelos
const Product = require('./models/Product');
const User = require('./models/User');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

// Importar schema y resolvers de GraphQL
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== MONGODB CONNECTION ====================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    initializeDefaultData();
  })
  .catch((err) => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });

// ==================== INICIALIZACIÓN DE DATOS ====================
async function initializeDefaultData() {
  try {
    // Verificar si hay productos
    const productCount = await Product.countDocuments();
    console.log(`📦 Productos en BD: ${productCount}`);

    if (productCount === 0) {
      console.log('📝 Creando productos de ejemplo...');
      const defaultProducts = [
        // NBA Products
        {
          name: "Balón Spalding NBA Official",
          description: "Balón oficial de la NBA, tamaño 7, cuero genuino",
          price: 89.99,
          category: "Balones",
          image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
          stock: 15,
          league: "NBA",
          sizes: ["7"],
          isActive: true
        },
        {
          name: "Camiseta Lakers LeBron James",
          description: "Camiseta oficial Nike de los Lakers, temporada 2024",
          price: 124.99,
          category: "Camisetas",
          image: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=400",
          stock: 8,
          league: "NBA",
          sizes: ["S", "M", "L", "XL"],
          isActive: true
        },
        {
          name: "Zapatillas Nike LeBron XXI",
          description: "Últimas zapatillas de la línea LeBron James",
          price: 199.99,
          category: "Calzado",
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
          stock: 12,
          league: "NBA",
          sizes: ["40", "41", "42", "43", "44"],
          isActive: true
        },
        {
          name: "Camiseta Warriors Curry",
          description: "Camiseta oficial de Stephen Curry #30",
          price: 119.99,
          category: "Camisetas",
          image: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=400",
          stock: 10,
          league: "NBA",
          sizes: ["S", "M", "L", "XL"],
          isActive: true
        },
        {
          name: "Pantalón Corto NBA",
          description: "Pantalón de entrenamiento oficial NBA",
          price: 49.99,
          category: "Ropa",
          image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
          stock: 20,
          league: "NBA",
          sizes: ["S", "M", "L", "XL"],
          isActive: true
        },
        {
          name: "Mochila NBA Team",
          description: "Mochila deportiva con logo NBA",
          price: 39.99,
          category: "Accesorios",
          image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
          stock: 25,
          league: "NBA",
          isActive: true
        },
        {
          name: "Gorra Chicago Bulls",
          description: "Gorra ajustable oficial de los Bulls",
          price: 29.99,
          category: "Accesorios",
          image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400",
          stock: 30,
          league: "NBA",
          isActive: true
        },
        {
          name: "Camiseta Bucks Giannis",
          description: "Camiseta oficial de Giannis Antetokounmpo",
          price: 124.99,
          category: "Camisetas",
          image: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=400",
          stock: 7,
          league: "NBA",
          sizes: ["S", "M", "L", "XL"],
          isActive: true
        },
        {
          name: "Medias NBA Performance",
          description: "Pack de 3 pares de medias técnicas",
          price: 24.99,
          category: "Ropa",
          image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400",
          stock: 50,
          league: "NBA",
          sizes: ["S-M", "L-XL"],
          isActive: true
        },

        // ACB Products
        {
          name: "Balón Molten ACB Official",
          description: "Balón oficial de la Liga ACB",
          price: 79.99,
          category: "Balones",
          image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
          stock: 12,
          league: "ACB",
          sizes: ["7"],
          isActive: true
        },
        {
          name: "Camiseta Real Madrid Baloncesto",
          description: "Camiseta oficial del Real Madrid de baloncesto",
          price: 89.99,
          category: "Camisetas",
          image: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=400",
          stock: 15,
          league: "ACB",
          sizes: ["S", "M", "L", "XL"],
          isActive: true
        },
        {
          name: "Camiseta FC Barcelona Basket",
          description: "Camiseta oficial del Barça de baloncesto",
          price: 89.99,
          category: "Camisetas",
          image: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=400",
          stock: 18,
          league: "ACB",
          sizes: ["S", "M", "L", "XL"],
          isActive: true
        },
        {
          name: "Sudadera ACB",
          description: "Sudadera con capucha oficial de la ACB",
          price: 59.99,
          category: "Ropa",
          image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
          stock: 22,
          league: "ACB",
          sizes: ["S", "M", "L", "XL", "XXL"],
          isActive: true
        },
        {
          name: "Balón Mini ACB",
          description: "Balón de colección tamaño mini",
          price: 19.99,
          category: "Balones",
          image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
          stock: 40,
          league: "ACB",
          sizes: ["Mini"],
          isActive: true
        },
        {
          name: "Muñequeras ACB Pro",
          description: "Set de 2 muñequeras profesionales",
          price: 14.99,
          category: "Accesorios",
          image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400",
          stock: 35,
          league: "ACB",
          isActive: true
        },

        // Productos para ambas ligas
        {
          name: "Botella Térmica Basketball",
          description: "Botella térmica de acero inoxidable 750ml",
          price: 24.99,
          category: "Accesorios",
          image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
          stock: 45,
          league: "Ambas",
          isActive: true
        },
        {
          name: "Red para canasta profesional",
          description: "Red de nylon de alta resistencia",
          price: 12.99,
          category: "Equipamiento",
          image: "https://images.unsplash.com/photo-1559692048-79a3f837883d?w=400",
          stock: 60,
          league: "Ambas",
          isActive: true
        },
        {
          name: "Inflador de balones con manómetro",
          description: "Inflador manual con medidor de presión",
          price: 16.99,
          category: "Equipamiento",
          image: "https://images.unsplash.com/photo-1593214452396-2399e6c83226?w=400",
          stock: 28,
          league: "Ambas",
          isActive: true
        }
      ];

      const adminUser = await User.findOne({ email: 'admin@baloncesto.com' });
      
      const productsWithCreator = defaultProducts.map(product => ({
        ...product,
        createdBy: adminUser ? adminUser._id : null
      }));

      await Product.insertMany(productsWithCreator);
      console.log('✅ 18 productos de baloncesto creados');
    }

    // Verificar usuario admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`👤 Administradores: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('👤 Creando usuario admin...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        username: 'admin',
        email: 'admin@baloncesto.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Usuario admin creado: admin@baloncesto.com / admin123');
    }

  } catch (error) {
    console.error('❌ Error inicializando datos:', error);
  }
}

// ==================== GRAPHQL ENDPOINT (MODO BÁSICO CON MUTATIONS) ====================

app.post('/graphql', async (req, res) => {
  try {
    const { query, variables } = req.body;
    
    console.log('📡 GraphQL recibida:', query.substring(0, 100) + '...');
    
    // Detectar si es QUERY o MUTATION
    const isQuery = query.trim().startsWith('query') || (!query.trim().startsWith('mutation'));
    const isMutation = query.trim().startsWith('mutation');
    
    // ==================== QUERIES ====================
    
    if (isQuery && !isMutation) {
      // Query: getProducts
      if (query.includes('getProducts') && !query.includes('getProductsByLeague')) {
        const products = await resolvers.Query.getProducts();
        return res.json({ data: { getProducts: products } });
      }
      
      // Query: getProductsByLeague
      if (query.includes('getProductsByLeague')) {
        const leagueMatch = query.match(/league:\s*"(\w+)"/);
        if (leagueMatch) {
          const products = await resolvers.Query.getProductsByLeague(null, { league: leagueMatch[1] });
          return res.json({ data: { getProductsByLeague: products } });
        }
      }
      
      // Query: getProduct (por ID)
      if (query.includes('getProduct(') || query.includes('getProduct (')) {
        const idMatch = query.match(/id:\s*"([^"]+)"/);
        if (idMatch) {
          const product = await resolvers.Query.getProduct(null, { id: idMatch[1] });
          return res.json({ data: { getProduct: product } });
        }
      }
      
      // Query: getOrders
      if (query.includes('getOrders')) {
        const statusMatch = query.match(/status:\s*"(\w+)"/);
        const status = statusMatch ? statusMatch[1] : null;
        const orders = await resolvers.Query.getOrders(null, { status });
        return res.json({ data: { getOrders: orders } });
      }
      
      // Query: getOrder (por ID)
      if (query.includes('getOrder(') || query.includes('getOrder (')) {
        const idMatch = query.match(/id:\s*"([^"]+)"/);
        if (idMatch) {
          const order = await resolvers.Query.getOrder(null, { id: idMatch[1] });
          return res.json({ data: { getOrder: order } });
        }
      }
      
      // Query: getMyOrders
      if (query.includes('getMyOrders')) {
        const userIdMatch = query.match(/userId:\s*"([^"]+)"/);
        if (userIdMatch) {
          const orders = await resolvers.Query.getMyOrders(null, { userId: userIdMatch[1] });
          return res.json({ data: { getMyOrders: orders } });
        }
      }
      
      // Query: getCart
      if (query.includes('getCart')) {
        const userIdMatch = query.match(/userId:\s*"([^"]+)"/);
        if (userIdMatch) {
          const cart = await resolvers.Query.getCart(null, { userId: userIdMatch[1] });
          return res.json({ data: { getCart: cart } });
        }
      }
      
      // Query: getOrderStats
      if (query.includes('getOrderStats')) {
        const stats = await resolvers.Query.getOrderStats();
        return res.json({ data: { getOrderStats: stats } });
      }
      
      // Query: hello
      if (query.includes('hello')) {
        const message = await resolvers.Query.hello();
        return res.json({ data: { hello: message } });
      }
    }
    
    // ==================== MUTATIONS ====================
    
    if (isMutation) {
      // Mutation: addToCart
      if (query.includes('addToCart')) {
        const userIdMatch = query.match(/userId:\s*"([^"]+)"/);
        const productIdMatch = query.match(/productId:\s*"([^"]+)"/);
        const quantityMatch = query.match(/quantity:\s*(\d+)/);
        
        if (userIdMatch && productIdMatch) {
          const cart = await resolvers.Mutation.addToCart(null, {
            userId: userIdMatch[1],
            productId: productIdMatch[1],
            quantity: quantityMatch ? parseInt(quantityMatch[1]) : 1
          });
          return res.json({ data: { addToCart: cart } });
        }
      }
      
      // Mutation: removeFromCart
      if (query.includes('removeFromCart')) {
        const userIdMatch = query.match(/userId:\s*"([^"]+)"/);
        const itemIdMatch = query.match(/itemId:\s*"([^"]+)"/);
        
        if (userIdMatch && itemIdMatch) {
          const cart = await resolvers.Mutation.removeFromCart(null, {
            userId: userIdMatch[1],
            itemId: itemIdMatch[1]
          });
          return res.json({ data: { removeFromCart: cart } });
        }
      }
      
      // Mutation: clearCart
      if (query.includes('clearCart')) {
        const userIdMatch = query.match(/userId:\s*"([^"]+)"/);
        
        if (userIdMatch) {
          const cart = await resolvers.Mutation.clearCart(null, {
            userId: userIdMatch[1]
          });
          return res.json({ data: { clearCart: cart } });
        }
      }
      
      // Mutation: createOrder
      if (query.includes('createOrder')) {
        const userIdMatch = query.match(/userId:\s*"([^"]+)"/);
        const totalMatch = query.match(/total:\s*(\d+\.?\d*)/);
        
        if (userIdMatch && totalMatch) {
          const order = await resolvers.Mutation.createOrder(null, {
            userId: userIdMatch[1],
            total: parseFloat(totalMatch[1])
          });
          return res.json({ data: { createOrder: order } });
        }
      }
      
      // Mutation: updateOrderStatus
      if (query.includes('updateOrderStatus')) {
        const orderIdMatch = query.match(/orderId:\s*"([^"]+)"/);
        const statusMatch = query.match(/status:\s*"(\w+)"/);
        
        if (orderIdMatch && statusMatch) {
          const order = await resolvers.Mutation.updateOrderStatus(null, {
            orderId: orderIdMatch[1],
            status: statusMatch[1]
          });
          return res.json({ data: { updateOrderStatus: order } });
        }
      }
    }
    
    // Si llegamos aquí, la operación no está implementada
    res.json({
      data: null,
      errors: [{
        message: 'Operación GraphQL no reconocida. Disponibles: Queries (getProducts, getProductsByLeague, getCart, getMyOrders, getOrders, getOrderStats) | Mutations (addToCart, removeFromCart, clearCart, createOrder, updateOrderStatus)'
      }]
    });
    
  } catch (error) {
    console.error('❌ Error en GraphQL:', error);
    res.json({
      data: null,
      errors: [{
        message: error.message,
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      }]
    });
  }
});

// ==================== RUTAS REST (Complementarias) ====================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();
    
    res.json({
      status: 'OK',
      message: '🚀 Servidor funcionando correctamente',
      database: {
        status: 'connected',
        products: productCount,
        users: userCount
      },
      graphql: {
        status: '✅ MODO COMPLETO ACTIVO (Queries + Mutations)',
        endpoint: `http://localhost:${PORT}/graphql`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// ==================== SOCKET.IO PARA CHAT ====================
io.on('connection', (socket) => {
  console.log('👤 Usuario conectado al chat:', socket.id);

  socket.on('joinChat', (data) => {
    console.log(`✅ ${data.username} se unió al chat`);
    socket.broadcast.emit('userJoined', data);
  });

  socket.on('sendMessage', (data) => {
    console.log(`💬 Mensaje de ${data.username}: ${data.message}`);
    io.emit('newMessage', data);
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log('👋 Usuario desconectado:', socket.id);
  });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🏀 SERVIDOR DE BALONCESTO NBA/ACB INICIADO                  ║
║                                                                ║
║   🌐 URL: http://localhost:${PORT}                              ║
║   📊 GraphQL: http://localhost:${PORT}/graphql                  ║
║   ✅ Queries + Mutations disponibles                          ║
║   💬 Socket.IO: Activo                                        ║
║   🗄️  MongoDB: Conectado                                      ║
║                                                                ║
║   Credenciales Admin:                                         ║
║   📧 Email: admin@baloncesto.com                              ║
║   🔑 Pass: admin123                                           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };