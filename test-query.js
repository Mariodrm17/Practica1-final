// test-query.js
// Queries que FUNCIONAN en modo básico (sin Apollo Server)

async function testQuery() {
  console.log('🔍 Probando GraphQL Query...\n');
  
  // ============================================
  // CAMBIA ESTE NÚMERO para probar diferentes queries:
  // 1 = Ver todos los productos
  // 2 = Ver todos los pedidos
  // ============================================
  const queryNumber = 1;
  // ============================================
  
  let query;
  
  switch(queryNumber) {
    case 1:
      console.log('📦 Query: Ver TODOS los productos\n');
      query = `
        query {
          getProducts {
            id
            name
            price
            category
            league
            stock
            isActive
          }
        }
      `;
      break;
      
    case 2:
      console.log('📋 Query: Ver TODOS los pedidos\n');
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
      
    default:
      console.log('❌ Número de query inválido. Usa 1 o 2');
      return;
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
      
    } else if (data.errors) {
      console.log('❌ ERROR:\n');
      console.log(data.errors[0].message);
      console.log('\n💡 Esta query requiere Apollo Server activado');
    }
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo:');
    console.log('   npm start');
  }
}

testQuery();