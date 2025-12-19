document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURAÇÕES DE URL E ESTADO GLOBAL ---
    const API_BASE_URL = '/api'; 
    const DJANGO_BASE_URL = window.location.origin.replace(/\/$/, ''); 
    
    // Variáveis de Estado
    let currentGalleryImages = [];
    let currentImageIndex = 0;
    let availableProducts = {}; 
    let allProducts = []; // Cache para PDV e Busca

    // Variáveis PDV
    let posCart = []; 
    let selectedPayment = 'PIX'; 

    // Variáveis Carrinho E-commerce
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- LÓGICA DE INTERFACE (SPLASH, HERO & SCROLL) ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');
    const mainHeader = document.getElementById('main-header');
    const mainBody = document.getElementById('main-body');

    // Efeito Splash Screen
    if (splash) {
        setTimeout(() => {
            splash.style.transform = 'translateY(-100%)';
            if (heroCard) {
                setTimeout(() => heroCard.classList.add('show'), 500);
            }
            if (mainBody) {
                mainBody.style.opacity = 1;
                mainBody.style.overflow = 'auto';
            }
        }, 2200);
    } else if (mainBody) {
        mainBody.style.opacity = 1;
        mainBody.style.overflow = 'auto';
    }

    // Header Dinâmico no Scroll
    window.addEventListener('scroll', () => {
        if (mainHeader) {
            window.scrollY > 50 ? mainHeader.classList.add('scrolled') : mainHeader.classList.remove('scrolled');
        }
    });

    // --- FUNÇÕES AUXILIARES ---

    function buildMediaUrl(relativePath) {
        if (!relativePath) return '/static/img/placeholder-produto.png';
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
        const cleanedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        return '/media/' + cleanedPath; 
    }

    function getCsrfToken() {
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        return csrfInput ? csrfInput.value : null;
    }

    // --- LÓGICA DE PRODUTOS (LOJA COMPLETA) ---
    
    const productsGrid = document.querySelector('.products-grid#products-container');

    async function loadProducts() {
        if (!productsGrid) return;
        try {
            const response = await fetch(`${API_BASE_URL}/products/`); 
            if (!response.ok) throw new Error(`Erro: ${response.status}`);
            const products = await response.json();
            
            allProducts = products; 
            productsGrid.innerHTML = '';
            
            if (products.length === 0) {
                productsGrid.innerHTML = '<p>Nenhum produto encontrado.</p>';
                return;
            }

            products.forEach(product => {
                availableProducts[product.id] = product; 
                let mainImg = buildMediaUrl(product.main_image);
                
                const productItem = document.createElement('div');
                productItem.classList.add('product-item');
                productItem.innerHTML = `
                    <div class="product-image-container">
                        <img src="${mainImg}" alt="${product.name}" id="main-image-${product.id}">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="price">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                        <button class="btn primary-btn add-to-cart-btn" data-id="${product.id}">
                            Adicionar ao Carrinho
                        </button>
                    </div>`;
                productsGrid.appendChild(productItem);
            });
            
            attachAddToCartListeners(); 
            attachGalleryListeners(); 
        } catch (error) {
            console.error('Falha ao buscar produtos:', error);
        }
    }

    // --- LÓGICA DE DESTAQUES (HOME - LAYOUT LUXO) ---
    
    async function loadFeaturedProducts() {
        const container = document.getElementById('featured-products-container');
        if (!container) return;

        try {
            const response = await fetch(`${API_BASE_URL}/products/`);
            const products = await response.json();

            container.innerHTML = products.slice(0, 4).map(product => {
                availableProducts[product.id] = product;
                const imgUrl = buildMediaUrl(product.main_image);
                return `
                    <div class="product-item">
                        <div class="product-image-container">
                            <img src="${imgUrl}" alt="${product.name}">
                        </div>
                        <div class="product-info">
                            <h3 style="font-family: 'Playfair Display';">${product.name}</h3>
                            <p class="price" style="color: #d4af37; font-weight: 600;">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                            <button class="btn-gold-outline" style="padding: 10px 20px; font-size: 0.7rem; margin-top:10px;" 
                                onclick="window.location.href='/products/'">Ver Detalhes</button>
                        </div>
                    </div>`;
            }).join('');
            
            attachAddToCartListeners();
        } catch (error) { console.error('Erro Destaques:', error); }
    }

    // --- LISTENERS E-COMMERCE ---

    function attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.onclick = (e) => {
                const productId = e.target.dataset.id;
                const product = availableProducts[productId]; 
                if (product) addToCart(product);
            };
        });
    }

    function attachGalleryListeners() {
        document.querySelectorAll('.product-image-container img').forEach(img => {
            img.style.cursor = 'pointer';
            img.onclick = () => {
                const id = img.id.replace('main-image-', '');
                openImageModal(id, img.src);
            };
        });
    }

    // --- LÓGICA DO CARRINHO (LOCAL STORAGE) ---

    function saveCart() {
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
    }

    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: 1,
                main_image: product.main_image,
                sku: product.sku
            });
        }
        saveCart();
        updateCartDisplay();
        alert(`${product.name} adicionado!`);
    }

    function updateCartDisplay() {
        const container = document.querySelector('.cart-items');
        const totalSpan = document.getElementById('cart-total');
        if (!container) return;

        let total = 0;
        container.innerHTML = cart.length === 0 ? '<p>Carrinho vazio.</p>' : '';

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            container.innerHTML += `
                <div class="cart-item">
                    <img src="${buildMediaUrl(item.main_image)}" width="50">
                    <div>
                        <h4>${item.name}</h4>
                        <p>R$ ${item.price.toFixed(2)} x ${item.quantity}</p>
                        <button class="btn-remove" data-id="${item.id}">Remover</button>
                    </div>
                </div>`;
        });

        if (totalSpan) totalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.onclick = () => {
                cart = cart.filter(i => i.id != btn.dataset.id);
                saveCart();
                updateCartDisplay();
            };
        });
    }

    // --- LÓGICA DO PONTO DE VENDA (PDV) ---

    if (document.getElementById('pos-product-search')) {
        fetch(`${API_BASE_URL}/products/`)
            .then(res => res.json())
            .then(products => {
                allProducts = products;
                displaySearchResults(products);
            });

        document.querySelectorAll('.payment-option-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.payment-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedPayment = btn.dataset.type;
            };
        });
    }

    window.searchProducts = function() {
        const query = document.getElementById('pos-product-search').value.toLowerCase();
        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query)));
        displaySearchResults(filtered);
    };

    function displaySearchResults(products) {
        const res = document.getElementById('product-results');
        if (!res) return;
        res.innerHTML = products.map(p => `
            <div class="product-card" onclick="addProductToPOSCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                <img src="${buildMediaUrl(p.main_image)}">
                <h4>${p.name}</h4>
                <p>R$ ${parseFloat(p.price).toFixed(2)}</p>
            </div>
        `).join('');
    }

    window.addProductToPOSCart = function(product) {
        const item = posCart.find(i => i.id === product.id);
        item ? item.quantity++ : posCart.push({...product, price: parseFloat(product.price), quantity: 1});
        updatePOSCartDisplay();
    };

    window.updatePOSCartDisplay = function() {
        const container = document.getElementById('pos-cart-items');
        let subtotal = 0;
        if (!container) return;

        container.innerHTML = posCart.map(item => {
            subtotal += item.price * item.quantity;
            return `<div class="cart-item">
                <span>${item.name} (x${item.quantity})</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
            </div>`;
        }).join('');

        const discount = parseFloat(document.getElementById('discount-input')?.value) || 0;
        const total = subtotal * (1 - (discount / 100));
        
        if (document.getElementById('pos-subtotal')) document.getElementById('pos-subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
        if (document.getElementById('pos-total')) document.getElementById('pos-total').textContent = `R$ ${total.toFixed(2)}`;
    };

    // --- FINALIZAÇÃO DE VENDA (API) ---

    window.finalizePosSale = async function() {
        if (posCart.length === 0) return alert("Carrinho vazio!");
        
        const payload = {
            customer_info: {
                phone_number: document.getElementById('client-phone').value,
                first_name: document.getElementById('client-name').value || "Cliente PDV"
            },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
            payment_info: { method: selectedPayment }
        };

        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Venda Realizada!");
                posCart = [];
                updatePOSCartDisplay();
            } else {
                const err = await res.json();
                alert("Erro: " + err.error);
            }
        } catch (e) { console.error(e); }
    };

    // --- INICIALIZAÇÃO ---
    loadFeaturedProducts();
    loadProducts();
    updateCartDisplay();
});

// Funções globais para botões HTML (onclick)
function handleSearchEnter(event) { if (event.key === 'Enter') searchProducts(); }