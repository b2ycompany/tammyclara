/**
 * TAMMY'S STORE - SISTEMA UNIFICADO (E-COMMERCE & PDV)
 * Código Completo: Sem Abreviações
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURAÇÕES GLOBAIS E URLs ---
    const API_BASE_URL = '/api'; 
    const DJANGO_BASE_URL = window.location.origin.replace(/\/$/, ''); 
    
    // Estados Globais
    let currentGalleryImages = [];
    let currentImageIndex = 0;
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX'; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- 2. 🚀 INTERFACE E SPLASH SCREEN (BOUTIQUE DE LUXO) ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');
    const mainHeader = document.getElementById('main-header');
    const mainBody = document.getElementById('main-body');

    // Splash Screen estendida para 3.5 segundos para elegância
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (splash) {
                splash.style.opacity = '0';
                splash.style.transform = 'translateY(-100%)';
                setTimeout(() => { splash.style.visibility = 'hidden'; }, 1000);
            }
            if (heroCard) setTimeout(() => heroCard.classList.add('show'), 600);
            if (mainBody) {
                mainBody.style.opacity = '1';
                mainBody.style.overflow = 'auto';
            }
        }, 3500); 
    });

    // Efeito de Header Fixa com Contraste
    window.addEventListener('scroll', () => {
        if (mainHeader) {
            window.scrollY > 50 ? mainHeader.classList.add('scrolled') : mainHeader.classList.remove('scrolled');
        }
    });

    // --- 3. 🛠️ FUNÇÕES AUXILIARES ---
    function buildMediaUrl(relativePath) {
        if (!relativePath) return '/static/img/placeholder-produto.png';
        if (relativePath.startsWith('http')) return relativePath;
        const cleanedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        return '/media/' + cleanedPath; 
    }

    function getCsrfToken() {
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        return csrfInput ? csrfInput.value : null;
    }

    function saveCart() {
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
    }

    // --- 4. 🛒 LÓGICA DO E-COMMERCE (SITE PÚBLICO) ---

    async function loadStoreProducts() {
        const productsGrid = document.getElementById('products-container');
        const homeGrid = document.getElementById('featured-products-container');
        const targetContainer = productsGrid || homeGrid;

        if (!targetContainer) return;

        try {
            const response = await fetch(`${API_BASE_URL}/products/`);
            if (!response.ok) throw new Error("Falha na API");
            const products = await response.json();
            allProducts = products;

            targetContainer.innerHTML = '';
            // Se for a Home, limita a 4 itens de destaque
            const displayLimit = homeGrid ? 4 : products.length;

            products.slice(0, displayLimit).forEach(product => {
                availableProducts[product.id] = product;
                const imageUrl = buildMediaUrl(product.main_image);
                
                const productDiv = document.createElement('div');
                productDiv.className = 'product-card';
                productDiv.innerHTML = `
                    <div class="product-img-wrapper" onclick="openGalleryModal(${product.id})">
                        <img src="${imageUrl}" alt="${product.name}" id="main-image-${product.id}">
                    </div>
                    <div class="product-info">
                        <h3 style="font-family: 'Playfair Display'; margin-top:15px;">${product.name}</h3>
                        <p class="price" style="color:#d4af37; font-weight:600; margin:10px 0;">
                            R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}
                        </p>
                        <button class="btn-gold-outline add-to-cart-btn" data-id="${product.id}" style="width:100%;">
                            ADICIONAR AO CARRINHO
                        </button>
                    </div>
                `;
                targetContainer.appendChild(productDiv);
            });

            rebindAddToCartButtons();
        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
            targetContainer.innerHTML = "<p>Ocorreu um erro ao carregar a coleção.</p>";
        }
    }

    function rebindAddToCartButtons() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.target.dataset.id;
                const p = availableProducts[id];
                if (p) {
                    const existing = cart.find(item => item.id === p.id);
                    if (existing) {
                        existing.quantity++;
                    } else {
                        cart.push({
                            id: p.id, name: p.name, price: parseFloat(p.price),
                            quantity: 1, main_image: p.main_image, sku: p.sku
                        });
                    }
                    saveCart();
                    updateCartUI();
                    alert(`${p.name} foi para o seu carrinho!`);
                }
            };
        });
    }

    // --- 5. 🖼️ LÓGICA DO MODAL DE GALERIA ---
    window.openGalleryModal = (productId) => {
        const product = availableProducts[productId];
        if (!product) return;

        currentGalleryImages = [buildMediaUrl(product.main_image)];
        if (product.images) {
            product.images.forEach(img => currentGalleryImages.push(buildMediaUrl(img.image)));
        }

        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-main-image');
        const thumbsCont = document.getElementById('modal-thumbnails-container');

        if (modal && modalImg) {
            modalImg.src = currentGalleryImages[0];
            currentImageIndex = 0;
            
            if (thumbsCont) {
                thumbsCont.innerHTML = currentGalleryImages.map((src, idx) => `
                    <img src="${src}" class="modal-thumb ${idx === 0 ? 'active' : ''}" 
                         onclick="changeModalImage(${idx})">
                `).join('');
            }
            modal.style.display = 'flex';
        }
    };

    window.changeModalImage = (index) => {
        currentImageIndex = index;
        const modalImg = document.getElementById('modal-main-image');
        if (modalImg) modalImg.src = currentGalleryImages[index];
        
        document.querySelectorAll('.modal-thumb').forEach((t, i) => {
            t.classList.toggle('active', i === index);
        });
    };

    // --- 6. 🛒 CARRINHO E CHECKOUT ADMIN (LEADS) ---
    function updateCartUI() {
        const container = document.querySelector('.cart-items');
        const totalSpan = document.getElementById('cart-total');
        if (!container) return;

        container.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:40px;">Seu carrinho está vazio.</p>';
        } else {
            cart.forEach(item => {
                const sub = item.price * item.quantity;
                total += sub;
                container.innerHTML += `
                    <div class="cart-item">
                        <img src="${buildMediaUrl(item.main_image)}" alt="${item.name}">
                        <div class="cart-details">
                            <h4>${item.name}</h4>
                            <p>${item.quantity}x R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                            <button class="btn-remove" onclick="removeCartItem(${item.id})" 
                                    style="color:red; background:none; border:none; cursor:pointer; font-size:0.7rem; margin-top:5px;">
                                REMOVER
                            </button>
                        </div>
                        <div style="font-weight:600;">R$ ${sub.toFixed(2).replace('.', ',')}</div>
                    </div>
                `;
            });
        }
        if (totalSpan) totalSpan.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    window.removeCartItem = (id) => {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartUI();
    };

    // Checkout direto para o Banco de Dados do Admin (Sem WhatsApp)
    async function processCheckoutLead() {
        if (cart.length === 0) return alert("Carrinho vazio!");

        const name = prompt("Nome completo para consulta de estoque:");
        const phone = prompt("WhatsApp (com DDD):");

        if (!name || !phone) return alert("Dados obrigatórios para prosseguir.");

        const payload = {
            customer_info: { first_name: name, phone_number: phone, email: "" },
            items: cart.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
            origin: 'SITE'
        };

        try {
            const response = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken() 
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.removeItem('tammyClaraCart');
                window.location.href = `/order-success/?id=${result.sale_id}`;
            } else {
                throw new Error("Erro ao registrar pedido.");
            }
        } catch (error) {
            alert("Erro na comunicação com o servidor. Tente novamente.");
        }
    }

    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) checkoutBtn.onclick = processCheckoutLead;

    // --- 7. 🏦 LÓGICA DO PONTO DE VENDA (PDV) ---

    window.searchProducts = () => {
        const q = document.getElementById('pos-product-search').value.toLowerCase();
        const results = allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
        const container = document.getElementById('product-results');
        if (!container) return;

        container.innerHTML = results.map(p => `
            <div class="product-card" onclick="addToPOS(${p.id})" style="padding:10px; cursor:pointer;">
                <img src="${buildMediaUrl(p.main_image)}" style="width:100%; height:120px; object-fit:cover;">
                <h5 style="margin:5px 0;">${p.name}</h5>
                <p style="font-size:0.8rem; color:var(--gold);">R$ ${parseFloat(p.price).toFixed(2)}</p>
            </div>
        `).join('');
    };

    window.addToPOS = (id) => {
        const product = allProducts.find(p => p.id === id);
        const existing = posCart.find(item => item.id === id);
        if (existing) {
            existing.quantity++;
        } else {
            posCart.push({ ...product, quantity: 1, price: parseFloat(product.price) });
        }
        updatePOSUI();
    };

    function updatePOSUI() {
        const container = document.getElementById('pos-cart-items');
        if (!container) return;

        container.innerHTML = posCart.map(item => `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <div>
                    <h6 style="margin:0;">${item.name}</h6>
                    <small>${item.quantity}x R$ ${item.price.toFixed(2)}</small>
                </div>
                <button onclick="removeFromPOS(${item.id})" style="color:red; background:none; border:none;">×</button>
            </div>
        `).join('') || '<p>Carrinho Vazio</p>';

        const subtotal = posCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const discount = parseFloat(document.getElementById('discount-input')?.value || 0) / 100;
        const total = subtotal * (1 - discount);

        if (document.getElementById('pos-subtotal')) document.getElementById('pos-subtotal').innerText = `R$ ${subtotal.toFixed(2)}`;
        if (document.getElementById('pos-total')) document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
    }

    window.removeFromPOS = (id) => {
        posCart = posCart.filter(i => i.id !== id);
        updatePOSUI();
    };

    window.finalizePosSale = async () => {
        if (posCart.length === 0) return alert("Carrinho vazio");
        const payload = {
            customer_info: {
                first_name: document.getElementById('client-name').value || "Cliente Balcão",
                phone_number: document.getElementById('client-phone').value,
                email: document.getElementById('client-email').value
            },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity })),
            payment_info: { method: selectedPayment }
        };

        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Venda Finalizada!");
                posCart = []; updatePOSUI();
            }
        } catch (e) { alert("Erro ao finalizar."); }
    };

    // --- 8. INICIALIZAÇÃO ---
    loadStoreProducts();
    updateCartUI();
    
    // Listeners do Modal
    const modal = document.getElementById('image-modal');
    if (modal) {
        document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }

    // Buscar clientes no PDV
    const searchBtn = document.querySelector('[onclick="searchCustomerByPhone()"]');
    if (searchBtn) {
        searchBtn.onclick = async () => {
            const phone = document.getElementById('client-phone').value;
            const res = await fetch(`${API_BASE_URL}/customer/search/${phone}/`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('client-name').value = data.first_name;
                alert("Cliente localizado!");
            }
        };
    }

}); // FIM DO ARQUIVO