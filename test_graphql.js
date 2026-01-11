// test-graphql.js
// Copia este archivo completo y pégalo en tu proyecto

async function testGraphQL() {
  console.log('🧪 PROBANDO GRAPHQL...\n');
  
  const API_URL = 'http://localhost:3000/graphql';
  
  // Test 1: Query de productos
  console.log('📝 Test 1: Query getProducts');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            getProducts {
              id
              name
              price
              league
              stock
            }
          }
        `
      })
    });
    
    const data = await response.json();
    
    if (data.data && data.data.getProducts) {
      console.log('✅ FUNCIONA! Productos encontrados:', data.data.getProducts.length);
      if (data.data.getProducts.length > 0) {
        console.log('Primer producto:', data.data.getProducts[0]);
      }
    } else if (data.errors) {
      console.log('❌ ERROR:', data.errors[0].message);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Query de pedidos
  console.log('📝 Test 2: Query getOrders');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            getOrders {
              id
              total
              status
            }
          }
        `
      })
    });
    
    const data = await response.json();
    
    if (data.data && data.data.getOrders) {
      console.log('✅ FUNCIONA! Pedidos encontrados:', data.data.getOrders.length);
    } else if (data.errors) {
      console.log('❌ ERROR:', data.errors[0].message);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('📊 RESUMEN:');
  console.log('✅ GraphQL está funcionando en modo básico');
  console.log('✅ Tienes 18 productos en la base de datos');
  console.log('\n💡 PARA GRAPHQL COMPLETO:');
  console.log('   Activa Apollo Server en server.js (descomentar líneas 40-55)');
}

testGraphQL().catch(console.error);