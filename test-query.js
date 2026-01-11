// test-query-complete.js
// TODAS las queries disponibles (algunas requieren Apollo Server)

async function testQuery() {
  console.log('🔍 Probando GraphQL Query...\n');
  
  // ============================================
  // CAMBIA ESTE NÚMERO para probar diferentes queries:
  // 
  // ✅ FUNCIONAN SIN APOLLO:
  // 1 = Ver todos los productos
  // 2 = Ver todos los pedidos
  // 
  // ⚠️ REQUIEREN APOLLO SERVER:
  // 3 = Hello (test básico)
  // 4 = Ver un producto específico
  // 5 = Ver productos por liga (NBA/ACB)
  // 6 = Ver pedidos por estado
  // 7 = Ver un pedido específico
  // 8 = Ver mis pedidos (por userId)
  // 9 = Ver mi carrito
  // 10 = Ver estadísticas de pedidos
  // ============================================
  const queryNumber = 3;
  // ============================================
  
  let query;
  let needsApollo = false;
  
  switch(queryNumber) {
    // ============================================
    // QUERIES QUE FUNCIONAN SIN APOLLO
    // ============================================
    
    case 1:
      console.log('📦 Query 1: Ver TODOS los productos');
      query = `
        query {
          getProducts {
            id
            name
            description
            price
            category
            image
            stock
            league
            isActive
            createdAt
          }
        }
      `;
      break;
      
    case 2:
      console.log('📋 Query 2: Ver TODOS los pedidos');
      query = `
        query {
          getOrders {
            id
            total
            status
            createdAt
          }
        }
      `;
      break;
    
    // ============================================
    // QUERIES QUE REQUIEREN APOLLO SERVER
    // ============================================
    
    case 3:
      console.log('👋 Query 3: Hello (test básico)');
      needsApollo = true;
      query = `
        query {
          hello
        }
      `;
      break;
    
    case 4:
      console.log('🔍 Query 4: Ver UN producto específico');
      needsApollo = true;
      // ⚠️ CAMBIA ESTE ID por uno real de tu BD:
      const productId = "69639bcbf79aa7fbbd0b510c";
      query = `
        query {
          getProduct(id: "${productId}") {
            id
            name
            description
            price
            category
            stock
            league
            createdBy {
              username
              email
            }
          }
        }
      `;
      break;
    
    case 5:
      console.log('🏀 Query 5: Ver productos por liga');
      needsApollo = true;
      // Opciones: "NBA", "ACB", "Ambas"
      const league = "NBA";
      query = `
        query {
          getProductsByLeague(league: "${league}") {
            id
            name
            price
            league
            stock
          }
        }
      `;
      break;
    
    case 6:
      console.log('📊 Query 6: Ver pedidos por estado');
      needsApollo = true;
      // Opciones: "pending", "completed"
      const status = "pending";
      query = `
        query {
          getOrders(status: "${status}") {
            id
            total
            status
            createdAt
            user {
              username
              email
            }
          }
        }
      `;
      break;
    
    case 7:
      console.log('📄 Query 7: Ver UN pedido específico');
      needsApollo = true;
      // ⚠️ CAMBIA ESTE ID por uno real de tu BD:
      const orderId = "TU_ORDER_ID_AQUI";
      query = `
        query {
          getOrder(id: "${orderId}") {
            id
            total
            status
            createdAt
            user {
              username
              email
            }
            products {
              product {
                name
                price
                image
              }
              quantity
              price
            }
          }
        }
      `;
      break;
    
    case 8:
      console.log('👤 Query 8: Ver MIS pedidos');
      needsApollo = true;
      // ⚠️ CAMBIA ESTE userId por uno real:
      const userId = "6909311a45c248155b76b7b5";
      query = `
        query {
          getMyOrders(userId: "${userId}") {
            id
            total
            status
            createdAt
            products {
              product {
                name
                price
              }
              quantity
            }
          }
        }
      `;
      break;
    
    case 9:
      console.log('🛒 Query 9: Ver mi carrito');
      needsApollo = true;
      // ⚠️ CAMBIA ESTE userId por uno real:
      const cartUserId = "6909311a45c248155b76b7b5";
      query = `
        query {
          getCart(userId: "${cartUserId}") {
            id
            total
            items {
              id
              product {
                name
                price
                image
                stock
              }
              quantity
              size
              price
            }
          }
        }
      `;
      break;
    
    case 10:
      console.log('📈 Query 10: Ver estadísticas de pedidos');
      needsApollo = true;
      query = `
        query {
          getOrderStats {
            totalOrders
            pendingOrders
            completedOrders
            totalRevenue
            averageOrderValue
          }
        }
      `;
      break;
      
    default:
      console.log('❌ Número de query inválido. Usa 1-10');
      return;
  }
  
  if (needsApollo) {
    console.log('⚠️  Esta query requiere Apollo Server activado\n');
  } else {
    console.log('✅ Esta query funciona en modo básico\n');
  }
  
  try {
    const response = await fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    if (data.data) {
      console.log('✅ RESPUESTA EXITOSA:\n');
      console.log(JSON.stringify(data.data, null, 2));
      
      // Mostrar resumen
      if (data.data.getProducts) {
        console.log(`\n📊 Total productos: ${data.data.getProducts.length}`);
      }
      if (data.data.getOrders) {
        console.log(`\n📊 Total pedidos: ${data.data.getOrders.length}`);
      }
      if (data.data.getMyOrders) {
        console.log(`\n📊 Mis pedidos: ${data.data.getMyOrders.length}`);
      }
      if (data.data.getCart) {
        console.log(`\n📊 Productos en carrito: ${data.data.getCart.items.length}`);
        console.log(`💰 Total: €${data.data.getCart.total}`);
      }
      
    } else if (data.errors) {
      console.log('❌ ERROR:\n');
      console.log(data.errors[0].message);
      
      if (data.errors[0].message.includes('Apollo')) {
        console.log('\n💡 SOLUCIÓN: Activa Apollo Server para usar esta query');
        console.log('   Edita server.js y descomenta las líneas de Apollo');
      }
    }
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo:');
    console.log('   npm start');
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('       🏀 TEST DE QUERIES GRAPHQL - BALONCESTO SHOP');
console.log('═══════════════════════════════════════════════════════\n');

testQuery();