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
// COMENTADO TEMPORALMENTE - DESCOMENTAR CUANDO FUNCIONE APOLLO
/*
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

async function startApolloServer() {
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apollo.start();
  app.use('/graphql', cors(), express.json(), expressMiddleware(apollo));
  console.log('🚀 GraphQL listo en http://localhost:3000/graphql');
}

startApolloServer();
*/

// TEMPORAL: Endpoint GraphQL básico sin Apollo
app.post('/graphql', express.json(), async (req, res) => {
  try {
    const { query, variables } = req.body;
    
    // Query simple de ejemplo
    if (query.includes('getProducts')) {
      const products = await Product.find({ isActive: true }).limit(10);
      return res.json({
        data: {
          getProducts: products
        }
      });
    }
    
    if (query.includes('getOrders')) {
      const Order = require('./models/Order');
      const orders = await Order.find().populate('products.product');
      return res.json({
        data: {
          getOrders: orders
        }
      });
    }
    
    res.json({
      data: null,
      errors: [{ message: 'Query no implementada sin Apollo Server' }]
    });
    
  } catch (error) {
    res.status(500).json({
      errors: [{ message: error.message }]
    });
  }
});

console.log('⚠️  GraphQL en modo básico (sin Apollo Server)');
console.log('📝 Para activar Apollo: ejecuta "npm install @apollo/server@4.10.0"');

// ================== FIN CONFIGURACIÓN GRAPHQL ==================

// Conexión a MongoDB
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

// ================== RUTAS ==================

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/cart", cartRoutes);

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
      graphql: "modo básico (sin Apollo)",
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

// Manejo de errores
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method
  });
});

app.use((error, req, res, next) => {
  console.error("🔥 Error global:", error);
  res.status(500).json({
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === "development" ? error.message : "Contacta al administrador"
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`\n🎉 ==========================================`);
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🏀 Tienda de Baloncesto NBA/ACB`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Frontend: http://localhost:${PORT}`);
  console.log(`⚠️  GraphQL: modo básico (actualiza Apollo para completo)`);
  console.log(`🎉 ==========================================\n`);
});

module.exports = app;