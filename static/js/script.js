/**
 * TAMMY'S STORE - SISTEMA UNIFICADO ONE PAGE
 * Código Completo: Splash Screen Lenta + E-commerce + PDV + CRM
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURAÇÕES E ESTADO ---
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- 2. 🚀 INTERFACE LUXO (SPLASH SCREEN & SCROLL) ---
    const handleInterface = () => {
        const splash = document.getElementById('splash-screen');
        const heroCard = document.getElementById('heroCard');
        const mainHeader = document.getElementById('main-header');

        // Splash Screen estendida para 4.5 segundos para máximo impacto
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (splash) {
                    splash.style.opacity = '0';
                    splash.style.transform = 'translateY(-100%)';
                    setTimeout(() => { splash.style.visibility = 'hidden'; }, 1200);
                }
                document.body.style.opacity = '1';
                document.body.style.overflow = 'auto';
                if (heroCard) setTimeout(() => heroCard.classList.add('show'), 600);
            }, 4500); 
        });

        // Header Scrolled e Navegação Smooth Scroll
        window.addEventListener('scroll', () => {
            if (mainHeader) {
                window.scrollY > 50 ? mainHeader.classList.add('scrolled') : mainHeader.classList.remove('scrolled');
            }
        });
    };

    // --- 3. 🛠️ FUNÇÕES DE SUPORTE ---
    const buildMediaUrl = (path) => {
        if (!path) return '/static/img/placeholder-produto.png';
        if (path.startsWith('http')) return path;
        return '/media/' + (path.startsWith('/') ? path.substring(1) : path);
    };

    const getCsrfToken = () => document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;

    const saveCart = () => localStorage.setItem('tammyClaraCart', JSON.stringify(cart));

    // --- 4. 🛒 E-COMMERCE DINÂMICO (ONE PAGE) ---
    async function loadContent() {
        const containers = {
            featured: document.getElementById('featured-products-container'),
            all: document.getElementById('products-container')
        };

        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            const products = await res.json();
            allProducts = products;

            Object.keys(containers).forEach(key => {
                const cont = containers[key];
                if (!cont) return;
                cont.innerHTML = '';
                
                const list = key === 'featured' ? products.slice(0, 4) : products;

                list.forEach(p => {
                    availableProducts[p.id] = p;
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.innerHTML = `
                        <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                            <img src="${buildMediaUrl(p.main_image)}" alt="${p.name}">
                        </div>
                        <div class="product-info">
                            <h3 style="font-family:'Playfair Display'">${p.name}</h3>
                            <p class="price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                            <button class="btn-gold-outline add-to-cart" data-id="${p.id}">ADICIONAR</button>
                        </div>`;
                    cont.appendChild(card);
                });
            });

            // Listeners de Adição
            document.querySelectorAll('.add-to-cart').forEach(btn => {
                btn.onclick = (e) => {
                    const p = availableProducts[e.target.dataset.id];
                    const exist = cart.find(i => i.id === p.id);
                    exist ? exist.quantity++ : cart.push({...p, quantity: 1, price: parseFloat(p.price)});
                    saveCart();
                    updateCartUI();
                    alert("Adicionado à sacola!");
                };
            });
        } catch (e) { console.error("Erro no carregamento", e); }
    }

    // --- 5. 🎞️ GALERIA MODAL ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        const images = [buildMediaUrl(p.main_image), ...(p.images || []).map(i => buildMediaUrl(i.image))];
        const modal = document.getElementById('image-modal');
        if (!modal) return;

        document.getElementById('modal-main-image').src = images[0];
        document.getElementById('modal-thumbnails-container').innerHTML = images.map((src, i) => 
            `<img src="${src}" class="modal-thumb ${i===0?'active':''}" onclick="updateModalImg(this, '${src}')">`
        ).join('');
        modal.style.display = 'flex';
    };

    window.updateModalImg = (el, src) => {
        document.getElementById('modal-main-image').src = src;
        document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    };

    // --- 6. 📝 CHECKOUT DIRETO PARA ADMIN (LEADS) ---
    window.updateCartUI = () => {
        const cont = document.querySelector('.cart-items');
        if (!cont) return;
        let total = 0;
        cont.innerHTML = cart.map(i => {
            total += i.price * i.quantity;
            return `<div class="cart-item">
                <img src="${buildMediaUrl(i.main_image)}" width="70">
                <div class="cart-details">
                    <h4>${i.name}</h4>
                    <p>${i.quantity}x R$ ${i.price.toFixed(2)}</p>
                    <button onclick="removeCart(${i.id})" style="color:red;border:none;background:none;cursor:pointer;">Remover</button>
                </div>
            </div>`;
        }).join('') || '<p>Sua sacola está vazia.</p>';
        document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.removeCart = (id) => {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartUI();
    };

    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            if (!cart.length) return alert("Saco vazia!");
            const n = prompt("Nome completo:"), p = prompt("WhatsApp (DDD):");
            if (!n || !p) return alert("Campos obrigatórios!");

            const payload = {
                customer_info: { first_name: n, phone_number: p, email: "" },
                items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
                origin: 'SITE'
            };

            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                localStorage.removeItem('tammyClaraCart');
                window.location.href = '/order-success/';
            }
        };
    }

    // --- 7. 🏦 PDV (MANTIDO ÍNTEGRO) ---
    window.searchProducts = () => {
        const q = document.getElementById('pos-product-search').value.toLowerCase();
        const f = allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
        const res = document.getElementById('product-results');
        if (res) res.innerHTML = f.map(p => `<div class="product-card" onclick="addToPOS(${p.id})"><h4>${p.name}</h4><p>R$ ${p.price}</p></div>`).join('');
    };

    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        const ex = posCart.find(i => i.id === id);
        ex ? ex.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
        const cont = document.getElementById('pos-cart-items');
        if (cont) cont.innerHTML = posCart.map(i => `<div>${i.name} - ${i.quantity}x</div>`).join('');
    };

    // --- 🔃 INICIALIZAÇÃO ---
    handleInterface();
    loadContent();
    updateCartUI();
    
    // Modal Close
    const m = document.getElementById('image-modal');
    if (m) {
        const cb = document.querySelector('.close-modal') || document.querySelector('.close-btn');
        if (cb) cb.onclick = () => m.style.display = 'none';
    }
});