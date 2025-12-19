document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURAÇÕES DE URL E ESTADO GLOBAL ---
    const API_BASE_URL = '/api'; 
    const DJANGO_BASE_URL = window.location.origin.replace(/\/$/, ''); 
    
    let currentGalleryImages = [];
    let currentImageIndex = 0;
    let availableProducts = {}; 

    // Variáveis PDV
    let posCart = []; 
    let selectedPayment = 'PIX'; 
    let allProducts = []; 
    
    // Variáveis Carrinho E-commerce
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- LÓGICA DE INTERFACE (Splash, Scroll e Visibilidade) ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');
    const mainHeader = document.getElementById('main-header');
    const mainBody = document.getElementById('main-body');

    if (splash) {
        setTimeout(() => {
            splash.style.transform = 'translateY(-100%)';
            if (heroCard) {
                setTimeout(() => heroCard.classList.add('show'), 500);
            }
        }, 2000);
    }

    if (mainBody) {
        mainBody.style.opacity = 1; 
        mainBody.style.overflow = 'auto';
    }

    window.addEventListener('scroll', () => {
        if (mainHeader) {
            window.scrollY > 50 ? mainHeader.classList.add('scrolled') : mainHeader.classList.remove('scrolled');
        }
    });

    // --- FUNÇÕES AUXILIARES DE MÍDIA E SEGURANÇA ---
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

    // --- LÓGICA DE PRODUTOS E GALERIA (E-COMMERCE) ---

    function attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                const product = availableProducts[productId]; 
                if (product) addToCart(product);
            });
        });
    }

    function attachGalleryListeners() {
        document.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                openImageModal(e.target.dataset.productId, e.target.dataset.fullImg); 
            });
        });
        
        document.querySelectorAll('.product-image-container img').forEach(mainImg => {
            const productId = mainImg.id.replace('main-image-', ''); 
            if (productId) {
                mainImg.style.cursor = 'pointer'; 
                mainImg.addEventListener('click', () => openImageModal(productId, mainImg.src));
            }
        });
    }

    // Carregamento da Vitrine (Home) - ESTILO NOVO
    async function loadFeaturedProducts() {
        const container = document.getElementById('featured-products-container');
        if (!container) return;

        try {
            const response = await fetch(`${API_BASE_URL}/products/`);
            const products = await response.json();
            allProducts = products;

            if (!products || products.length === 0) {
                container.innerHTML = '<p>Nenhum destaque no momento.</p>';
                return;
            }

            container.innerHTML = products.slice(0, 4).map(product => {
                availableProducts[product.id] = product;
                const imgUrl = buildMediaUrl(product.main_image);
                return `
                    <div class="product-item">
                        <div class="product-image-container">
                            <img src="${imgUrl}" alt="${product.name}" class="product-img">
                        </div>
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            <p class="price">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                            <button class="btn-gold" style="padding: 10px 20px; font-size: 0.7rem; margin-top:10px;" 
                                onclick="window.location.href='/products/'">Ver Detalhes</button>
                        </div>
                    </div>
                `;
            }).join('');
            attachAddToCartListeners();
        } catch (error) {
            console.error('Erro ao carregar destaques:', error);
        }
    }

    // Carregamento da Página de Produtos (Grade Completa)
    async function loadProducts() {
        const productsGrid = document.querySelector('.products-grid#products-container');
        if (!productsGrid) return;

        try {
            const response = await fetch(`${API_BASE_URL}/products/`);
            const products = await response.json();
            allProducts = products;
            productsGrid.innerHTML = '';

            products.forEach(product => {
                availableProducts[product.id] = product;
                let initialImageUrl = buildMediaUrl(product.main_image);
                
                let galleryHtml = '';
                if (product.images && product.images.length > 0) {
                    galleryHtml = '<div class="product-gallery">';
                    product.images.slice(0, 3).forEach(img => {
                        const thumbUrl = buildMediaUrl(img.image);
                        galleryHtml += `<img src="${thumbUrl}" class="gallery-thumb" data-full-img="${thumbUrl}" data-product-id="${product.id}">`;
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
                    <p>R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                    <button class="btn primary-btn add-to-cart-btn" data-id="${product.id}">Adicionar ao Carrinho</button>
                `;
                productsGrid.appendChild(productItem);
            });
            attachAddToCartListeners();
            attachGalleryListeners();
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
        }
    }

    // --- LÓGICA DO MODAL/LIGHTBOX ---
    function openImageModal(productId, initialUrl) {
        const product = availableProducts[productId];
        if (!product) return;
        currentGalleryImages = [];
        if (product.main_image) currentGalleryImages.push(buildMediaUrl(product.main_image));
        if (product.images) product.images.forEach(img => currentGalleryImages.push(buildMediaUrl(img.image)));
        
        const idx = currentGalleryImages.indexOf(initialUrl);
        currentImageIndex = idx !== -1 ? idx : 0;
        
        injectModalThumbnails(currentGalleryImages);
        updateModalDisplay(currentImageIndex);
        document.getElementById('image-modal').style.display = 'flex';
    }

    function updateModalDisplay(index) {
        if (currentGalleryImages.length === 0) return;
        document.getElementById('modal-main-image').src = currentGalleryImages[index];
        currentImageIndex = index;
        document.querySelectorAll('.modal-thumb').forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
    }

    function injectModalThumbnails(images) {
        const container = document.getElementById('modal-thumbnails-container');
        if (!container) return;
        container.innerHTML = images.map((url, i) => 
            `<img src="${url}" class="modal-thumb" onclick="updateModalDisplay(${i})">`
        ).join('');
    }

    // Eventos do Modal
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
        modal.querySelector('.prev-btn').onclick = () => {
            currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
            updateModalDisplay(currentImageIndex);
        };
        modal.querySelector('.next-btn').onclick = () => {
            currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
            updateModalDisplay(currentImageIndex);
        };
    }

    // --- LÓGICA DO CARRINHO (E-COMMERCE) ---
    function addToCart(product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) { existing.quantity++; } 
        else { cart.push({ ...product, quantity: 1, price: parseFloat(product.price) }); }
        saveCart();
        updateCartDisplay();
        alert(`${product.name} adicionado!`);
    }

    function saveCart() { localStorage.setItem('tammyClaraCart', JSON.stringify(cart)); }

    window.updateCartDisplay = function() {
        const container = document.querySelector('.cart-items');
        const totalSpan = document.getElementById('cart-total');
        let total = 0;

        if (container) {
            container.innerHTML = cart.length === 0 ? '<p>Carrinho vazio.</p>' : '';
            cart.forEach(item => {
                const sub = item.price * item.quantity;
                total += sub;
                container.innerHTML += `
                    <div class="cart-item">
                        <img src="${buildMediaUrl(item.main_image)}" class="cart-item-image">
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <div class="cart-quantity-controls">
                                <button onclick="changeQty(${item.id}, -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="changeQty(${item.id}, 1)">+</button>
                            </div>
                            <p>Subtotal: R$ ${sub.toFixed(2).replace('.', ',')}</p>
                            <button class="btn-remove" onclick="removeItem(${item.id})">Remover</button>
                        </div>
                    </div>`;
            });
        }
        if (totalSpan) totalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    window.changeQty = (id, delta) => {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
            saveCart(); updateCartDisplay();
        }
    };

    window.removeItem = (id) => {
        cart = cart.filter(i => i.id !== id);
        saveCart(); updateCartDisplay();
    };

    // --- LÓGICA PDV (PONTO DE VENDA) ---
    if (document.getElementById('pos-product-search')) {
        loadProducts(); // Reutiliza para carregar cache
        document.querySelectorAll('.payment-option-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.payment-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedPayment = btn.dataset.type;
            };
        });
    }

    window.searchCustomerByPhone = async function() {
        const phone = document.getElementById('client-phone').value.trim();
        if (!phone) return alert("Digite o WhatsApp");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${phone}/`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('client-name').value = data.first_name;
                document.getElementById('client-email').value = data.email;
                alert(`Cliente ${data.first_name} encontrado!`);
            } else { alert("Cliente não encontrado."); }
        } catch (e) { console.error(e); }
    };

    window.addProductToPOSCart = function(product) {
        const existing = posCart.find(i => i.id === product.id);
        if (existing) existing.quantity++;
        else posCart.push({ ...product, quantity: 1, price: parseFloat(product.price) });
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
                <button onclick="updatePOSQuantity(${item.id}, 1)">+</button>
                <button onclick="updatePOSQuantity(${item.id}, -1)">-</button>
            </div>`;
        }).join('');
        updatePosTotal(subtotal);
    };

    window.updatePOSQuantity = (id, delta) => {
        const item = posCart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) posCart = posCart.filter(i => i.id !== id);
            updatePOSCartDisplay();
        }
    };

    window.updatePosTotal = function(currentSubtotal) {
        const sub = currentSubtotal || posCart.reduce((s, i) => s + (i.price * i.quantity), 0);
        const disc = parseFloat(document.getElementById('discount-input').value) || 0;
        const total = sub * (1 - (disc / 100));
        document.getElementById('pos-subtotal').textContent = `R$ ${sub.toFixed(2).replace('.', ',')}`;
        document.getElementById('pos-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        return total;
    };

    window.finalizePosSale = async function() {
        if (posCart.length === 0) return alert("Carrinho vazio");
        const payload = {
            customer_info: {
                first_name: document.getElementById('client-name').value || "Cliente Loja",
                phone_number: document.getElementById('client-phone').value,
                email: document.getElementById('client-email').value
            },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
            payment_info: { method: selectedPayment, discount_percent: document.getElementById('discount-input').value }
        };

        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Venda Finalizada com Sucesso!");
                posCart = []; updatePOSCartDisplay();
            } else {
                const err = await res.json();
                alert("Erro: " + err.error);
            }
        } catch (e) { alert("Erro na comunicação com o servidor."); }
    };

    // Inicialização Final
    loadFeaturedProducts();
    loadProducts();
    updateCartDisplay();
});