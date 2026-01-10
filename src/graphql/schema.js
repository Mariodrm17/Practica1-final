const { gql } = require('graphql-tag'); // Necesitarás instalar graphql-tag si no va

const typeDefs = `#graphql
  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    category: String
    image: String
    stock: Int
    league: String
  }

  type OrderProduct {
    product: Product
    quantity: Int
    price: Float
  }

  type Order {
    id: ID!
    user: String # Devolvemos el ID del usuario
    products: [OrderProduct]
    total: Float
    status: String
    createdAt: String
  }

  type Query {
    hello: String
    getProducts: [Product]
    getProduct(id: ID!): Product
    getOrders: [Order] # Solo para admins idealmente
  }

  input ProductInput {
    productId: ID!
    quantity: Int!
    price: Float!
  }

  type Mutation {
    createOrder(userId: ID!, products: [ProductInput]!, total: Float!): Order
  }
`;

module.exports = typeDefs;