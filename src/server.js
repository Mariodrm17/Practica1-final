require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const http = require("http");
const path = require("path");
const cors = require("cors");

// ================== CONFIGURACIÓN DE GRAPHQL ==================
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

// ================== IMPORTAR MODELOS Y RUTAS ==================
const Product = require("./models/Product");
const User = require("./models/User");
const ChatMessage = require("./models/ChatMessage"); // ← SOLO UNA VEZ aquí
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();
const server = http.createServer(app);

// Configuración de Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ================== CONFIGURACIÓN GRAPHQL ==================
async function startApolloServer() {
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apollo.start();

  // Ruta para GraphQL
  app.use('/graphql', cors(), express.json(), expressMiddleware(apollo));
  
  console.log('🚀 GraphQL listo en http://localhost:3000/graphql');
}

startApolloServer();

// ================== FIN CONFIGURACIÓN GRAPHQL ==================

// Conexión a MongoDB con mejor manejo de errores
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
  
  // Inicializar datos después de conectar
  await initializeDefaultData();
})
.catch(err => {
  console.error('❌ Error crítico conectando a MongoDB:', err);
  process.exit(1);
});

// Manejo de eventos de conexión
mongoose.connection.on('error', err => {
  console.error('❌ Error de MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB desconectado');
});

// ================== INICIALIZACIÓN DE DATOS POR DEFECTO ==================

async function initializeDefaultData() {
  try {
    console.log('🏀 Verificando datos iniciales...');
    
    // Verificar y crear usuario admin PRIMERO (para que los productos tengan createdBy)
    const adminCount = await User.countDocuments({ role: 'admin' });
    let adminUser;

    if (adminCount === 0) {
      console.log('👑 Creando usuario administrador...');
      adminUser = await createDefaultAdmin();
    } else {
      adminUser = await User.findOne({ role: 'admin' });
      console.log('✅ Usuario admin ya existe:', adminUser.email);
    }
    
    // Verificar y crear productos si no existen
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
    
    // Verificar si ya existe
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
      // ... (tu array de productos se mantiene igual)
      {
        name: "Balón Oficial NBA Spalding",
        description: "Balón de baloncesto oficial de la NBA, tamaño 7, material de cuero sintético premium. Ideal para partidos profesionales.",
        price: 89.99,
        category: "Balones",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        stock: 25,
        league: "NBA",
        createdBy: createdById
      },
      // ... resto de productos
    ];

    await Product.insertMany(defaultProducts);
    console.log(`✅ ${defaultProducts.length} productos creados exitosamente`);
    
  } catch (error) {
    console.error('❌ Error creando productos:', error);
    throw error;
  }
}

async function createDefaultProducts() {
  try {
    // Crear un usuario temporal para los productos
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.findOne();
    }
    
    const createdById = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    const defaultProducts = [
      {
        name: "Balón Oficial NBA Spalding",
        description: "Balón de baloncesto oficial de la NBA, tamaño 7, material de cuero sintético premium. Ideal para partidos profesionales.",
        price: 89.99,
        category: "Balones",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        stock: 25,
        league: "NBA",
        createdBy: createdById
      },
      {
        name: "Camiseta Lakers LeBron James",
        description: "Camiseta oficial de Los Angeles Lakers, edición legendaria de LeBron James. Tallas disponibles: S, M, L, XL.",
        price: 119.99,
        category: "Camisetas",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400",
        stock: 15,
        league: "NBA",
        createdBy: createdById
      },
      {
        name: "Zapatillas Jordan XXXVII",
        description: "Zapatillas de baloncesto Air Jordan XXXVII con tecnología Zoom Air. Edición limitada, máxima comodidad y rendimiento.",
        price: 199.99,
        category: "Calzado",
        image: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400",
        stock: 8,
        league: "NBA",
        createdBy: createdById
      },
      {
        name: "Balón Oficial ACB Molten",
        description: "Balón oficial de la Liga ACB, tamaño 7, homologado FIBA. Excelente agarre y durabilidad para competición.",
        price: 69.99,
        category: "Balones",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        stock: 30,
        league: "ACB",
        createdBy: createdById
      },
      {
        name: "Camiseta Real Madrid 2024",
        description: "Camiseta oficial del Real Madrid de baloncesto, temporada 2023-2024. Diseño exclusivo y materiales de alta calidad.",
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

async function createDefaultAdmin() {
  try {
    const bcrypt = require('bcryptjs');
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@baloncesto.com',
      password: await bcrypt.hash('admin123', 12),
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Usuario admin creado: admin@baloncesto.com / admin123');
    
  } catch (error) {
    console.error('❌ Error creando admin:', error);
  }
}

// ================== RUTAS ==================

// Usar rutas
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/cart", cartRoutes);

// Ruta de salud mejorada
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
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta de debug completa
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

// Ruta para forzar creación de productos (solo desarrollo)
app.post("/api/admin/initialize-products", async (req, res) => {
  try {
    await createDefaultProducts();
    const newCount = await Product.countDocuments();
    
    res.json({
      success: true,
      message: `Productos inicializados correctamente. Total: ${newCount}`,
      count: newCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Ruta de diagnóstico
app.get("/debug", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "debug.html"));
});

// ================== SOCKET.IO COMPLETO ==================

io.on("connection", (socket) => {
    console.log("✅ Nueva conexión Socket.IO:", socket.id);

    // ================== CHAT EN TIEMPO REAL ==================
    
    socket.on("joinChat", async (user) => {
        try {
            console.log(`👋 ${user.username} se unió al chat`);
            socket.join("chat-room");
            
            // Guardar mensaje de sistema
            const systemMessage = new ChatMessage({
                username: 'Sistema',
                message: `${user.username} se unió al chat`,
                room: "chat-room",
                type: "system"
            });
            await systemMessage.save();
            
            // Enviar historial del chat al usuario que se conecta
            try {
                const chatHistory = await ChatMessage.getChatHistory("chat-room", 50);
                socket.emit("chatHistory", chatHistory);
            } catch (historyError) {
                console.error("Error cargando historial:", historyError);
                socket.emit("chatHistory", []);
            }
            
            // Notificar a otros usuarios
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
            
            // Buscar usuario por username para obtener el ID
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
            
            // Guardar mensaje en BD
            const chatMessage = new ChatMessage({
                user: userId,
                username: data.username,
                message: data.message,
                room: "chat-room",
                type: "message"
            });
            
            await chatMessage.save();
            
            // Emitir mensaje a todos en la sala
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
            
            // Fallback: enviar mensaje sin persistencia
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

    // ================== NOTIFICACIONES EN TIEMPO REAL ==================
    
    socket.on("userActivity", (data) => {
        try {
            socket.broadcast.emit("userActivityUpdate", {
                username: data.username,
                activity: data.activity,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error en userActivity:", error);
        }
    });

    socket.on("productUpdate", (data) => {
        try {
            io.emit("productUpdated", {
                productId: data.productId,
                action: data.action,
                username: data.username,
                timestamp: new Date().toISOString()
            });
            console.log(`📦 Producto ${data.action}: ${data.productId} por ${data.username}`);
        } catch (error) {
            console.error("Error en productUpdate:", error);
        }
    });

    socket.on("cartUpdate", (data) => {
        try {
            socket.emit("cartUpdated", {
                action: data.action,
                item: data.item,
                cartTotal: data.cartTotal,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error en cartUpdate:", error);
        }
    });

    // ================== MANEJO DE DESCONEXIÓN ==================
    
    socket.on("disconnect", async (reason) => {
        console.log(`❌ Usuario desconectado: ${socket.id} - Razón: ${reason}`);
        
        try {
            socket.broadcast.emit("userStatusChanged", {
                socketId: socket.id,
                status: "offline",
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error en disconnect:", error);
        }
    });

    // ================== MANEJO DE ERRORES ==================
    
    socket.on("error", (error) => {
        console.error("❌ Error de socket:", error);
        socket.emit("socketError", { 
            message: "Error de conexión",
            code: error.code 
        });
    });

    console.log(`🎯 Socket ${socket.id} configurado correctamente`);
});

// ================== MANEJO DE ERRORES ==================

// Ruta no encontrada
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error("🔥 Error global:", error);
  res.status(500).json({
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === "development" ? error.message : "Contacta al administrador"
  });
});

// ================== INICIAR SERVIDOR ==================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`\n🎉 ==========================================`);
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🏀 Tienda de Baloncesto NBA/ACB`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Debug: http://localhost:${PORT}/api/debug/database`);
  console.log(`🔗 Frontend: http://localhost:${PORT}`);
  console.log(`🎉 ==========================================\n`);
});

module.exports = app;