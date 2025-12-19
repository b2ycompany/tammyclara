/**
 * TAMMY'S STORE - CORE SCRIPT (ONE PAGE + PDV INTEGRADO)
 * Código Completo sem abreviações.
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- 1. APRESENTAÇÃO LUXO (6 SEGUNDOS) ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');
    const mainBody = document.body;

    window.addEventListener('load', () => {
        setTimeout(() => {
            if (splash) {
                splash.style.opacity = '0';
                splash.style.transform = 'translateY(-100%)';
                setTimeout(() => { splash.style.visibility = 'hidden'; }, 1500);
            }
            if (mainBody) mainBody.style.opacity = '1';
            if (heroCard) setTimeout(() => heroCard.classList.add('show'), 1000);
        }, 6000); // 6 segundos de exposição para impacto de marca
    });

    // --- 2. HEADER SCROLL EFFECT ---
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            window.scrollY > 80 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
        }
    });

    // --- 3. HELPER: CONSTRUÇÃO DE URL DE MÍDIA ---
    const buildMediaUrl = (path) => {
        if (!path) return '/static/img/placeholder-produto.png';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return '/media/' + cleanPath;
    };

    // --- 4. CARREGAMENTO DINÂMICO DE PRODUTOS ---
    async function loadProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        try {
            const response = await fetch(`${API_BASE_URL}/products/`);
            if (!response.ok) throw new Error("Erro na API de produtos");
            const products = await response.json();
            
            container.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${buildMediaUrl(p.main_image)}" alt="${p.name}">
                    </div>
                    <h3 style="font-family:'Playfair Display'; font-size: 1.4rem; margin-top: 15px;">${p.name}</h3>
                    <p style="color: #d4af37; letter-spacing: 2px; margin-top: 10px; font-weight:600;">
                        R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}
                    </p>
                    <button class="btn-gold-outline add-to-cart-btn" data-id="${p.id}">
                        ADICIONAR À SACOLA
                    </button>
                </div>`;
            }).join('');

            // Atribuição de cliques após renderização
            document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.target.dataset.id;
                    const prod = availableProducts[id];
                    if (!prod) return;

                    const existing = cart.find(i => i.id === prod.id);
                    if (existing) {
                        existing.quantity++;
                    } else {
                        cart.push({ ...prod, quantity: 1, price: parseFloat(prod.price) });
                    }
                    
                    localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                    updateCartUI();
                    alert("Peça reservada em sua sacola!");
                };
            });
        } catch (error) {
            console.error("Erro ao carregar coleção:", error);
            container.innerHTML = "<p>Ocorreu um erro ao carregar os produtos.</p>";
        }
    }

    // --- 5. UI DA SACOLA (UPDATE) ---
    window.updateCartUI = () => {
        const cartContainer = document.querySelector('.cart-items');
        const cartTotalSpan = document.getElementById('cart-total');
        if (!cartContainer) return;

        let total = 0;
        cartContainer.innerHTML = cart.map(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            return `
            <div class="cart-item">
                <img src="${buildMediaUrl(item.main_image)}" width="80" height="110">
                <div style="flex-grow: 1;">
                    <h4 style="font-family:'Playfair Display';">${item.name}</h4>
                    <p style="font-size: 0.8rem; opacity: 0.5;">${item.quantity} unidade(s)</p>
                </div>
                <div style="text-align: right;">
                    <p style="font-weight:600;">R$ ${subtotal.toFixed(2).replace('.', ',')}</p>
                    <button onclick="removeFromCart(${item.id})" style="color:red; background:none; border:none; cursor:pointer; font-size: 0.7rem; margin-top: 10px;">REMOVER</button>
                </div>
            </div>`;
        }).join('') || '<p style="text-align:center; padding: 40px; opacity: 0.5;">Sua sacola está vazia.</p>';
        
        if (cartTotalSpan) cartTotalSpan.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.removeFromCart = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateCartUI();
    };

    // --- 6. CHECKOUT DIRETAMENTE PARA O ADMIN (LEADS) ---
    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            if (cart.length === 0) return alert("Sua sacola está vazia.");
            
            const name = prompt("Nome completo para consulta de estoque:");
            const phone = prompt("WhatsApp (com DDD):");
            if (!name || !phone) return alert("Nome e WhatsApp são obrigatórios para prosseguir.");

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

            try {
                const response = await fetch(`${API_BASE_URL}/checkout/`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'X-CSRFToken': csrfToken 
                    },
                    body: JSON.stringify({
                        customer_info: { first_name: name, phone_number: phone, email: "" },
                        items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
                        origin: 'SITE'
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    localStorage.removeItem('tammyClaraCart');
                    window.location.href = `/order-success/?id=${result.sale_id}`;
                } else {
                    alert("Erro ao registrar pedido. Tente novamente mais tarde.");
                }
            } catch (error) {
                console.error("Erro no checkout:", error);
                alert("Falha na comunicação com o servidor.");
            }
        };
    }

    // --- 7. GALERIA MODAL DE IMAGENS ---
    window.openGallery = (id) => {
        const product = availableProducts[id];
        if (!product) return;

        const allImages = [buildMediaUrl(product.main_image), ...(product.images || []).map(img => buildMediaUrl(img.image))];
        const modal = document.getElementById('image-modal');
        const modalMainImg = document.getElementById('modal-main-image');
        const modalThumbsContainer = document.getElementById('modal-thumbnails-container');

        if (modal && modalMainImg) {
            modalMainImg.src = allImages[0];
            if (modalThumbsContainer) {
                modalThumbsContainer.innerHTML = allImages.map((src, idx) => `
                    <img src="${src}" class="modal-thumb ${idx === 0 ? 'active' : ''}" 
                         onclick="changeGalleryImg(this, '${src}')">
                `).join('');
            }
            modal.style.display = 'flex';
        }
    };

    window.changeGalleryImg = (thumbnail, src) => {
        const main = document.getElementById('modal-main-image');
        if (main) main.src = src;
        document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    };

    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            const modal = document.getElementById('image-modal');
            if (modal) modal.style.display = 'none';
        };
    }

    // --- 8. INICIALIZAÇÃO ---
    loadProducts();
    updateCartUI();
});