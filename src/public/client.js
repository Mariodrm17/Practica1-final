// client.js - VERSIÓN CON GRAPHQL INTEGRADO
class BasketballStore {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        this.socket = null;
        this.products = [];
        this.API_BASE = window.location.origin;
        this.GRAPHQL_ENDPOINT = `${this.API_BASE}/graphql`;
        this.init();
    }

    // Método helper para obtener el userId correctamente
    getUserId() {
        if (!this.user) return null;
        // Intentar _id primero (MongoDB), luego id, luego userId
        return this.user._id || this.user.id || this.user.userId || null;
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupNavigation();
    }

    // ==================== MÉTODOS GRAPHQL ====================
    
    async graphqlQuery(query, variables = {}) {
        try {
            const response = await fetch(this.GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token && { 'Authorization': `Bearer ${this.token}` })
                },
                body: JSON.stringify({ query, variables })
            });

            const result = await response.json();

            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            return result.data;
        } catch (error) {
            console.error('GraphQL Error:', error);
            throw error;
        }
    }

    // ==================== AUTENTICACIÓN (REST) ====================

    async checkAuth() {
        if (this.token) {
            try {
                const response = await fetch(`${this.API_BASE}/api/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.user = data.user;
                    this.showAuthenticatedUI();
                    this.connectToChat();
                    this.loadProducts();
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Error verificando autenticación:', error);
                this.logout();
            }
        }
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Message form
        document.getElementById('message-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Create product form
        const createProductForm = document.getElementById('create-product-form');
        if (createProductForm) {
            createProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createProduct();
            });
        }

        // Message input typing indicator
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            let typingTimer;
            messageInput.addEventListener('input', () => {
                if (this.socket) {
                    this.socket.emit('typing', {
                        username: this.user.username,
                        isTyping: true
                    });

                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(() => {
                        this.socket.emit('typing', {
                            username: this.user.username,
                            isTyping: false
                        });
                    }, 1000);
                }
            });
        }
    }

    setupNavigation() {
        // Filtros de productos
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterProducts(filter);

                // Actualizar botones activos
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    async login() {
        const form = document.getElementById('login-form');
        const inputs = form.querySelectorAll('input');
        const submitBtn = form.querySelector('button');

        submitBtn.textContent = 'Entrando...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: inputs[0].value,
                    password: inputs[1].value
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                this.showAuthenticatedUI();
                this.connectToChat();
                this.loadProducts();
                this.showNotification('¡Bienvenido de nuevo! 🏀', 'success');
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showNotification('Error de conexión', 'error');
        } finally {
            submitBtn.textContent = 'Entrar';
            submitBtn.disabled = false;
        }
    }

    async register() {
        const form = document.getElementById('register-form');
        const submitBtn = form.querySelector('button');
        
        // Obtener valores directamente del formulario
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('role').value;
        
        submitBtn.textContent = 'Registrando...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    role: role
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('¡Registro exitoso! Por favor inicia sesión.', 'success');
                showLogin();
                form.reset();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.showNotification('Error de conexión', 'error');
        } finally {
            submitBtn.textContent = 'Registrarse';
            submitBtn.disabled = false;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        document.getElementById('auth-buttons').style.display = 'block';
        document.getElementById('user-menu').style.display = 'none';
        document.getElementById('products-section').style.display = 'none';
        document.getElementById('chat-section').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('register-section').style.display = 'none';
        document.getElementById('create-product-section').style.display = 'none';

        this.showNotification('¡Sesión cerrada! 👋', 'info');
    }

    showAuthenticatedUI() {
        document.getElementById('auth-buttons').style.display = 'none';
        document.getElementById('user-menu').style.display = 'block';
        document.getElementById('username-display').textContent = `🏀 ${this.user.username} (${this.user.role})`;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('register-section').style.display = 'none';
        document.getElementById('products-section').style.display = 'block';

        // Mostrar panel de admin si es administrador
        if (this.user.role === 'admin') {
            document.getElementById('admin-panel').style.display = 'block';
            const createProductBtn = document.getElementById('create-product-btn');
            const adminOrdersBtn = document.getElementById('admin-orders-btn');
            const adminUsersBtn = document.getElementById('admin-users-btn');
            if (createProductBtn) createProductBtn.style.display = 'inline-block';
            if (adminOrdersBtn) adminOrdersBtn.style.display = 'inline-block';
            if (adminUsersBtn) adminUsersBtn.style.display = 'inline-block';
        } else {
            document.getElementById('admin-panel').style.display = 'none';
            const createProductBtn = document.getElementById('create-product-btn');
            const adminOrdersBtn = document.getElementById('admin-orders-btn');
            const adminUsersBtn = document.getElementById('admin-users-btn');
            if (createProductBtn) createProductBtn.style.display = 'none';
            if (adminOrdersBtn) adminOrdersBtn.style.display = 'none';
            if (adminUsersBtn) adminUsersBtn.style.display = 'none';
        }

        this.loadProducts();
        this.loadCart(); // Cargar carrito al iniciar sesión
    }

    // ==================== PRODUCTOS CON GRAPHQL ====================

    async loadProducts() {
        try {
            console.log('🔄 Cargando productos con GraphQL...');
            const productsList = document.getElementById('products-list');
            productsList.innerHTML = '<div class="loading">Cargando productos... 🏀</div>';

            // QUERY GRAPHQL para obtener productos
            const query = `
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

            const data = await this.graphqlQuery(query);

            if (data.getProducts && Array.isArray(data.getProducts)) {
                this.products = data.getProducts;
                console.log(`✅ ${this.products.length} productos cargados con GraphQL`);
                this.renderProducts(this.products);
            } else {
                throw new Error('Formato de respuesta inválido');
            }

        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            const productsList = document.getElementById('products-list');
            productsList.innerHTML = `
                <div class="error">
                    <h3>Error cargando productos</h3>
                    <p>${error.message}</p>
                    <button onclick="app.loadProducts()">🔄 Reintentar</button>
                </div>
            `;
        }
    }

    async filterProducts(filter) {
        try {
            let query;

            switch (filter) {
                case 'nba':
                case 'acb':
                    // Usar GraphQL para filtrar por liga
                    const league = filter.toUpperCase();
                    query = `
                        query {
                            getProductsByLeague(league: "${league}") {
                                id
                                name
                                description
                                price
                                category
                                image
                                stock
                                league
                                isActive
                            }
                        }
                    `;
                    const data = await this.graphqlQuery(query);
                    this.renderProducts(data.getProductsByLeague || []);
                    return;

                case 'balls':
                    this.renderProducts(this.products.filter(p => p.category === 'Balones'));
                    return;

                case 'jerseys':
                    this.renderProducts(this.products.filter(p => p.category === 'Camisetas'));
                    return;

                case 'shoes':
                    this.renderProducts(this.products.filter(p => p.category === 'Calzado'));
                    return;

                case 'under50':
                    this.renderProducts(this.products.filter(p => p.price < 50));
                    return;

                case 'in-stock':
                    this.renderProducts(this.products.filter(p => p.stock > 0));
                    return;

                default:
                    this.renderProducts(this.products);
            }
        } catch (error) {
            console.error('Error filtrando productos:', error);
            this.showNotification('Error aplicando filtro', 'error');
        }
    }

    renderProducts(products) {
        const productsList = document.getElementById('products-list');
        productsList.innerHTML = '';

        if (!products || products.length === 0) {
            productsList.innerHTML = `
                <div class="no-products">
                    <h3>🏀 No hay productos disponibles</h3>
                    <p>No se encontraron productos con este filtro.</p>
                    ${this.user && this.user.role === 'admin' ?
                    '<button onclick="showCreateProduct()">➕ Crear primer producto</button>' :
                    '<p>Vuelve más tarde o contacta al administrador.</p>'
                }
                </div>
            `;
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="league-badge ${product.league === 'NBA' ? 'nba-badge' : product.league === 'ACB' ? 'acb-badge' : 'both-badge'}">
                    ${product.league}
                </div>
                <img src="${product.image || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'}" alt="${product.name}" class="product-image">
                <h3>${product.name}</h3>
                <p class="description">${product.description}</p>
                <div class="price">€${product.price.toFixed(2)}</div>
                <span class="category">${product.category}</span>
                <div class="stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${product.stock > 0 ? `🏀 Stock: ${product.stock} unidades` : '❌ Agotado'}
                </div>
                ${this.user && product.stock > 0 ? `
                    <button class="btn-add-cart" onclick="addToCart('${product.id}')">
                        🛒 Añadir al Carrito
                    </button>
                ` : ''}
                ${this.user && this.user.role === 'admin' ? `
                    <div class="admin-actions">
                        <button class="edit-btn" onclick="editProduct('${product.id}')">✏️ Editar</button>
                        <button class="delete-btn" onclick="deleteProduct('${product.id}')">🗑️ Eliminar</button>
                    </div>
                ` : ''}
            `;
            productsList.appendChild(productCard);
        });
    }

    // ==================== CREAR PRODUCTO (REST - Admin) ====================

    async createProduct() {
        const form = document.getElementById('create-product-form');
        const formData = new FormData(form);

        try {
            const response = await fetch(`${this.API_BASE}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    description: formData.get('description'),
                    price: parseFloat(formData.get('price')),
                    category: formData.get('category'),
                    league: formData.get('league'),
                    stock: parseInt(formData.get('stock')),
                    image: formData.get('image') || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('¡Producto creado exitosamente! 🎉', 'success');
                form.reset();
                showProducts();
                this.loadProducts();
            } else {
                this.showNotification(data.message || 'Error creando producto', 'error');
            }
        } catch (error) {
            console.error('Error creando producto:', error);
            this.showNotification('Error de conexión', 'error');
        }
    }

    // ==================== CHAT CON SOCKET.IO ====================

    connectToChat() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Conectado al chat');
            this.socket.emit('joinChat', {
                username: this.user.username,
                role: this.user.role
            });
        });

        this.socket.on('newMessage', (data) => {
            this.displayMessage(data);
        });

        this.socket.on('userJoined', (user) => {
            this.displaySystemMessage(`🎉 ${user.username} se unió al chat`);
        });

        this.socket.on('userLeft', (user) => {
            this.displaySystemMessage(`👋 ${user.username} abandonó el chat`);
        });

        this.socket.on('typing', (data) => {
            this.showTypingIndicator(data);
        });
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (message && this.socket) {
            this.socket.emit('sendMessage', {
                username: this.user.username,
                message: message,
                timestamp: new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            });
            input.value = '';
        }
    }

    displayMessage(data) {
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.innerHTML = `
            <span class="user">${data.username}:</span>
            <span>${data.message}</span>
            <span class="timestamp">${data.timestamp}</span>
        `;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    displaySystemMessage(message) {
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.innerHTML = `<em>${message}</em>`;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    showTypingIndicator(data) {
        const indicator = document.getElementById('typing-indicator');
        if (data.isTyping) {
            indicator.textContent = `✍️ ${data.username} está escribiendo...`;
        } else {
            indicator.textContent = '';
        }
    }

    // ==================== NOTIFICACIONES ====================

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    // ==================== CARRITO CON GRAPHQL ====================

    async loadCart() {
        try {
            if (!this.user) return;

            console.log('🛒 Cargando carrito con GraphQL...');

            const query = `
                query {
                    getCart(userId: "${this.getUserId()}") {
                        id
                        total
                        items {
                            id
                            product {
                                id
                                name
                                price
                                image
                                stock
                                category
                            }
                            quantity
                            price
                        }
                    }
                }
            `;

            const data = await this.graphqlQuery(query);
            const cart = data.getCart;

            if (!cart) {
                this.renderEmptyCart();
                return;
            }

            this.renderCart(cart);
            this.updateCartBadge(cart.items.length);

        } catch (error) {
            console.error('❌ Error cargando carrito:', error);
            this.showNotification('Error cargando carrito', 'error');
        }
    }

    async addToCart(productId, quantity = 1) {
        try {
            if (!this.user) {
                this.showNotification('Debes iniciar sesión primero', 'error');
                showLogin();
                return;
            }

            // Usar GraphQL MUTATION para añadir al carrito
            const query = `
                mutation {
                    addToCart(
                        userId: "${this.getUserId()}"
                        productId: "${productId}"
                        quantity: ${quantity}
                    ) {
                        id
                        total
                        items {
                            id
                            quantity
                            product {
                                name
                            }
                        }
                    }
                }
            `;

            const data = await this.graphqlQuery(query);
            
            this.showNotification('✅ Producto añadido al carrito', 'success');
            // Actualizar badge del carrito
            if (data.addToCart && data.addToCart.items) {
                this.updateCartBadge(data.addToCart.items.length);
            }

        } catch (error) {
            console.error('❌ Error añadiendo al carrito:', error);
            this.showNotification(error.message || 'Error añadiendo al carrito', 'error');
        }
    }

    async removeFromCart(itemId) {
        try {
            // Usar REST API para eliminar (más simple que GraphQL para esta operación)
            const response = await fetch(`${this.API_BASE}/api/cart/remove/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('Producto eliminado del carrito', 'success');
                this.loadCart();
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error('❌ Error eliminando del carrito:', error);
            this.showNotification('Error eliminando producto', 'error');
        }
    }

    async clearCart() {
        try {
            if (!confirm('¿Estás seguro de vaciar el carrito?')) return;

            // Usar GraphQL MUTATION para vaciar carrito
            const query = `
                mutation {
                    clearCart(userId: "${this.getUserId()}") {
                        id
                        total
                        items {
                            id
                        }
                    }
                }
            `;

            const data = await this.graphqlQuery(query);
            
            this.showNotification('Carrito vaciado', 'success');
            this.loadCart();

        } catch (error) {
            console.error('❌ Error vaciando carrito:', error);
            this.showNotification('Error vaciando carrito', 'error');
        }
    }

    async checkout() {
        try {
            if (!confirm('¿Confirmar pedido?')) return;

            // Primero obtener el carrito para saber el total
            const cartQuery = `
                query {
                    getCart(userId: "${this.getUserId()}") {
                        total
                        items {
                            product {
                                id
                                name
                            }
                            quantity
                        }
                    }
                }
            `;

            const cartData = await this.graphqlQuery(cartQuery);
            
            if (!cartData.getCart || cartData.getCart.items.length === 0) {
                this.showNotification('El carrito está vacío', 'error');
                return;
            }

            // Crear pedido con GraphQL MUTATION
            const orderMutation = `
                mutation {
                    createOrderFromCart(
                        userId: "${this.getUserId()}"
                    ) {
                        id
                        total
                        status
                        createdAt
                    }
                }
            `;

            const orderData = await this.graphqlQuery(orderMutation);

            if (orderData.createOrder) {
                this.showNotification('🎉 ¡Pedido realizado con éxito!', 'success');
                this.loadCart();
                showMyOrders();
            }

        } catch (error) {
            console.error('❌ Error en checkout:', error);
            this.showNotification(error.message || 'Error procesando pedido', 'error');
        }
    }

    renderCart(cart) {
        const cartItems = document.getElementById('cart-items');
        
        if (!cart.items || cart.items.length === 0) {
            this.renderEmptyCart();
            return;
        }

        cartItems.innerHTML = cart.items.map(item => `
            <div class="cart-item">
                <img src="${item.product.image}" alt="${item.product.name}">
                <div class="item-details">
                    <h3>${item.product.name}</h3>
                    <p class="category">${item.product.category}</p>
                    <p class="price">€${item.price.toFixed(2)} c/u</p>
                </div>
                <div class="item-quantity">
                    <button onclick="app.updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="app.updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <div class="item-total">
                    <p>€${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button class="remove-btn" onclick="app.removeFromCart('${item.id}')">🗑️</button>
            </div>
        `).join('');

        document.getElementById('cart-subtotal').textContent = `€${cart.total.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `€${cart.total.toFixed(2)}`;
    }

    renderEmptyCart() {
        const cartItems = document.getElementById('cart-items');
        cartItems.innerHTML = `
            <div class="empty-cart">
                <h3>🛒 Tu carrito está vacío</h3>
                <p>¡Añade productos para empezar a comprar!</p>
                <button onclick="showProducts()" class="btn-primary">Ver Productos</button>
            </div>
        `;
        document.getElementById('cart-subtotal').textContent = '€0.00';
        document.getElementById('cart-total').textContent = '€0.00';
        this.updateCartBadge(0);
    }

    updateCartBadge(count) {
        const badge = document.getElementById('cart-count');
        if (badge) {
            badge.textContent = count || 0;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    async updateCartQuantity(itemId, newQuantity) {
        if (newQuantity < 1) {
            this.removeFromCart(itemId);
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/api/cart/update/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ quantity: newQuantity })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.loadCart();
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error('❌ Error actualizando cantidad:', error);
            this.showNotification('Error actualizando cantidad', 'error');
        }
    }

    // ==================== PEDIDOS CON GRAPHQL ====================

    async loadMyOrders() {
        try {
            if (!this.user) return;

            console.log('📦 Cargando mis pedidos con GraphQL...');

            const query = `
                query {
                    getMyOrders(userId: "${this.getUserId()}") {
                        _id
                        total
                        status
                        createdAt
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

            const data = await this.graphqlQuery(query);
            const orders = data.getMyOrders || [];

            this.renderMyOrders(orders);

        } catch (error) {
            console.error('❌ Error cargando pedidos:', error);
            this.showNotification('Error cargando pedidos', 'error');
        }
    }

    renderMyOrders(orders) {
        const ordersList = document.getElementById('my-orders-list');

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-orders">
                    <h3>📦 No tienes pedidos aún</h3>
                    <p>Realiza tu primer pedido para verlo aquí</p>
                    <button onclick="showProducts()" class="btn-primary">Ver Productos</button>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = orders.map(order => {
            // Validar que order tenga los campos necesarios
            if (!order || !order._id) {
                console.warn('Pedido con datos incompletos:', order);
                return '';
            }

            const date = new Date(order.createdAt).toLocaleDateString('es-ES');
            const statusClass = order.status === 'completed' ? 'completed' : 'pending';
            const statusText = order.status === 'completed' ? '✅ Completado' : '⏳ Pendiente';

            return `
                <div class="order-card ${statusClass}">
                    <div class="order-header">
                        <h3>Pedido #${order._id.slice(-8)}</h3>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-info">
                        <p>📅 Fecha: ${date}</p>
                        <p>💰 Total: €${order.total ? order.total.toFixed(2) : '0.00'}</p>
                        <p>📦 Productos: ${order.products ? order.products.length : 0}</p>
                    </div>
                    <div class="order-products">
                        ${order.products && order.products.length > 0 ? order.products.map(p => `
                            <div class="order-product-item">
                                <img src="${p.product?.image || 'https://via.placeholder.com/60'}" alt="${p.product?.name || 'Producto'}">
                                <span>${p.product?.name || 'Producto'} x${p.quantity || 1}</span>
                                <span>€${(p.price && p.quantity) ? (p.price * p.quantity).toFixed(2) : '0.00'}</span>
                            </div>
                        `).join('') : '<p>Sin productos</p>'}
                    </div>
                    <button class="btn-secondary" onclick="viewOrderDetails('${order._id}')">Ver Detalles</button>
                </div>
            `;
        }).filter(Boolean).join('');
    }

    async loadAllOrders() {
        try {
            if (!this.user || this.user.role !== 'admin') return;

            console.log('📊 Cargando todos los pedidos (Admin)...');

            const query = `
                query {
                    getOrders {
                        _id
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
                            }
                            quantity
                        }
                    }
                }
            `;

            const data = await this.graphqlQuery(query);
            this.allOrders = data.getOrders || [];

            this.renderAllOrders(this.allOrders);

        } catch (error) {
            console.error('❌ Error cargando pedidos:', error);
            this.showNotification('Error cargando pedidos', 'error');
        }
    }

    renderAllOrders(orders) {
        const ordersList = document.getElementById('all-orders-list');

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-orders">
                    <h3>📦 No hay pedidos en el sistema</h3>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = orders.map(order => {
            // Validar que order tenga los campos necesarios
            if (!order || !order._id) {
                console.warn('Pedido con datos incompletos:', order);
                return '';
            }

            const date = new Date(order.createdAt).toLocaleDateString('es-ES');
            const statusClass = order.status === 'completed' ? 'completed' : 'pending';
            const statusText = order.status === 'completed' ? '✅ Completado' : '⏳ Pendiente';

            return `
                <div class="order-card admin ${statusClass}">
                    <div class="order-header">
                        <div>
                            <h3>Pedido #${order._id.slice(-8)}</h3>
                            <p class="customer-info">👤 ${order.user?.username || 'Usuario'} (${order.user?.email || 'email'})</p>
                        </div>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-info">
                        <p>📅 ${date}</p>
                        <p>💰 €${order.total ? order.total.toFixed(2) : '0.00'}</p>
                        <p>📦 ${order.products ? order.products.length : 0} productos</p>
                    </div>
                    <div class="admin-actions">
                        ${order.status === 'pending' ? 
                            `<button class="btn-success" onclick="app.updateOrderStatus('${order._id}', 'completed')">✅ Marcar Completado</button>` :
                            `<button class="btn-secondary" onclick="app.updateOrderStatus('${order._id}', 'pending')">⏳ Marcar Pendiente</button>`
                        }
                        <button class="btn-secondary" onclick="viewOrderDetails('${order._id}')">Ver Detalles</button>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            // Usar GraphQL MUTATION para actualizar estado del pedido
            const query = `
                mutation {
                    updateOrderStatus(
                        orderId: "${orderId}"
                        status: "${newStatus}"
                    ) {
                        id
                        status
                    }
                }
            `;

            const data = await this.graphqlQuery(query);
            
            this.showNotification(`Pedido actualizado a ${newStatus}`, 'success');
            this.loadAllOrders();

        } catch (error) {
            console.error('❌ Error actualizando pedido:', error);
            this.showNotification('Error actualizando pedido', 'error');
        }
    }

    // ==================== GESTIÓN DE USUARIOS (ADMIN) ====================

    async loadUsers() {
        try {
            if (!this.user || this.user.role !== 'admin') return;

            console.log('👥 Cargando usuarios (Admin)...');

            // Usar REST API para obtener usuarios
            const response = await fetch(`${this.API_BASE}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.allUsers = data.users || [];
                this.renderUsers(this.allUsers);
                this.updateUserStats(this.allUsers);
            } else {
                throw new Error(data.message || 'Error cargando usuarios');
            }

        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
            this.showNotification('Error cargando usuarios', 'error');
        }
    }

    updateUserStats(users) {
        const totalUsers = users.length;
        const adminCount = users.filter(u => u.role === 'admin').length;
        const userCount = users.filter(u => u.role === 'user').length;

        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('admin-count').textContent = adminCount;
        document.getElementById('user-count').textContent = userCount;
    }

    renderUsers(users) {
        const usersList = document.getElementById('users-list');

        if (!users || users.length === 0) {
            usersList.innerHTML = `
                <div class="empty-users">
                    <h3>👥 No hay usuarios en el sistema</h3>
                </div>
            `;
            return;
        }

        usersList.innerHTML = users.map(user => {
            if (!user || !user._id) {
                console.warn('Usuario con datos incompletos:', user);
                return '';
            }

            const isCurrentUser = user._id === this.getUserId();
            const roleClass = user.role === 'admin' ? 'admin-role' : 'user-role';

            return `
                <div class="user-card ${roleClass}">
                    <div class="user-header">
                        <div class="user-info">
                            <h3>${user.username} ${isCurrentUser ? '(Tú)' : ''}</h3>
                            <p class="user-email">📧 ${user.email}</p>
                        </div>
                        <span class="role-badge ${roleClass}">${user.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
                    </div>
                    <div class="user-meta">
                        <p>📅 Registro: ${new Date(user.createdAt).toLocaleDateString('es-ES')}</p>
                        <p>🛒 Pedidos: ${user.orders ? user.orders.length : 0}</p>
                    </div>
                    ${!isCurrentUser ? `
                        <div class="user-actions">
                            <button class="btn-warning" onclick="app.changeUserRole('${user._id}', '${user.role === 'admin' ? 'user' : 'admin'}')">
                                ${user.role === 'admin' ? '👤 Hacer User' : '👑 Hacer Admin'}
                            </button>
                            <button class="btn-danger" onclick="app.deleteUser('${user._id}', '${user.username}')">
                                🗑️ Eliminar
                            </button>
                        </div>
                    ` : '<p class="current-user-note">⚠️ No puedes modificar tu propio usuario</p>'}
                </div>
            `;
        }).filter(Boolean).join('');
    }

    async changeUserRole(userId, newRole) {
        try {
            if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;

            const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification(`✅ Rol cambiado a ${newRole}`, 'success');
                this.loadUsers();
            } else {
                throw new Error(data.message || 'Error cambiando rol');
            }

        } catch (error) {
            console.error('❌ Error cambiando rol:', error);
            this.showNotification('Error cambiando rol de usuario', 'error');
        }
    }

    async deleteUser(userId, username) {
        try {
            if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) return;

            const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification(`🗑️ Usuario "${username}" eliminado`, 'success');
                this.loadUsers();
            } else {
                throw new Error(data.message || 'Error eliminando usuario');
            }

        } catch (error) {
            console.error('❌ Error eliminando usuario:', error);
            this.showNotification('Error eliminando usuario', 'error');
        }
    }

    // ==================== DEBUG ====================

    async testConnection() {
        try {
            console.log('🔧 Probando conexión GraphQL...');

            const query = `query { hello }`;
            const data = await this.graphqlQuery(query);
            
            console.log('✅ GraphQL Response:', data);
            this.showNotification('✅ GraphQL funcionando correctamente', 'success');
        } catch (error) {
            console.error('❌ Error en prueba de GraphQL:', error);
            this.showNotification('❌ Error en GraphQL', 'error');
        }
    }
}

// ==================== FUNCIONES GLOBALES ====================

function showLogin() {
    hideAllSections();
    document.getElementById('login-section').style.display = 'block';
}

function showRegister() {
    hideAllSections();
    document.getElementById('register-section').style.display = 'block';
}

function showProducts() {
    hideAllSections();
    document.getElementById('products-section').style.display = 'block';
    app.loadProducts();
}

function showCart() {
    hideAllSections();
    document.getElementById('cart-section').style.display = 'block';
    app.loadCart();
}

function showMyOrders() {
    hideAllSections();
    document.getElementById('my-orders-section').style.display = 'block';
    app.loadMyOrders();
}

function showAllOrders() {
    hideAllSections();
    document.getElementById('all-orders-section').style.display = 'block';
    app.loadAllOrders();
}

function showUserManagement() {
    hideAllSections();
    document.getElementById('user-management-section').style.display = 'block';
    app.loadUsers();
}

function showChat() {
    hideAllSections();
    document.getElementById('chat-section').style.display = 'block';

    setTimeout(() => {
        const messages = document.getElementById('messages');
        if (messages) {
            messages.scrollTop = messages.scrollHeight;
        }
    }, 100);
}

function showCreateProduct() {
    hideAllSections();
    document.getElementById('create-product-section').style.display = 'block';
}

function hideAllSections() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('products-section').style.display = 'none';
    document.getElementById('cart-section').style.display = 'none';
    document.getElementById('my-orders-section').style.display = 'none';
    document.getElementById('all-orders-section').style.display = 'none';
    document.getElementById('user-management-section').style.display = 'none';
    document.getElementById('chat-section').style.display = 'none';
    document.getElementById('create-product-section').style.display = 'none';
}

function logout() {
    app.logout();
}

function clearCart() {
    app.clearCart();
}

function checkout() {
    app.checkout();
}

function filterOrders(status) {
    if (status === 'all') {
        app.renderAllOrders(app.allOrders);
    } else {
        const filtered = app.allOrders.filter(o => o.status === status);
        app.renderAllOrders(filtered);
    }
}

function viewOrderDetails(orderId) {
    // Implementar modal de detalles si es necesario
    alert('Ver detalles del pedido: ' + orderId);
}

function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
}

function editProduct(productId) {
    const product = app.products.find(p => p.id === productId);
    if (product) {
        if (confirm(`¿Editar producto: ${product.name}?`)) {
            const newName = prompt('Nuevo nombre:', product.name);
            if (newName) {
                updateProduct(productId, { name: newName });
            }
        }
    }
}

async function updateProduct(productId, updates) {
    try {
        const response = await fetch(`${app.API_BASE}/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${app.token}`
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            app.showNotification('Producto actualizado ✅', 'success');
            app.loadProducts();
        } else {
            app.showNotification(data.message || 'Error actualizando producto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        app.showNotification('Error de conexión', 'error');
    }
}

async function deleteProduct(productId) {
    const product = app.products.find(p => p.id === productId);
    if (product && confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
        try {
            const response = await fetch(`${app.API_BASE}/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${app.token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                app.showNotification('Producto eliminado 🗑️', 'success');
                app.loadProducts();
            } else {
                app.showNotification(data.message || 'Error eliminando producto', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            app.showNotification('Error de conexión', 'error');
        }
    }
}

async function addToCart(productId) {
    app.addToCart(productId, 1);
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
    window.app = new BasketballStore();
    console.log('🏀 BasketballStore inicializado con GraphQL');
    console.log('📡 GraphQL Endpoint:', window.app.GRAPHQL_ENDPOINT);
});

// ==================== ESTILOS ADICIONALES ====================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .loading {
        text-align: center;
        padding: 2rem;
        font-size: 1.2rem;
        color: #666;
    }
    
    .error {
        text-align: center;
        padding: 2rem;
        color: #EF4444;
        font-size: 1.1rem;
        background: #FEF2F2;
        border-radius: 8px;
        margin: 1rem 0;
    }
    
    .error button {
        margin: 0.5rem;
        padding: 0.5rem 1rem;
    }
    
    .no-products {
        text-align: center;
        padding: 3rem;
        color: #666;
        font-size: 1.1rem;
        background: #F9FAFB;
        border-radius: 8px;
    }
    
    .filter-buttons {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    
    .filter-btn {
        padding: 0.5rem 1rem;
        background: #E5E7EB;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .filter-btn:hover, .filter-btn.active {
        background: #3B82F6;
        color: white;
    }
    
    .both-badge {
        background: linear-gradient(135deg, #1D428A 0%, #FF6B00 100%);
    }
    
    .in-stock {
        color: #059669;
        font-weight: bold;
    }
    
    .out-of-stock {
        color: #DC2626;
        font-weight: bold;
    }
    
    .product-card {
        transition: all 0.3s ease;
    }
    
    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
`;
document.head.appendChild(style);