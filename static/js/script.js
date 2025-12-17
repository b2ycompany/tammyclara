document.addEventListener('DOMContentLoaded', () => {
    
    // 🌟 CORREÇÃO ESSENCIAL: Garante o uso do caminho relativo /api para compatibilidade DEV/PROD
    const API_BASE_URL = '/api'; 
    
    // URL base do seu servidor Django (usada para construção de URLs de mídia)
    const DJANGO_BASE_URL = window.location.origin.replace(/\/$/, ''); 
    
    // Variáveis globais para o Modal e Produtos
    let currentGalleryImages = [];
    let currentImageIndex = 0;
    let availableProducts = {}; 

    // --- VARIÁVEIS PDV (Novas) ---
    let posCart = []; // Carrinho específico para o PDV (não usa localStorage por padrão)
    let selectedPayment = 'PIX'; 
    let allProducts = []; // Cache de todos os produtos para a busca rápida do PDV
    // --- FIM VARIÁVEIS PDV ---

    // Garante que o corpo do site esteja visível por padrão
    const mainBody = document.getElementById('main-body');
    if (mainBody) {
        mainBody.style.opacity = 1; 
        mainBody.style.overflow = 'auto';
    }

    // --- FUNÇÃO AUXILIAR PARA LIMPAR E CONSTRUIR A URL DE MÍDIA ---
    function buildMediaUrl(relativePath) {
        if (!relativePath) {
            // Caminho estático seguro para placeholder
            return '/static/img/placeholder-produto.png';
        }
        
        // Se a URL já for absoluta, retorna-a.
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }

        // Remove a barra inicial do relativePath se existir, e prefixa com /media/
        const cleanedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        
        return '/media/' + cleanedPath; 
    }

    // --- FUNÇÃO AUXILIAR PARA CSRF TOKEN (CRÍTICO PARA POST) ---
    function getCsrfToken() {
        // Tenta obter o token do input oculto injetado pelo Django
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        return csrfInput ? csrfInput.value : null;
    }
    
    // --- FUNÇÕES AUXILIARES DE INTERATIVIDADE E-COMMERCE ---

    function attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                const product = availableProducts[productId]; 
                if (product) {
                    addToCart(product); 
                } else {
                    alert('Erro: Produto não encontrado no catálogo.');
                }
            });
        });
    }

    function attachGalleryListeners() {
        // 1. Liga o evento para as miniaturas no grid principal
        document.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const newImageUrl = e.target.dataset.fullImg;
                const productId = e.target.dataset.productId;
                
                openImageModal(productId, newImageUrl); 
            });
        });
        
        // 2. Liga o evento para a IMAGEM PRINCIPAL (para abrir o modal)
        document.querySelectorAll('.product-image-container img').forEach(mainImg => {
            const productId = mainImg.id.replace('main-image-', ''); 
            if (productId) {
                mainImg.style.cursor = 'pointer'; 
                mainImg.addEventListener('click', () => {
                    let fullUrl = mainImg.src; 
                    openImageModal(productId, fullUrl);
                });
            }
        });
    }

    // --- LÓGICA DE PRODUTOS (products.html) ---
    const productsGrid = document.querySelector('.products-grid#products-container');

    if (productsGrid) {
        async function loadProducts() {
            try {
                // ✅ CORREÇÃO: Usa caminho relativo sem 127.0.0.1
                const apiUrl = `${API_BASE_URL}/products/`;
                const response = await fetch(apiUrl); 
                
                if (!response.ok) {
                    throw new Error(`Erro ao carregar produtos do servidor. Status: ${response.status}`);
                }
                const products = await response.json();
                
                allProducts = products; 
                
                if (!products || products.length === 0) {
                    productsGrid.innerHTML = '<p style="text-align:center;">Nenhum produto encontrado. Cadastre no Admin!</p>';
                    return;
                }

                productsGrid.innerHTML = '';
                
                products.forEach(product => {
                    if (!product || !product.id) return;
                    
                    availableProducts[product.id] = product; 

                    let initialImageUrl = '/static/img/placeholder-produto.png';
                    
                    let allImages = []; 
                    let mainImageUrl = product.main_image; 
                    const addedUrls = new Set();
                    
                    if (mainImageUrl) {
                        allImages.push({ url: mainImageUrl, is_main: true });
                        addedUrls.add(mainImageUrl);
                    }
                    
                    if (product.images && product.images.length > 0) {
                        product.images.forEach(img => {
                            if (!addedUrls.has(img.image)) { 
                                allImages.push({ url: img.image, is_main: img.is_cover });
                                addedUrls.add(img.image);
                            }
                        });
                    }

                    if (allImages.length > 0) {
                        initialImageUrl = buildMediaUrl(allImages[0].url);
                    }
                    
                    let galleryHtml = '';
                    if (allImages.length > 1) { 
                        galleryHtml = '<div class="product-gallery">';
                        allImages.forEach((img, index) => {
                            const thumbUrl = buildMediaUrl(img.url);
                            galleryHtml += `<img src="${thumbUrl}" alt="${product.name} miniatura ${index + 1}" class="gallery-thumb" data-full-img="${thumbUrl}" data-product-id="${product.id}"/>`;
                        });
                        galleryHtml += '</div>';
                    }
                    
                    const productItem = document.createElement('div');
                    productItem.classList.add('product-item');
                    productItem.innerHTML = `
                        <div class="product-image-container">
                            <img src="${initialImageUrl}" alt="${product.name}" id="main-image-${product.id}">
                        </div>
                        ${galleryHtml}
                        <h3>${product.name}</h3>
                        <p>R$ ${parseFloat(product.price).toFixed(2)}</p>
                        <button class="btn primary-btn add-to-cart-btn" data-id="${product.id}">Adicionar ao Carrinho</button>
                    `;
                    productsGrid.appendChild(productItem);
                });
                
                attachAddToCartListeners(); 
                attachGalleryListeners(); 
                
            } catch (error) {
                console.error('Falha ao buscar produtos:', error);
                productsGrid.innerHTML = `<p class="error-msg" style="text-align:center; color:red;">Erro ao carregar produtos: ${error.message}</p>`;
            }
        }
        loadProducts(); 
    }
    
    // --- LÓGICA DA HOME PAGE: Destaques ---
    const featuredProductsContainer = document.getElementById('featured-products-container');

    if (featuredProductsContainer) {
        async function loadFeaturedProducts() {
             try {
                const products = allProducts.length > 0 ? allProducts : await fetch(`${API_BASE_URL}/products/`).then(res => res.json()); 
                if (!products || products.length === 0) {
                    featuredProductsContainer.innerHTML = '<p>Nenhum produto em destaque.</p>';
                    return;
                }
                featuredProductsContainer.innerHTML = '';
                products.slice(0, 4).forEach(product => {
                    if (!product || !product.id) return;
                    availableProducts[product.id] = product;
                    let imgUrl = buildMediaUrl(product.main_image);
                    const productItem = document.createElement('div');
                    productItem.classList.add('product-item');
                    productItem.innerHTML = `
                        <div class="product-image-container"><img src="${imgUrl}" alt="${product.name}"></div>
                        <h3>${product.name}</h3>
                        <p>R$ ${parseFloat(product.price).toFixed(2)}</p>
                        <button class="btn primary-btn add-to-cart-btn" data-id="${product.id}">Adicionar ao Carrinho</button>
                    `;
                    featuredProductsContainer.appendChild(productItem);
                });
                attachAddToCartListeners(); 
            } catch (error) {
                console.error('Falha ao buscar destaques:', error);
            }
        }
        loadFeaturedProducts();
    }
    
    // --- LÓGICA DO MODAL/LIGHTBOX ---
    function openImageModal(productId, initialUrl) {
        const product = availableProducts[productId];
        if (!product) return;
        currentGalleryImages = [];
        const mainImageUrl = product.main_image;
        const addedUrls = new Set();
        if (mainImageUrl) {
            let fullUrl = buildMediaUrl(mainImageUrl);
            currentGalleryImages.push(fullUrl);
            addedUrls.add(fullUrl);
        }
        if (product.images) {
            product.images.forEach(img => {
                let fullUrl = buildMediaUrl(img.image);
                if (!addedUrls.has(fullUrl)) currentGalleryImages.push(fullUrl);
            });
        }
        const initialIndex = currentGalleryImages.findIndex(url => url === initialUrl);
        currentImageIndex = initialIndex !== -1 ? initialIndex : 0;
        injectModalThumbnails(currentGalleryImages);
        updateModalDisplay(currentImageIndex);
        document.getElementById('image-modal').style.display = 'flex';
    }

    function updateModalDisplay(index) {
        if (currentGalleryImages.length === 0) return;
        document.getElementById('modal-main-image').src = currentGalleryImages[index];
        currentImageIndex = index;
        document.querySelectorAll('#modal-thumbnails-container img').forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
    }

    function injectModalThumbnails(images) {
        const container = document.getElementById('modal-thumbnails-container');
        container.innerHTML = '';
        images.forEach((fullUrl, index) => {
            const thumb = document.createElement('img');
            thumb.src = fullUrl; thumb.classList.add('modal-thumb');
            thumb.addEventListener('click', () => updateModalDisplay(index));
            container.appendChild(thumb);
        });
    }

    const modal = document.getElementById('image-modal');
    if (modal) {
        document.querySelector('#image-modal .close-btn').addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (event) => { if (event.target === modal) modal.style.display = 'none'; });
        document.querySelector('#image-modal .prev-btn').addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
            updateModalDisplay(currentImageIndex);
        });
        document.querySelector('#image-modal .next-btn').addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
            updateModalDisplay(currentImageIndex);
        });
    }

    // --- CARRINHO DE COMPRAS ---
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    function saveCart() { localStorage.setItem('tammyClaraCart', JSON.stringify(cart)); }

    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) existingItem.quantity += 1;
        else cart.push({ id: product.id, name: product.name, price: parseFloat(product.price), quantity: 1, main_image: product.main_image, sku: product.sku });
        saveCart(); updateCartDisplay();
        alert(`${product.name} adicionado ao carrinho!`);
    }

    function updateCartDisplay() {
        const container = document.querySelector('.cart-items');
        const totalSpan = document.getElementById('cart-total');
        if (container) {
            container.innerHTML = cart.length === 0 ? '<p>Carrinho vazio.</p>' : '';
            let total = 0;
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                container.innerHTML += `
                    <div class="cart-item">
                        <img src="${buildMediaUrl(item.main_image)}" class="cart-item-image">
                        <div class="cart-item-details">
                            <h4>${item.name} (${item.sku})</h4>
                            <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                            <div class="cart-controls">
                                <button class="qty-btn" data-id="${item.id}" data-action="decrease">—</button>
                                <span>${item.quantity}</span>
                                <button class="qty-btn" data-id="${item.id}" data-action="increase">+</button>
                            </div>
                            <button class="btn-remove btn" data-id="${item.id}">Remover</button>
                        </div>
                    </div>`;
            });
            if (totalSpan) totalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
            attachCartListeners();
        } else if (totalSpan) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            totalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        }
    }

    function attachCartListeners() {
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const action = e.currentTarget.dataset.action;
                const item = cart.find(i => i.id === id);
                if (!item) return;
                if (action === 'increase') item.quantity += 1;
                else { item.quantity -= 1; if (item.quantity < 1) cart = cart.filter(i => i.id !== id); }
                saveCart(); updateCartDisplay();
            });
        });
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                cart = cart.filter(i => i.id !== parseInt(e.currentTarget.dataset.id));
                saveCart(); updateCartDisplay();
            });
        });
    }

    // --- CHECKOUT E-COMMERCE ---
    const checkoutBtn = document.getElementById('checkout-whatsapp-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (cart.length === 0) return alert('Carrinho vazio.');
            const customerInfo = {
                first_name: prompt("Nome (obrigatório):"),
                email: prompt("E-mail:"),
                phone_number: prompt("WhatsApp (obrigatório):") 
            };
            if (!customerInfo.first_name || !customerInfo.phone_number) return alert('Dados incompletos.');
            const csrfToken = getCsrfToken();
            if (!csrfToken) return alert('Erro de segurança CSRF.');

            try {
                // ✅ CORREÇÃO: Caminho relativo
                const response = await fetch(`${API_BASE_URL}/checkout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                    body: JSON.stringify({ customer_info: customerInfo, items: cart.map(i => ({ id: i.id, quantity: i.quantity })) })
                });
                if (!response.ok) throw new Error((await response.json()).error || 'Erro no pedido.');
                const result = await response.json();
                cart = []; saveCart();
                window.location.href = `/order-success/?id=${result.sale_id}`;
            } catch (error) { alert(`⚠️ Erro: ${error.message}`); }
        });
    }

    // --- PONTO DE VENDA (PDV) ---
    if (document.getElementById('pos-product-search')) {
        fetch(`${API_BASE_URL}/products/`).then(r => r.json()).then(p => { allProducts = p; displaySearchResults(p); });
    }

    window.searchProducts = function() {
        const query = document.getElementById('pos-product-search').value.toLowerCase();
        displaySearchResults(allProducts.filter(p => p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query))));
    }

    function displaySearchResults(products) {
        const container = document.getElementById('product-results');
        container.innerHTML = products.length === 0 ? '<p>Nenhum produto.</p>' : '';
        products.forEach(p => {
            const card = document.createElement('div'); card.className = 'product-card';
            card.innerHTML = `<img src="${buildMediaUrl(p.main_image)}"><h4>${p.name}</h4><p>R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>`;
            card.addEventListener('click', () => {
                const item = posCart.find(i => i.id === p.id);
                if (item) item.quantity += 1; else posCart.push({ id: p.id, name: p.name, price: parseFloat(p.price), quantity: 1 });
                updatePOSCartDisplay();
            });
            container.appendChild(card);
        });
    }

    window.updatePOSCartDisplay = function() {
        const container = document.getElementById('pos-cart-items');
        let subtotal = 0; container.innerHTML = posCart.length === 0 ? '<p>Carrinho vazio.</p>' : '';
        posCart.forEach(item => {
            subtotal += item.price * item.quantity;
            container.innerHTML += `<div class="cart-item"><h4>${item.name}</h4><p>R$ ${(item.price * item.quantity).toFixed(2)}</p></div>`;
        });
        document.getElementById('pos-total').textContent = `R$ ${subtotal.toFixed(2)}`;
    }

    window.searchCustomerByPhone = async function() {
        const phone = document.getElementById('client-phone').value.trim();
        if (!phone) return alert("WhatsApp obrigatório.");
        try {
            const response = await fetch(`${API_BASE_URL}/customer/search/${phone}/`);
            if (response.status === 404) return alert("Não encontrado.");
            const data = await response.json();
            document.getElementById('client-name').value = data.first_name;
            alert(`✅ Cliente "${data.first_name}" localizado.`);
        } catch (e) { alert("Erro na busca."); }
    }

    window.finalizePosSale = async function() {
        if (posCart.length === 0) return alert('Carrinho vazio.');
        const phone = document.getElementById('client-phone').value;
        if (!phone) return alert('WhatsApp obrigatório.');
        const csrfToken = getCsrfToken();
        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                body: JSON.stringify({ customer_info: { phone_number: phone, first_name: document.getElementById('client-name').value }, items: posCart })
            });
            if (res.ok) { alert("✅ Venda finalizada!"); posCart = []; updatePOSCartDisplay(); }
        } catch (e) { alert("Erro na venda."); }
    }

    updateCartDisplay();
});