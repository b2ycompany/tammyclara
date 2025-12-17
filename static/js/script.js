document.addEventListener('DOMContentLoaded', () => {
    
    // 🌟 CONFIGURAÇÃO GLOBAL: Caminhos relativos para compatibilidade DEV/PROD no Fly.io
    const API_BASE_URL = '/api'; 
    
    // Variáveis globais para o Modal e Produtos
    let currentGalleryImages = [];
    let currentImageIndex = 0;
    let availableProducts = {}; 

    // --- VARIÁVEIS PDV ---
    let posCart = []; 
    let selectedPayment = 'PIX'; 
    let allProducts = []; 

    // Garante visibilidade e comportamento do body
    const mainBody = document.getElementById('main-body');
    if (mainBody) {
        mainBody.style.opacity = 1; 
        mainBody.style.overflow = 'auto';
    }

    // --- FUNÇÃO AUXILIAR: Construção de URLs de Mídia ---
    function buildMediaUrl(relativePath) {
        if (!relativePath) return '/static/img/placeholder-produto.png';
        if (relativePath.startsWith('http')) return relativePath;
        
        const cleanedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        return '/media/' + cleanedPath; 
    }

    // --- FUNÇÃO AUXILIAR: CSRF TOKEN (Melhorado para Produção) ---
    function getCsrfToken() {
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (csrfInput && csrfInput.value) return csrfInput.value;

        // Busca no Cookie caso o input falhe
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === 'csrftoken=') {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // --- LISTENERS DE INTERATIVIDADE ---

    function attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                const product = availableProducts[productId]; 
                if (product) addToCart(product);
                else alert('Erro: Produto não encontrado.');
            });
        });
    }

    function attachGalleryListeners() {
        document.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const newImageUrl = e.target.dataset.fullImg;
                const productId = e.target.dataset.productId;
                openImageModal(productId, newImageUrl); 
            });
        });
        
        document.querySelectorAll('.product-image-container img').forEach(mainImg => {
            const productId = mainImg.id.replace('main-image-', ''); 
            if (productId) {
                mainImg.style.cursor = 'pointer'; 
                mainImg.addEventListener('click', () => {
                    openImageModal(productId, mainImg.src);
                });
            }
        });
    }

    // --- CARREGAMENTO DO CATÁLOGO (E-commerce) ---
    const productsGrid = document.querySelector('.products-grid#products-container');

    if (productsGrid) {
        async function loadProducts() {
            try {
                // ✅ Chamada relativa corrigida
                const response = await fetch(`${API_BASE_URL}/products/`); 
                if (!response.ok) throw new Error(`Status: ${response.status}`);
                
                const products = await response.json();
                allProducts = products; 
                
                if (!products || products.length === 0) {
                    productsGrid.innerHTML = '<p>Nenhum produto encontrado.</p>';
                    return;
                }

                productsGrid.innerHTML = '';
                products.forEach(product => {
                    availableProducts[product.id] = product; 
                    
                    let allImages = []; 
                    if (product.main_image) {
                        allImages.push({ url: product.main_image });
                    }
                    if (product.images) {
                        product.images.forEach(img => allImages.push({ url: img.image }));
                    }

                    const initialImageUrl = buildMediaUrl(allImages[0]?.url);
                    
                    let galleryHtml = '';
                    if (allImages.length > 1) { 
                        galleryHtml = '<div class="product-gallery">';
                        allImages.forEach((img, idx) => {
                            const tUrl = buildMediaUrl(img.url);
                            galleryHtml += `<img src="${tUrl}" class="gallery-thumb" data-full-img="${tUrl}" data-product-id="${product.id}">`;
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
                console.error('Erro ao carregar produtos:', error);
                productsGrid.innerHTML = `<p style="color:red;">Erro na conexão: ${error.message}</p>`;
            }
        }
        loadProducts(); 
    }
    
    // --- DESTAQUES DA HOME ---
    const featuredContainer = document.getElementById('featured-products-container');
    if (featuredContainer) {
        async function loadFeatured() {
            try {
                const res = await fetch(`${API_BASE_URL}/products/`);
                const products = await res.json();
                featuredContainer.innerHTML = '';
                products.slice(0, 4).forEach(product => {
                    availableProducts[product.id] = product;
                    const imgUrl = buildMediaUrl(product.main_image);
                    const div = document.createElement('div');
                    div.classList.add('product-item');
                    div.innerHTML = `
                        <div class="product-image-container"><img src="${imgUrl}"></div>
                        <h3>${product.name}</h3>
                        <p>R$ ${parseFloat(product.price).toFixed(2)}</p>
                        <button class="btn primary-btn add-to-cart-btn" data-id="${product.id}">Adicionar</button>
                    `;
                    featuredContainer.appendChild(div);
                });
                attachAddToCartListeners();
            } catch (e) { console.error(e); }
        }
        loadFeatured();
    }
    
    // --- LÓGICA DO MODAL/LIGHTBOX ---
    function openImageModal(productId, initialUrl) {
        const product = availableProducts[productId];
        if (!product) return;

        currentGalleryImages = [];
        if (product.main_image) currentGalleryImages.push(buildMediaUrl(product.main_image));
        if (product.images) product.images.forEach(i => currentGalleryImages.push(buildMediaUrl(i.image)));
        
        currentImageIndex = currentGalleryImages.indexOf(initialUrl);
        if (currentImageIndex === -1) currentImageIndex = 0;
        
        injectModalThumbnails(currentGalleryImages);
        updateModalDisplay(currentImageIndex);
        document.getElementById('image-modal').style.display = 'flex';
    }

    function updateModalDisplay(index) {
        const modalImg = document.getElementById('modal-main-image');
        if (modalImg) modalImg.src = currentGalleryImages[index];
        currentImageIndex = index;
        document.querySelectorAll('.modal-thumb').forEach((t, i) => {
            t.classList.toggle('active', i === index);
        });
    }

    function injectModalThumbnails(images) {
        const container = document.getElementById('modal-thumbnails-container');
        if (!container) return;
        container.innerHTML = '';
        images.forEach((url, i) => {
            const t = document.createElement('img');
            t.src = url;
            t.classList.add('modal-thumb');
            t.onclick = () => updateModalDisplay(i);
            container.appendChild(t);
        });
    }

    // Eventos do Modal
    const modal = document.getElementById('image-modal');
    if (modal) {
        document.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
        document.querySelector('.prev-btn').onclick = () => {
            currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
            updateModalDisplay(currentImageIndex);
        };
        document.querySelector('.next-btn').onclick = () => {
            currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
            updateModalDisplay(currentImageIndex);
        };
    }

    // --- LÓGICA DO CARRINHO E-COMMERCE ---
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    function saveCart() { localStorage.setItem('tammyClaraCart', JSON.stringify(cart)); }

    function addToCart(product) {
        const item = cart.find(i => i.id === product.id);
        if (item) item.quantity += 1;
        else cart.push({ id: product.id, name: product.name, price: parseFloat(product.price), quantity: 1, main_image: product.main_image, sku: product.sku });
        saveCart();
        updateCartDisplay();
        alert('Adicionado ao carrinho!');
    }

    function updateCartDisplay() {
        const container = document.querySelector('.cart-items');
        const totalSpan = document.getElementById('cart-total');
        if (!container) return;

        container.innerHTML = cart.length === 0 ? '<p>Carrinho vazio.</p>' : '';
        let total = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
            container.innerHTML += `
                <div class="cart-item">
                    <img src="${buildMediaUrl(item.main_image)}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>R$ ${item.price.toFixed(2)}</p>
                        <button onclick="updateQty(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQty(${item.id}, 1)">+</button>
                        <button onclick="removeItem(${item.id})">Remover</button>
                    </div>
                </div>`;
        });
        if (totalSpan) totalSpan.textContent = `R$ ${total.toFixed(2)}`;
    }

    window.updateQty = (id, delta) => {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
            saveCart();
            updateCartDisplay();
        }
    };

    window.removeItem = (id) => {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartDisplay();
    };

    // --- CHECKOUT E-COMMERCE ---
    const checkoutBtn = document.getElementById('checkout-whatsapp-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            if (cart.length === 0) return alert('Carrinho vazio!');
            const name = prompt("Nome:");
            const phone = prompt("WhatsApp:");
            if (!name || !phone) return alert("Dados obrigatórios!");

            const payload = {
                customer_info: { first_name: name, phone_number: phone },
                items: cart.map(i => ({ id: i.id, quantity: i.quantity }))
            };

            try {
                // ✅ POST corrigido com Token e Caminho Relativo
                const res = await fetch(`${API_BASE_URL}/checkout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("Erro no registro.");
                const data = await res.json();
                cart = []; saveCart();
                window.location.href = `/order-success/?id=${data.sale_id}`;
            } catch (e) { alert(e.message); }
        };
    }

    // --- PDV (PONTO DE VENDA) ---
    const posSearchInput = document.getElementById('pos-product-search');
    if (posSearchInput) {
        fetch(`${API_BASE_URL}/products/`)
            .then(r => r.json())
            .then(data => { allProducts = data; renderPosResults(data); });

        posSearchInput.onkeyup = () => {
            const q = posSearchInput.value.toLowerCase();
            const filtered = allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
            renderPosResults(filtered);
        };
    }

    function renderPosResults(products) {
        const res = document.getElementById('product-results');
        if (!res) return;
        res.innerHTML = '';
        products.forEach(p => {
            const d = document.createElement('div');
            d.classList.add('product-card');
            d.innerHTML = `<img src="${buildMediaUrl(p.main_image)}"><h4>${p.name}</h4><p>R$ ${parseFloat(p.price).toFixed(2)}</p>`;
            d.onclick = () => addPosItem(p);
            res.appendChild(d);
        });
    }

    function addPosItem(p) {
        const item = posCart.find(i => i.id === p.id);
        if (item) item.quantity += 1;
        else posCart.push({ ...p, quantity: 1 });
        updatePosDisplay();
    }

    function updatePosDisplay() {
        const cont = document.getElementById('pos-cart-items');
        if (!cont) return;
        cont.innerHTML = '';
        let total = 0;
        posCart.forEach(i => {
            total += i.price * i.quantity;
            cont.innerHTML += `<div class="cart-item"><span>${i.name} x${i.quantity}</span><span>R$ ${(i.price * i.quantity).toFixed(2)}</span></div>`;
        });
        document.getElementById('pos-total').textContent = `R$ ${total.toFixed(2)}`;
    }

    window.searchCustomerByPhone = async () => {
        const phone = document.getElementById('client-phone').value;
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${phone}/`);
            if (!res.ok) return alert("Não encontrado.");
            const data = await res.json();
            document.getElementById('client-name').value = data.first_name;
            alert(`Cliente: ${data.first_name}`);
        } catch (e) { console.error(e); }
    };

    window.finalizePosSale = async () => {
        if (posCart.length === 0) return;
        const phone = document.getElementById('client-phone').value;
        if (!phone) return alert("WhatsApp obrigatório!");

        const payload = {
            customer_info: { first_name: document.getElementById('client-name').value || "PDV", phone_number: phone },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity }))
        };

        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify(payload)
            });
            if (res.ok) { alert("Venda finalizada!"); posCart = []; updatePosDisplay(); }
        } catch (e) { alert(e.message); }
    };

    updateCartDisplay();
});