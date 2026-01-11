const typeDefs = `#graphql
  # ==================== TIPOS ====================
  
  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    category: String
    image: String
    stock: Int
    league: String
    sizes: [String]
    isActive: Boolean
    createdBy: User
    createdAt: String
  }

  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
  }

  type OrderProduct {
    product: Product
    quantity: Int!
    price: Float!
  }

  type Order {
    id: ID!
    user: User
    products: [OrderProduct]!
    total: Float!
    status: String!
    createdAt: String
  }

  type CartItem {
    id: ID!
    product: Product
    quantity: Int!
    price: Float!
    size: String
  }

  type Cart {
    id: ID!
    user: String!
    items: [CartItem]!
    total: Float!
  }

  type OrderStats {
    totalOrders: Int!
    pendingOrders: Int!
    completedOrders: Int!
    totalRevenue: Float!
    averageOrderValue: Float!
  }

  # ==================== QUERIES ====================
  
  type Query {
    # Test
    hello: String!
    
    # Productos
    getProducts: [Product]!
    getProduct(id: ID!): Product
    getProductsByLeague(league: String!): [Product]!
    
    # Pedidos
    getOrders(status: String): [Order]!
    getOrder(id: ID!): Order
    getMyOrders(userId: ID!): [Order]!
    
    # Carrito
    getCart(userId: ID!): Cart
    
    # Estadísticas
    getOrderStats: OrderStats
  }

  # ==================== INPUTS ====================
  
  input ProductInput {
    productId: ID!
    quantity: Int!
    price: Float!
  }

  # ==================== MUTATIONS ====================
  
  type Mutation {
    # Pedidos
    createOrder(
      userId: ID!
      products: [ProductInput]!
      total: Float!
    ): Order
    
    updateOrderStatus(
      orderId: ID!
      status: String!
    ): Order
    
    # Carrito
    addToCart(
      userId: ID!
      productId: ID!
      quantity: Int!
      size: String
    ): Cart
    
    removeFromCart(
      userId: ID!
      itemId: ID!
    ): Cart
    
    clearCart(userId: ID!): Cart
  }
`;

module.exports = typeDefs;