/**
 * TAMMY'S STORE - SISTEMA UNIFICADO ONE PAGE
 * Versão Final: Luxo, Estabilidade e Checkout Admin
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURAÇÕES E ESTADO GLOBAL ---
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- 2. 🚀 INTERFACE UX (SPLASH SCREEN 6 SEGUNDOS) ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');
    const mainBody = document.body;

    window.addEventListener('load', () => {
        // Tempo estendido para uma entrada triunfal de boutique
        setTimeout(() => {
            if (splash) {
                splash.style.opacity = '0';
                splash.style.transform = 'translateY(-100%)';
                setTimeout(() => { splash.style.visibility = 'hidden'; }, 1500);
            }
            // Torna o conteúdo visível suavemente
            if (mainBody) {
                mainBody.style.opacity = '1';
            }
            // Animação do card central
            if (heroCard) {
                setTimeout(() => heroCard.classList.add('show'), 800);
            }
        }, 6000); 
    });

    // Efeito de Header ao rolar a página
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            window.scrollY > 80 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
        }
    });

    // --- 3. 🛠️ SUPORTE PARA URLs DE MÍDIA ---
    function buildUrl(path) {
        if (!path) return '/static/img/placeholder-produto.png';
        if (path.startsWith('http')) return path;
        const cleaned = path.startsWith('/') ? path.substring(1) : path;
        return '/media/' + cleaned;
    }

    // --- 4. 🛒 CARREGAMENTO DINÂMICO DO CATÁLOGO ---
    async function loadProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        try {
            const response = await fetch(`${API_BASE_URL}/products/`);
            if (!response.ok) throw new Error("Falha na API");
            const products = await response.json();
            
            container.innerHTML = ''; // Limpa o carregando

            products.forEach(p => {
                availableProducts[p.id] = p;
                
                const productDiv = document.createElement('div');
                productDiv.className = 'product-card';
                productDiv.innerHTML = `
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${buildUrl(p.main_image)}" alt="${p.name}">
                    </div>
                    <div class="product-info">
                        <h3 style="font-family:'Playfair Display'; font-size: 1.4rem; margin-top: 15px;">${p.name}</h3>
                        <p style="color: #d4af37; letter-spacing: 2px; margin-top: 10px; font-weight: 600;">
                            R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}
                        </p>
                        <button class="btn-gold-outline add-cart-btn" data-id="${p.id}" style="width:100%;">
                            ADICIONAR À SACOLA
                        </button>
                    </div>
                `;
                container.appendChild(productDiv);
            });

            // Ativa os cliques de compra
            document.querySelectorAll('.add-cart-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.target.dataset.id;
                    const prod = availableProducts[id];
                    if (!prod) return;

                    const exist = cart.find(i => i.id === prod.id);
                    if (exist) {
                        exist.quantity++;
                    } else {
                        cart.push({ ...prod, quantity: 1, price: parseFloat(prod.price) });
                    }
                    
                    localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                    updateCartDisplay();
                    alert("Peça reservada com sucesso!");
                };
            });

        } catch (e) {
            console.error("Erro ao carregar coleção:", e);
            container.innerHTML = "<p>Ocorreu um erro ao carregar os itens.</p>";
        }
    }

    // --- 5. 📝 GESTÃO DA SACOLA E CHECKOUT ---
    window.updateCartDisplay = () => {
        const cartItemsDiv = document.querySelector('.cart-items');
        const totalSpan = document.getElementById('cart-total');
        if (!cartItemsDiv) return;

        let total = 0;
        cartItemsDiv.innerHTML = '';

        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p style="text-align:center; padding: 40px; opacity: 0.5;">Sua sacola está vazia.</p>';
        } else {
            cart.forEach(item => {
                const sub = item.price * item.quantity;
                total += sub;
                
                cartItemsDiv.innerHTML += `
                    <div class="cart-item">
                        <img src="${buildUrl(item.main_image)}" width="80" height="110" style="object-fit: cover; border-radius: 2px;">
                        <div style="flex-grow: 1; padding: 0 20px;">
                            <h4 style="font-family:'Playfair Display';">${item.name}</h4>
                            <p style="font-size: 0.8rem; opacity: 0.5;">${item.quantity} unidade(s)</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-weight: 600;">R$ ${sub.toFixed(2).replace('.', ',')}</p>
                            <button onclick="removeProduct(${item.id})" 
                                    style="color:red; background:none; border:none; cursor:pointer; font-size: 0.7rem; margin-top: 10px;">
                                REMOVER
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        if (totalSpan) totalSpan.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.removeProduct = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateCartDisplay();
    };

    // Função de Checkout para o Admin (Leads)
    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            if (cart.length === 0) return alert("Sua sacola está vazia.");
            
            const name = prompt("Seu nome completo:");
            const phone = prompt("Seu WhatsApp (com DDD):");
            if (!name || !phone) return alert("Nome e Telefone são obrigatórios para a reserva.");

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

            try {
                const res = await fetch(`${API_BASE_URL}/checkout/`, {
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

                if (res.ok) {
                    const data = await res.json();
                    localStorage.removeItem('tammyClaraCart');
                    window.location.href = `/order-success/?id=${data.sale_id}`;
                } else {
                    alert("Erro ao processar reserva. Tente novamente.");
                }
            } catch (err) {
                console.error("Erro no checkout:", err);
            }
        };
    }

    // --- 6. 🖼️ MODAL DE GALERIA ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;

        const imgs = [buildUrl(p.main_image)];
        if (p.images) p.images.forEach(i => imgs.push(buildUrl(i.image)));
        
        const modal = document.getElementById('image-modal');
        const mainImg = document.getElementById('modal-main-image');
        const thumbsContainer = document.getElementById('modal-thumbnails-container');

        if (modal && mainImg) {
            mainImg.src = imgs[0];
            if (thumbsContainer) {
                thumbsContainer.innerHTML = imgs.map((s, i) => `
                    <img src="${s}" class="modal-thumb ${i===0?'active':''}" 
                         onclick="changeImage(this, '${s}')">
                `).join('');
            }
            modal.style.display = 'flex';
        }
    };

    window.changeImage = (thumb, src) => {
        const main = document.getElementById('modal-main-image');
        if (main) main.src = src;
        document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
    };

    // Botão Fechar Modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.onclick = () => {
            const m = document.getElementById('image-modal');
            if (m) m.style.display = 'none';
        };
    }

    // --- 🔃 INICIALIZAÇÃO ---
    loadProducts();
    updateCartDisplay();
});