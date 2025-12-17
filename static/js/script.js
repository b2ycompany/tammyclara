// tammysstore script.js - VERSÃO DEFINITIVA DE PRODUÇÃO
console.log("🚀 Script de Produção Carregado - V2");

document.addEventListener('DOMContentLoaded', () => {
    
    // 🌟 CONFIGURAÇÃO GLOBAL: Caminhos relativos para compatibilidade absoluta
    const API_BASE_URL = '/api'; 
    
    // Variáveis globais preservadas de todas as funcionalidades (PDV, Modal, E-commerce)
    let currentGalleryImages = [];
    let currentImageIndex = 0;
    let availableProducts = {}; 
    let posCart = []; 
    let selectedPayment = 'PIX'; 
    let allProducts = []; 

    const mainBody = document.getElementById('main-body');
    if (mainBody) {
        mainBody.style.opacity = 1; 
        mainBody.style.overflow = 'auto';
    }

    // --- FUNÇÕES AUXILIARES ---
    function buildMediaUrl(relativePath) {
        if (!relativePath) return '/static/img/placeholder-produto.png';
        if (relativePath.startsWith('http')) return relativePath;
        const cleanedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        return '/media/' + cleanedPath; 
    }

    function getCsrfToken() {
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (csrfInput) return csrfInput.value;
        const name = "csrftoken=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return null;
    }

    // --- 🛒 LÓGICA DE PRODUTOS (E-COMMERCE) ---
    const productsGrid = document.querySelector('.products-grid#products-container');
    if (productsGrid) {
        async function loadProducts() {
            try {
                // ✅ CHAMADA CORRIGIDA: Sem 127.0.0.1
                const response = await fetch(`${API_BASE_URL}/products/`); 
                if (!response.ok) throw new Error(`Status: ${response.status}`);
                const products = await response.json();
                
                allProducts = products; 
                productsGrid.innerHTML = '';
                
                if (products.length === 0) {
                    productsGrid.innerHTML = '<p>Nenhum produto encontrado.</p>';
                    return;
                }

                products.forEach(product => {
                    availableProducts[product.id] = product; 
                    let initialImageUrl = buildMediaUrl(product.main_image);
                    
                    const productItem = document.createElement('div');
                    productItem.classList.add('product-item');
                    productItem.innerHTML = `
                        <div class="product-image-container">
                            <img src="${initialImageUrl}" alt="${product.name}" id="main-image-${product.id}">
                        </div>
                        <h3>${product.name}</h3>
                        <p>R$ ${parseFloat(product.price).toFixed(2)}</p>
                        <button class="btn primary-btn add-to-cart-btn" data-id="${product.id}">Adicionar</button>
                    `;
                    productsGrid.appendChild(productItem);
                });
                attachAddToCartListeners();
            } catch (error) {
                console.error('Erro ao buscar produtos:', error);
                productsGrid.innerHTML = `<p style="color:red;">Falha ao carregar catálogo.</p>`;
            }
        }
        loadProducts(); 
    }

    // --- 🏦 LÓGICA DO PONTO DE VENDA (PDV) ---
    window.searchCustomerByPhone = async function() {
        const phone = document.getElementById('client-phone').value;
        if (!phone) return alert("Digite o WhatsApp.");
        try {
            const response = await fetch(`${API_BASE_URL}/customer/search/${phone}/`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            document.getElementById('client-name').value = data.first_name;
            alert("Cliente localizado!");
        } catch (e) { alert("Cliente não encontrado."); }
    };

    window.finalizePosSale = async function() {
        if (posCart.length === 0) return alert("Carrinho vazio.");
        const payload = {
            customer_info: { 
                first_name: document.getElementById('client-name').value || "Cliente PDV",
                phone_number: document.getElementById('client-phone').value 
            },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity }))
        };

        try {
            const response = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                alert("Venda finalizada com sucesso!");
                posCart = [];
                if(typeof updatePOSCartDisplay === 'function') updatePOSCartDisplay();
            }
        } catch (e) { alert("Erro ao registrar venda."); }
    };

    // --- 📦 LÓGICA DE CARRINHO (E-COMMERCE) ---
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    function saveCart() { localStorage.setItem('tammyClaraCart', JSON.stringify(cart)); }

    function addToCart(product) {
        const item = cart.find(i => i.id === product.id);
        if (item) item.quantity += 1;
        else cart.push({ id: product.id, name: product.name, price: parseFloat(product.price), quantity: 1, main_image: product.main_image });
        saveCart();
        updateCartDisplay();
        alert(`${product.name} adicionado!`);
    }

    function updateCartDisplay() {
        const totalSpan = document.getElementById('cart-total');
        if (totalSpan) {
            const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            totalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        }
    }

    function attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.target.dataset.id;
                addToCart(availableProducts[id]);
            };
        });
    }

    updateCartDisplay();
});