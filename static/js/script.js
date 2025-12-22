/**
 * TAMMY'S STORE - CORE SCRIPT UNIFICADO
 * Versão: Full Restoration + Navigable Gallery + POS Printing
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    let selectedPayment = 'DINHEIRO'; // Valor padrão para evitar erros
    
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');

    // --- SPLASH SCREEN E HERO CARD ---
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        if (heroCard) setTimeout(() => heroCard.classList.add('show'), 400);
    }, 2500); 

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) window.scrollY > 60 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
    });

    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/400x600?text=Foto+Indisponivel';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

    // --- CARREGAMENTO DE PRODUTOS ---
    async function loadProducts() {
        const container = document.getElementById('products-container') || document.getElementById('product-results');
        if (!container) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            const products = await res.json();
            allProducts = products;
            container.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                const imgSource = buildUrl(p.main_image);
                if (document.getElementById('product-results')) {
                    return `<div class="product-card" onclick="addToPOS(${p.id})">
                        <img src="${imgSource}" onerror="this.onerror=null; this.src='https://placehold.co/150x150?text=Sem+Foto';">
                        <h4>${p.name}</h4><p>R$ ${parseFloat(p.price).toFixed(2)}</p></div>`;
                }
                return `<div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${imgSource}" alt="${p.name}" onerror="this.onerror=null; this.src='https://placehold.co/400x600?text=Sincronizando...';">
                    </div>
                    <div style="flex-grow:1;"><h3 style="font-family:'Playfair Display'; margin-top:10px;">${p.name}</h3>
                    <p style="color:#d4af37; font-weight:600; margin:10px 0;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p></div>
                    <button class="btn-gold-outline add-cart-btn" data-id="${p.id}">ADICIONAR À SACOLA</button></div>`;
            }).join('');

            document.querySelectorAll('.add-cart-btn').forEach(b => b.onclick = (e) => {
                const prod = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === prod.id);
                exist ? exist.quantity++ : cart.push({...prod, quantity: 1, price: parseFloat(prod.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
                alert("Peça adicionada!");
            });
        } catch (e) { console.error(e); }
    }

    // --- INTERFACE DA SACOLA (SITE) ---
    window.updateUI = () => {
        const cont = document.querySelector('.cart-items');
        const totalDisp = document.getElementById('cart-total');
        if (!cont) return;
        let total = 0;
        cont.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `<div class="cart-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <img src="${buildUrl(item.main_image)}" width="60" height="80" style="object-fit:cover;">
                <div style="flex-grow:1;"><h4>${item.name}</h4><p>${item.quantity} un.</p></div>
                <button onclick="remove(${item.id})" style="color:red; background:none; border:none; cursor:pointer;">&times;</button></div>`;
        }).join('') || '<p>Sua sacola está vazia.</p>';
        if (totalDisp) totalDisp.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.remove = (id) => { cart = cart.filter(i => i.id !== id); localStorage.setItem('tammyClaraCart', JSON.stringify(cart)); updateUI(); };

    // --- CHECKOUT SITE ---
    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            const n = prompt("Nome:"), p = prompt("WhatsApp:");
            if (!n || !p) return;
            try {
                await fetch(`${API_BASE_URL}/checkout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value },
                    body: JSON.stringify({ customer_info: { first_name: n, phone_number: p }, items: cart.map(i => ({ id: i.id, quantity: i.quantity })), origin: 'SITE' })
                });
                localStorage.removeItem('tammyClaraCart'); window.location.href = '/order-success/';
            } catch (e) { alert("Erro."); }
        };
    }

    // --- LÓGICA DE GALERIA ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        currentGalleryImages = [buildUrl(p.main_image), ...(p.images || []).map(img => buildUrl(img.image))];
        currentImageIndex = 0;
        updateGalleryUI();
        document.getElementById('image-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.changeImage = (dir) => {
        currentImageIndex += dir;
        if (currentImageIndex < 0) currentImageIndex = currentGalleryImages.length - 1;
        if (currentImageIndex >= currentGalleryImages.length) currentImageIndex = 0;
        updateGalleryUI();
    };

    function updateGalleryUI() {
        const main = document.getElementById('modal-main-image');
        const thumbs = document.getElementById('modal-thumbnails-container');
        if (main) main.src = currentGalleryImages[currentImageIndex];
        if (thumbs) {
            thumbs.innerHTML = currentGalleryImages.map((src, i) => `
                <img src="${src}" class="modal-thumb ${i === currentImageIndex ? 'active' : ''}" onclick="jumpToImage(${i})">
            `).join('');
        }
    }

    window.jumpToImage = (i) => { currentImageIndex = i; updateGalleryUI(); };
    window.closeGallery = () => { document.getElementById('image-modal').style.display = 'none'; document.body.style.overflow = 'auto'; };

    // --- LÓGICA PDV ---
    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        if (!p) return;
        const exist = posCart.find(i => i.id === id);
        exist ? exist.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
        updatePOSUI();
    };

    window.updatePOSUI = () => {
        const cont = document.getElementById('pos-cart-items');
        if (!cont) return;
        cont.innerHTML = posCart.map(i => `<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>${i.name} (${i.quantity}x)</span><button onclick="removeFromPOS(${i.id})" style="color:red; background:none; border:none;">&times;</button></div>`).join('') || 'Vazio';
        const sub = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
        if (document.getElementById('pos-total')) document.getElementById('pos-total').innerText = `R$ ${sub.toFixed(2)}`;
    };

    window.removeFromPOS = (id) => { posCart = posCart.filter(i => i.id !== id); updatePOSUI(); };

    // --- NOVA FUNÇÃO: FINALIZAÇÃO E IMPRESSÃO PDV ---
    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Carrinho vazio!");
        
        const clientName = document.getElementById('client-name')?.value || "Consumidor";
        const clientPhone = document.getElementById('client-phone')?.value || "";
        const totalValue = document.getElementById('pos-total').innerText;

        // 1. Preenche os dados no Cupom de Impressão (HTML)
        const printItems = document.getElementById('print-items');
        if (printItems) {
            printItems.innerHTML = posCart.map(i => `
                <div style="display:flex; justify-content:space-between;">
                    <span>${i.quantity}x ${i.name}</span>
                    <span>R$ ${(i.price * i.quantity).toFixed(2)}</span>
                </div>
            `).join('');
        }
        
        if (document.getElementById('print-total')) document.getElementById('print-total').innerText = totalValue;
        if (document.getElementById('print-client')) document.getElementById('print-client').innerText = clientName;
        if (document.getElementById('print-date')) document.getElementById('print-date').innerText = new Date().toLocaleString('pt-BR');

        // 2. Envia para o Banco de Dados
        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value 
                },
                body: JSON.stringify({
                    customer_info: { first_name: clientName, phone_number: clientPhone },
                    items: posCart.map(i => ({ id: i.id, quantity: i.quantity })),
                    payment_info: { method: selectedPayment },
                    origin: 'POS'
                })
            });

            if (res.ok) { 
                // 3. Dispara a Impressora se a venda for confirmada no servidor
                window.print(); 
                
                alert("Venda realizada e Cupom enviado para impressão!"); 
                posCart = []; 
                updatePOSUI();
                // Limpa campos do cliente
                if(document.getElementById('client-name')) document.getElementById('client-name').value = '';
                if(document.getElementById('client-phone')) document.getElementById('client-phone').value = '';
            } else {
                alert("Ocorreu um problema ao salvar a venda no servidor.");
            }
        } catch (e) { 
            console.error(e);
            alert("Erro de conexão ao finalizar."); 
        }
    };

    // Listener para o seletor de pagamento (caso exista no HTML)
    const payMethod = document.getElementById('payment-method');
    if (payMethod) {
        payMethod.addEventListener('change', (e) => {
            selectedPayment = e.target.value;
        });
    }

    // Inicialização
    loadProducts();
    updateUI();
});