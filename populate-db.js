// populate-db.js - VERSIÓN FINAL - Poblar base de datos
require('dotenv').config();
const mongoose = require('mongoose');

async function populateDatabase() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Modelos
    const productSchema = new mongoose.Schema({
      name: String,
      description: String,
      price: Number,
      category: String,
      image: String,
      stock: Number,
      league: String,
      createdBy: mongoose.Schema.Types.ObjectId,
      isActive: { type: Boolean, default: true }
    }, { timestamps: true, strict: false });

    const userSchema = new mongoose.Schema({}, { strict: false });

    const Product = mongoose.model('Product', productSchema);
    const User = mongoose.model('User', userSchema);

    // BUSCAR CUALQUIER USUARIO
    console.log('👤 Buscando usuarios en la BD...');
    const users = await User.find({});
    console.log(`   Encontrados: ${users.length} usuarios`);
    
    let userId;
    if (users.length > 0) {
      userId = users[0]._id;
      console.log(`✅ Usando usuario: ${users[0].username || users[0].email || 'Usuario sin nombre'}`);
    } else {
      userId = new mongoose.Types.ObjectId();
      console.log('⚠️  No hay usuarios, usando ID genérico');
    }
    console.log(`   ID: ${userId}\n`);

    // LIMPIAR PRODUCTOS EXISTENTES
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`📦 Productos existentes: ${existingCount}`);
      console.log('🗑️  Eliminando productos anteriores...');
      await Product.deleteMany({});
      console.log('✅ Productos eliminados\n');
    }

    // CREAR PRODUCTOS
    const productos = [
      {
        name: "Balón Oficial NBA Spalding",
        description: "Balón de baloncesto oficial de la NBA, tamaño 7, material de cuero sintético premium.",
        price: 89.99,
        category: "Balones",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        stock: 25,
        league: "NBA",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Balón Wilson Evolution",
        description: "Balón más vendido para juego interior, textura microfiber composite.",
        price: 79.99,
        category: "Balones",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        stock: 30,
        league: "NBA",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Camiseta Lakers LeBron James #23",
        description: "Camiseta oficial de Los Angeles Lakers. Material Dri-FIT.",
        price: 119.99,
        category: "Camisetas",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400",
        stock: 15,
        league: "NBA",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Camiseta Warriors Stephen Curry #30",
        description: "Jersey oficial Golden State Warriors, edición statement.",
        price: 109.99,
        category: "Camisetas",
        image: "https://images.unsplash.com/photo-1614624532983-1fe212c7d6e5?w=400",
        stock: 20,
        league: "NBA",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Camiseta Bulls Michael Jordan #23",
        description: "Camiseta retro Chicago Bulls, edición clásica roja.",
        price: 149.99,
        category: "Camisetas",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400",
        stock: 8,
        league: "NBA",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Nike Air Jordan XXXVII",
        description: "Zapatillas Air Jordan 37, tecnología Zoom Air.",
        price: 199.99,
        category: "Calzado",
        image: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400",
        stock: 12,
        league: "NBA",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Nike LeBron 21",
        description: "Zapatillas de LeBron James, amortiguación Air Zoom.",
        price: 189.99,
        category: "Calzado",
        image: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400",
        stock: 10,
        league: "NBA",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Balón Oficial ACB Molten BG5000",
        description: "Balón oficial Liga Endesa ACB, homologado FIBA.",
        price: 69.99,
        category: "Balones",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        stock: 35,
        league: "ACB",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Balón ACB Edición Especial Playoff",
        description: "Balón conmemorativo playoffs ACB 2024.",
        price: 99.99,
        category: "Balones",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        stock: 5,
        league: "ACB",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Camiseta Real Madrid 2023/24",
        description: "Camiseta oficial del Real Madrid de baloncesto.",
        price: 89.99,
        category: "Camisetas",
        image: "https://images.unsplash.com/photo-1614624532983-1fe212c7d6e5?w=400",
        stock: 25,
        league: "ACB",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Camiseta FC Barcelona Lassa",
        description: "Jersey oficial del Barça basket.",
        price: 89.99,
        category: "Camisetas",
        image: "https://images.unsplash.com/photo-1614624532983-1fe212c7d6e5?w=400",
        stock: 22,
        league: "ACB",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Camiseta Baskonia Retro",
        description: "Camiseta retro del Baskonia años 90.",
        price: 79.99,
        category: "Camisetas",
        image: "https://images.unsplash.com/photo-1614624532983-1fe212c7d6e5?w=400",
        stock: 10,
        league: "ACB",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Canasta Portátil Spalding NBA",
        description: "Canasta portátil profesional, altura regulable.",
        price: 399.99,
        category: "Equipamiento",
        image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400",
        stock: 8,
        league: "Ambas",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Bomba de Inflado Doble Acción",
        description: "Bomba profesional con manómetro.",
        price: 19.99,
        category: "Equipamiento",
        image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400",
        stock: 50,
        league: "Ambas",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Mochila NBA Team Collection",
        description: "Mochila oficial NBA con compartimentos.",
        price: 59.99,
        category: "Accesorios",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        stock: 40,
        league: "NBA",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Toalla de Entrenamiento Nike",
        description: "Toalla deportiva con logo NBA.",
        price: 24.99,
        category: "Accesorios",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        stock: 60,
        league: "Ambas",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Medias Compresión Nike Elite NBA",
        description: "Medias de compresión oficiales NBA.",
        price: 29.99,
        category: "Ropa",
        image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5b?w=400",
        stock: 45,
        league: "NBA",
        createdBy: userId,
        isActive: true
      },
      {
        name: "Pantalón Corto Reversible ACB",
        description: "Pantalón reversible oficial ACB.",
        price: 39.99,
        category: "Ropa",
        image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5b?w=400",
        stock: 30,
        league: "ACB",
        createdBy: userId,
        isActive: true
      }
    ];

    console.log(`🏀 Insertando ${productos.length} productos...`);
    const insertados = await Product.insertMany(productos);
    console.log(`✅ ${insertados.length} productos creados!\n`);

    // RESUMEN
    const nba = await Product.countDocuments({ league: 'NBA' });
    const acb = await Product.countDocuments({ league: 'ACB' });
    const ambas = await Product.countDocuments({ league: 'Ambas' });

    console.log('📊 RESUMEN FINAL:');
    console.log(`   🏀 NBA: ${nba} productos`);
    console.log(`   🏀 ACB: ${acb} productos`);
    console.log(`   🏀 Ambas: ${ambas} productos`);
    console.log(`   🏀 TOTAL: ${insertados.length} productos\n`);
    
    console.log('🎉 ¡BASE DE DATOS POBLADA!\n');
    console.log('💡 AHORA EJECUTA:');
    console.log('   node test-graphql.js\n');

    await mongoose.disconnect();
    console.log('🔌 Desconectado');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

populateDatabase();