# Practica1# 🛍️ Portal de Productos

Una aplicación web completa que incluye gestión de productos, sistema de autenticación con JWT y chat en tiempo real.

## 🚀 Características

- **Autenticación JWT**: Registro y login seguro
- **Gestión de Roles**: Usuario y Administrador
- **CRUD de Productos**: Crear, leer, actualizar y eliminar productos
- **Chat en Tiempo Real**: Comunicación instantánea entre usuarios
- **Base de Datos MongoDB**: Persistencia de datos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: Node.js, Express.js
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JSON Web Tokens (JWT)
- **Tiempo Real**: Socket.IO
- **Seguridad**: Bcrypt para hashing de contraseñas

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MongoDB (local o Atlas)
- npm o yarn

## 🔧 Instalación y Configuración

1. **Clonar el repositorio**
   ```bash
   git clone [url-del-repositorio]
   cd portal-productos


# 🏀 Portal E-Commerce de Baloncesto - Práctica 2 GraphQL

> **Tienda online de productos de baloncesto NBA/ACB con GraphQL, JWT y Socket.IO**

---

## 📋 Descripción del Proyecto

Portal de e-commerce especializado en productos de baloncesto (NBA y ACB) desarrollado con:

- ✅ **GraphQL** integrado para consultas de productos, pedidos y carrito
- ✅ **MongoDB Atlas** como base de datos
- ✅ **Autenticación JWT** con roles (admin/user)
- ✅ **Socket.IO** para chat en tiempo real
- ✅ **REST API** complementaria para operaciones CRUD

---

## 🚀 Instalación y Configuración

### 1. **Requisitos Previos**

- Node.js v14 o superior
- MongoDB Atlas (cuenta gratuita en https://www.mongodb.com/atlas)
- npm o yarn

### 2. **Clonar el repositorio**

```bash
git clone <URL_DEL_REPOSITORIO>
cd portal-productos
```

### 3. **Instalar dependencias**

```bash
npm install
```

### 4. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/baloncesto_shop
JWT_SECRET=tu_clave_secreta_super_segura
PORT=3000
```

### 5. **Iniciar el servidor**

```bash
npm start
```

El servidor estará disponible en: **http://localhost:3000**

---

## 🔑 Credenciales de Acceso

### **Usuario Administrador (predeterminado)**

- **Email:** `admin@baloncesto.com`
- **Contraseña:** `admin123`
- **Rol:** `admin`

### **Crear nuevo usuario**

Registrarse desde la interfaz web o usar el endpoint:

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "usuario_prueba",
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "role": "user"
}
```

---

## 📡 GraphQL API

### **Endpoint GraphQL**

```
POST http://localhost:3000/graphql
Content-Type: application/json
```

### **Queries Disponibles**

#### 1. **Obtener todos los productos**

```graphql
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
```

#### 2. **Filtrar productos por liga**

```graphql
query {
  getProductsByLeague(league: "NBA") {
    id
    name
    price
    league
    stock
  }
}
```

**Opciones de liga:** `"NBA"`, `"ACB"`, `"Ambas"`

#### 3. **Obtener un producto específico**

```graphql
query {
  getProduct(id: "PRODUCT_ID") {
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
```

#### 4. **Ver todos los pedidos**

```graphql
query {
  getOrders {
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
      }
      quantity
    }
  }
}
```

#### 5. **Ver pedidos por estado**

```graphql
query {
  getOrders(status: "pending") {
    id
    total
    status
    createdAt
  }
}
```

**Estados disponibles:** `"pending"`, `"completed"`

#### 6. **Ver mis pedidos (usuario logueado)**

```graphql
query {
  getMyOrders(userId: "USER_ID") {
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
```

#### 7. **Ver mi carrito**

```graphql
query {
  getCart(userId: "USER_ID") {
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
```

#### 8. **Estadísticas de pedidos (admin)**

```graphql
query {
  getOrderStats {
    totalOrders
    pendingOrders
    completedOrders
    totalRevenue
    averageOrderValue
  }
}
```

#### 9. **Test básico**

```graphql
query {
  hello
}
```

---

### **Mutations Disponibles**

#### 1. **Añadir producto al carrito**

```graphql
mutation {
  addToCart(
    userId: "USER_ID"
    productId: "PRODUCT_ID"
    quantity: 1
    size: "M"
  ) {
    id
    total
    items {
      product {
        name
      }
      quantity
    }
  }
}
```

#### 2. **Eliminar producto del carrito**

```graphql
mutation {
  removeFromCart(
    userId: "USER_ID"
    itemId: "ITEM_ID"
  ) {
    id
    total
  }
}
```

#### 3. **Vaciar carrito**

```graphql
mutation {
  clearCart(userId: "USER_ID") {
    id
    total
  }
}
```

#### 4. **Crear pedido**

```graphql
mutation {
  createOrder(
    userId: "USER_ID"
    products: [
      { productId: "PRODUCT_ID", quantity: 2, price: 89.99 }
    ]
    total: 179.98
  ) {
    id
    total
    status
    products {
      product {
        name
      }
      quantity
    }
  }
}
```

#### 5. **Actualizar estado de pedido (admin)**

```graphql
mutation {
  updateOrderStatus(
    orderId: "ORDER_ID"
    status: "completed"
  ) {
    id
    status
  }
}
```

---

## 🛠️ REST API (Complementaria)

### **Autenticación**

#### Registro

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "usuario",
  "email": "email@ejemplo.com",
  "password": "password123",
  "role": "user"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@baloncesto.com",
  "password": "admin123"
}
```

**Respuesta:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "USER_ID",
    "username": "admin",
    "email": "admin@baloncesto.com",
    "role": "admin"
  }
}
```

### **Productos**

```http
GET    /api/products           # Obtener todos
GET    /api/products/:id       # Obtener uno
POST   /api/products           # Crear (admin)
PUT    /api/products/:id       # Actualizar (admin)
DELETE /api/products/:id       # Eliminar (admin)
```

### **Carrito**

```http
GET    /api/cart               # Ver carrito
POST   /api/cart/add           # Añadir producto
PUT    /api/cart/update/:id    # Actualizar cantidad
DELETE /api/cart/remove/:id    # Eliminar producto
DELETE /api/cart/clear          # Vaciar carrito
```

### **Pedidos**

```http
POST   /api/orders/checkout    # Crear pedido
GET    /api/orders/my-orders   # Mis pedidos
GET    /api/orders/:id         # Ver pedido
GET    /api/orders/admin/all   # Todos los pedidos (admin)
PUT    /api/orders/admin/:id/status  # Cambiar estado (admin)
```

---

## 💬 Chat en Tiempo Real (Socket.IO)

### **Eventos disponibles:**

```javascript
// Cliente se conecta al chat
socket.emit('joinChat', { 
  username: 'usuario',
  role: 'user'
});

// Enviar mensaje
socket.emit('sendMessage', {
  username: 'usuario',
  message: 'Hola!'
});

// Indicador de escritura
socket.emit('typing', {
  username: 'usuario',
  isTyping: true
});

// Recibir nuevo mensaje
socket.on('newMessage', (data) => {
  console.log(data.username, data.message);
});

// Usuario se unió
socket.on('userJoined', (user) => {
  console.log(`${user.username} se unió`);
});
```

---

## 📦 Base de Datos

### **Modelos de Datos**

#### **User**

```javascript
{
  username: String,
  email: String,
  password: String (hash),
  role: "user" | "admin",
  createdAt: Date
}
```

#### **Product**

```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  stock: Number,
  league: "NBA" | "ACB" | "Ambas",
  sizes: [String],
  isActive: Boolean,
  createdBy: ObjectId (User),
  createdAt: Date
}
```

#### **Order**

```javascript
{
  user: ObjectId (User),
  products: [{
    product: ObjectId (Product),
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: "pending" | "completed",
  createdAt: Date
}
```

#### **Cart**

```javascript
{
  user: ObjectId (User),
  items: [{
    product: ObjectId (Product),
    quantity: Number,
    price: Number,
    size: String
  }],
  total: Number
}
```

---

## 🧪 Probar la Aplicación

### **1. Probar GraphQL desde la terminal**

Crea un archivo `test-graphql.js`:

```javascript
async function test() {
  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query { getProducts { id name price league } }`
    })
  });
  
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
```

Ejecutar:

```bash
node test-graphql.js
```

### **2. Probar desde el frontend**

1. Abre http://localhost:3000
2. Inicia sesión con `admin@baloncesto.com` / `admin123`
3. Navega por los productos
4. Usa los filtros (NBA, ACB, etc.)
5. Abre la consola del navegador para ver las queries GraphQL

### **3. Verificar salud del servidor**

```http
GET http://localhost:3000/api/health
```

**Respuesta esperada:**

```json
{
  "status": "OK",
  "message": "🚀 Servidor funcionando correctamente",
  "database": {
    "status": "connected",
    "products": 18,
    "users": 1
  },
  "graphql": {
    "status": "✅ MODO BÁSICO ACTIVO",
    "endpoint": "http://localhost:3000/graphql"
  }
}
```

---

## 📁 Estructura del Proyecto

```
portal-productos/
├── src/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   └── ChatMessage.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── adminRoutes.js
│   │   └── chatRoutes.js
│   ├── graphql/
│   │   ├── schema.js
│   │   └── resolvers.js
│   ├── middleware/
│   │   └── authenticateJWT.js
│   ├── public/
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── client.js
│   └── server.js
├── .env
├── package.json
└── README.md
```

---

## 🎯 Funcionalidades Implementadas

### ✅ **Requisitos cumplidos:**

- [x] **GraphQL** integrado (queries + mutations)
- [x] **MongoDB Atlas** con 18 productos de baloncesto
- [x] **Autenticación JWT** con roles
- [x] **CRUD de productos** (admin)
- [x] **Sistema de carrito** de compras
- [x] **Gestión de pedidos**
- [x] **Chat en tiempo real** (Socket.IO)
- [x] **API REST** complementaria
- [x] **Frontend responsive** con filtros

---

## 🐛 Solución de Problemas

### **Error: Cannot connect to MongoDB**

Verifica que tu `MONGODB_URI` en `.env` sea correcta y que tu IP esté en la whitelist de MongoDB Atlas.

### **Error: GraphQL query no funciona**

Asegúrate de que el servidor esté corriendo (`npm start`) y que el endpoint sea correcto (`/graphql`).

### **Error: Token inválido**

El token JWT expira en 24 horas. Vuelve a iniciar sesión.

### **No aparecen productos**

Ejecuta el servidor con `npm start` - automáticamente creará productos de ejemplo si la base de datos está vacía.

---

## 👥 Autor

**Nombre:** [Tu Nombre]  
**Asignatura:** Desarrollo Web  
**Práctica:** 2 - E-commerce con GraphQL  
**Fecha:** Enero 2026

---

## 📄 Licencia

Este proyecto es parte de una práctica académica.

---

## 🏀 ¡Gracias por revisar el proyecto!

Para cualquier duda o consulta, contacta al autor.