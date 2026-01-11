require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const http = require("http");
const path = require("path");
const cors = require("cors");

// ================== IMPORTAR MODELOS Y RUTAS ==================
const Product = require("./models/Product");
const User = require("./models/User");
const ChatMessage = require("./models/ChatMessage");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

// GRAPHQL RESOLVERS (SIN APOLLO)
const resolvers = require('./graphql/resolvers');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ================== GRAPHQL ENDPOINT BÁSICO (SIN APOLLO) ==================

app.post('/graphql', async (req, res) => {
  try {
    const { query } = req.body;
    
    console.log('📡 GraphQL Query recibida:', query.substring(0, 100) + '...');
    
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
    
    // Si llegamos aquí, la query no está implementada
    res.json({
      data: null,
      errors: [{
        message: 'Query no implementada en modo básico. Queries disponibles: getProducts, getProductsByLeague, getOrders, getCart, getOrderStats, hello'
      }]
    });
    
  } catch (error) {
    console.error('❌ Error en GraphQL:', error);
    res.json({
      data: null,
      errors: [{
        message: error.message
      }]
    });
  }
});

// ================== CONEXIÓN A MONGODB ==================
console.log('🔗 Intentando conectar a MongoDB Atlas...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(async () => {
  console.log('✅ Conectado a MongoDB Atlas correctamente');
  console.log('📊 Base de datos:', mongoose.connection.db.databaseName);
  
  await initializeDefaultData();
  
  console.log('🚀 GraphQL BÁSICO disponible en: http://localhost:3000/graphql');
})
.catch(err => {
  console.error('❌ Error crítico conectando a MongoDB:', err);
  process.exit(1);
});

mongoose.connection.on('error', err => {
  console.error('❌ Error de MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB desconectado');
});

// ================== RUTAS REST ==================

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// Ruta de salud
app.get("/api/health", async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();
    
    res.json({ 
      status: "OK", 
      message: "🚀 Servidor funcionando correctamente",
      timestamp: new Date().toISOString(),
      database: {
        status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        products: productCount,
        users: userCount
      },
      graphql: {
        status: "✅ MODO BÁSICO ACTIVO",
        endpoint: "http://localhost:3000/graphql",
        queries: ["getProducts", "getProductsByLeague", "getOrders", "getCart", "getOrderStats", "hello"]
      },
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta de debug
app.get("/api/debug/database", async (req, res) => {
  try {
    const [products, users, collections] = await Promise.all([
      Product.find().select('name price league stock').limit(5),
      User.find().select('username email role').limit(5),
      mongoose.connection.db.listCollections().toArray()
    ]);
    
    res.json({
      status: "DEBUG_INFO",
      database: {
        name: mongoose.connection.db.databaseName,
        state: mongoose.connection.readyState,
        collections: collections.map(c => c.name)
      },
      counts: {
        products: await Product.countDocuments(),
        users: await User.countDocuments()
      },
      sampleData: {
        products: products,
        users: users
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================== SOCKET.IO ==================

io.on("connection", (socket) => {
    console.log("✅ Nueva conexión Socket.IO:", socket.id);

    socket.on("joinChat", async (user) => {
        try {
            console.log(`👋 ${user.username} se unió al chat`);
            socket.join("chat-room");
            
            const systemMessage = new ChatMessage({
                username: 'Sistema',
                message: `${user.username} se unió al chat`,
                room: "chat-room",
                type: "system"
            });
            await systemMessage.save();
            
            try {
                const chatHistory = await ChatMessage.getChatHistory("chat-room", 50);
                socket.emit("chatHistory", chatHistory);
            } catch (historyError) {
                console.error("Error cargando historial:", historyError);
                socket.emit("chatHistory", []);
            }
            
            socket.broadcast.to("chat-room").emit("userJoined", {
                username: user.username,
                timestamp: new Date().toLocaleTimeString("es-ES", { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                })
            });
            
        } catch (error) {
            console.error("❌ Error en joinChat:", error);
            socket.emit("chatError", { message: "Error al unirse al chat" });
        }
    });

    socket.on("sendMessage", async (data) => {
        try {
            console.log(`💬 Mensaje de ${data.username}: ${data.message}`);
            
            let userId = data.userId;
            if (!userId) {
                try {
                    const user = await User.findOne({ username: data.username });
                    if (user) {
                        userId = user._id;
                    } else {
                        userId = new mongoose.Types.ObjectId();
                    }
                } catch (userError) {
                    userId = new mongoose.Types.ObjectId();
                }
            }
            
            const chatMessage = new ChatMessage({
                user: userId,
                username: data.username,
                message: data.message,
                room: "chat-room",
                type: "message"
            });
            
            await chatMessage.save();
            
            io.to("chat-room").emit("newMessage", {
                username: data.username,
                message: data.message,
                timestamp: new Date().toLocaleTimeString("es-ES", { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                }),
                _id: chatMessage._id
            });
            
        } catch (error) {
            console.error("❌ Error guardando mensaje:", error);
            
            io.to("chat-room").emit("newMessage", {
                username: data.username,
                message: data.message,
                timestamp: new Date().toLocaleTimeString("es-ES", { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                }),
                temporary: true
            });
        }
    });

    socket.on("typing", (data) => {
        try {
            socket.broadcast.to("chat-room").emit("typing", {
                username: data.username,
                isTyping: data.isTyping
            });
        } catch (error) {
            console.error("Error en typing:", error);
        }
    });

    socket.on("disconnect", async (reason) => {
        console.log(`❌ Usuario desconectado: ${socket.id} - Razón: ${reason}`);
    });

    socket.on("error", (error) => {
        console.error("❌ Error de socket:", error);
        socket.emit("socketError", { 
            message: "Error de conexión",
            code: error.code 
        });
    });
});

// ================== MANEJADOR 404 ==================
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error("🔥 Error global:", error);
  res.status(500).json({
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === "development" ? error.message : "Contacta al administrador"
  });
});

// ================== INICIALIZACIÓN DE DATOS ==================

async function initializeDefaultData() {
  try {
    console.log('🏀 Verificando datos iniciales...');
    
    const adminCount = await User.countDocuments({ role: 'admin' });
    let adminUser;

    if (adminCount === 0) {
      console.log('👑 Creando usuario administrador...');
      adminUser = await createDefaultAdmin();
    } else {
      adminUser = await User.findOne({ role: 'admin' });
      console.log('✅ Usuario admin ya existe:', adminUser.email);
    }
    
    const productCount = await Product.countDocuments();
    console.log(`📦 Productos en BD: ${productCount}`);
    
    if (productCount === 0) {
      console.log('🔄 Creando productos de baloncesto...');
      await createDefaultProducts(adminUser);
    }
    
    console.log('🎉 Inicialización completada correctamente');
    
  } catch (error) {
    console.error('❌ Error en inicialización:', error);
  }
}

async function createDefaultAdmin() {
  try {
    const bcrypt = require('bcryptjs');
    
    const existingAdmin = await User.findOne({ email: 'admin@baloncesto.com' });
    if (existingAdmin) {
      console.log('✅ Usuario admin ya existe');
      return existingAdmin;
    }
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@baloncesto.com',
      password: await bcrypt.hash('admin123', 12),
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Usuario admin creado: admin@baloncesto.com / admin123');
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creando admin:', error);
    throw error;
  }
}

async function createDefaultProducts(adminUser) {
  try {
    const createdById = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    const defaultProducts = [
      {
        name: "Balón Oficial NBA Spalding",
        description: "Balón de baloncesto oficial de la NBA, tamaño 7, material de cuero sintético premium.",
        price: 89.99,
        category: "Balones",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        stock: 25,
        league: "NBA",
        createdBy: createdById
      },
      {
        name: "Camiseta Lakers LeBron James",
        description: "Camiseta oficial de Los Angeles Lakers, edición legendaria de LeBron James.",
        price: 119.99,
        category: "Camisetas",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400",
        stock: 15,
        league: "NBA",
        createdBy: createdById
      },
      {
        name: "Zapatillas Jordan XXXVII",
        description: "Zapatillas de baloncesto Air Jordan XXXVII, tecnología Zoom Air, edición limitada.",
        price: 199.99,
        category: "Calzado",
        image: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400",
        stock: 8,
        league: "NBA",
        createdBy: createdById
      },
      {
        name: "Balón Oficial ACB Molten",
        description: "Balón oficial de la Liga ACB, tamaño 7, homologado FIBA.",
        price: 69.99,
        category: "Balones",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        stock: 30,
        league: "ACB",
        createdBy: createdById
      },
      {
        name: "Camiseta Real Madrid 2024",
        description: "Camiseta oficial del Real Madrid de baloncesto, temporada 2023-2024.",
        price: 89.99,
        category: "Camisetas",
        image: "https://images.unsplash.com/photo-1614624532983-1fe212c7d6e5?w=400",
        stock: 20,
        league: "ACB",
        createdBy: createdById
      }
    ];

    await Product.insertMany(defaultProducts);
    console.log(`✅ ${defaultProducts.length} productos creados exitosamente`);
    
  } catch (error) {
    console.error('❌ Error creando productos:', error);
    throw error;
  }
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`\n🎉 ==========================================`);
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🏀 Tienda de Baloncesto NBA/ACB`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 GraphQL: http://localhost:${PORT}/graphql (MODO BÁSICO)`);
  console.log(`🎉 ==========================================\n`);
});

module.exports = app;