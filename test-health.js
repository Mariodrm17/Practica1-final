// test-health.js
async function checkHealth() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    console.log('🏥 SALUD DEL SERVIDOR:\n');
    console.log('Estado:', data.status);
    console.log('GraphQL:', data.graphql.status);
    console.log('Endpoint:', data.graphql.endpoint);
    console.log('Base de datos:', data.database.status);
    console.log('Productos:', data.database.products);
    console.log('Usuarios:', data.database.users);
    
    if (data.graphql.status.includes('❌')) {
      console.log('\n⚠️ PROBLEMA: Apollo Server no está iniciado');
      console.log('Revisa los logs del servidor (npm start)');
    } else {
      console.log('\n✅ Servidor completamente listo para GraphQL');
      console.log('🚀 Puedes probar ahora: node debug-graphql.js');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('¿El servidor está corriendo? (npm start)');
  }
}

checkHealth();