// debug-graphql.js
async function debugGraphQL() {
  const API = 'http://localhost:3000/graphql';
  
  console.log('🔍 DIAGNÓSTICO DE GRAPHQL\n');
  
  // Test simple
  const query = `query { hello }`;
  
  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const result = await response.json();
    
    console.log('📡 Respuesta completa:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      result.errors.forEach((err, i) => {
        console.log(`\nError ${i + 1}:`);
        console.log('Mensaje:', err.message);
        console.log('Ubicación:', err.locations);
        console.log('Path:', err.path);
        if (err.extensions) {
          console.log('Detalles:', err.extensions);
        }
      });
    }
    
    if (result.data) {
      console.log('\n✅ DATOS RECIBIDOS:');
      console.log(result.data);
    }
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    console.log('\n💡 Verifica que el servidor esté corriendo:');
    console.log('   npm start');
  }
}

debugGraphQL();