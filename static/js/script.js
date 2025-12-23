/**
 * TAMMY'S STORE - CORE V15 (INTEGRAL)
 * Funcionalidades: Splash, CRM Multibusca, Máscaras, Galeria e PDV
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let allProducts = [], posCart = [], selectedPayment = 'PIX';
    let availableProducts = {}, cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    let currentGalleryImages = [], currentImageIndex = 0;

    // --- 🚀 INTERFACE: SPLASH E HERO CARD ---
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        const hero = document.getElementById('heroCard');
        if (hero) hero.classList.add('show');
    }, 2500); 

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) window.scrollY > 60 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
    });

    // --- 🛠️ MÁSCARAS CRM (PADRONIZAÇÃO DE DADOS) ---
    const applyMask = (val, pattern) => {
        let i = 0, v = val.replace(/\D/g, "");
        return pattern.replace(/#/g, () => v[i++] || "");
    };

    const setupInputs = () => {
        const cpfField = document.getElementById('client-cpf');
        const telField = document.getElementById('client-phone');
        if (cpfField) {
            cpfField.oninput = (e) => {
                e.target.value = applyMask(e.target.value, "###.###.###-##").substring(0, 14);
            };
        }
        if (telField) {
            telField.oninput = (e) => {
                const r = e.target.value.replace(/\D/g, "");
                const p = r.length <= 10 ? "(##) ####-####" : "(##) #####-####";
                e.target.value = applyMask(e.target.value, p).substring(0, 15);
            };
        }
    };

    // --- 🛒 CARREGAMENTO DIFERENCIADO (BOUTIQUE VS PDV) ---
    window.loadProducts = async () => {
        const container = document.getElementById('products-container') || document.getElementById('product-results');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            const products = await res.json();
            allProducts = products;
            
            container.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                const img = p.main_image ? (p.main_image.startsWith('http') ? p.main_image : '/media/'+p.main_image) : 'https://placehold.co/600x800';
                
                // LAYOUT PDV (Imagens Pequenas e Grid de Operação)
                if (document.getElementById('product-results')) {
                    return `
                    <div class="product-card-pos" onclick="addToPOS(${p.id})" style="border: 1px solid #eee; padding: 10px; text-align: center; cursor: pointer; border-radius: 8px;">
                        <img src="${img}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 4px;">
                        <h4 style="margin:8px 0; font-size:0.75rem;">${p.name}</h4>
                        <p style="color:#d4af37; font-weight:700; font-size:0.85rem;">R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>`;
                }
                
                // LAYOUT BOUTIQUE (Imagens Proporção 3:4 Fixas para iPhone)
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${img}" alt="${p.name}">
                    </div>
                    <div class="info-content">
                        <h3 style="font-family:'Playfair Display'; margin-top:15px; font-size:1.3rem;">${p.name}</h3>
                        <p class="price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="btn-gold-outline add-cart" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            // Ativar botões da Boutique
            document.querySelectorAll('.add-cart').forEach(b => b.onclick = (e) => {
                const prod = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === prod.id);
                exist ? exist.quantity++ : cart.push({...prod, quantity: 1, price: parseFloat(prod.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
                alert("Peça adicionada à sacola!");
            });
        } catch (e) { console.error("Erro Catálogo:", e); }
    };

    // --- 🛍️ SACOLA SITE ---
    window.updateUI = () => {
        const cont = document.querySelector('.cart-items');
        if (!cont) return;
        let total = 0;
        cont.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `
            <div class="cart-item">
                <img src="${item.main_image.startsWith('http') ? item.main_image : '/media/'+item.main_image}" width="70" height="90" style="object-fit:cover;">
                <div style="flex-grow:1;">
                    <h4 style="font-family:'Playfair Display';">${item.name}</h4>
                    <p>${item.quantity} un. - R$ ${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${item.id})" style="color:red; background:none; border:none; cursor:pointer; font-size:1.5rem;">&times;</button>
            </div>`;
        }).join('') || '<p style="text-align:center; padding:20px;">Sua sacola está vazia.</p>';
        if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.removeFromCart = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateUI();
    };

    // --- 👥 CRM: BUSCA MULTI-DADOS ---
    window.searchCustomer = async () => {
        const q = document.getElementById('client-search-input')?.value.replace(/\D/g, "");
        if (!q) return alert("Informe Nome, CPF ou WhatsApp para buscar.");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${q}/`);
            if (res.ok) {
                const d = await res.json();
                document.getElementById('client-name').value = d.first_name || '';
                document.getElementById('client-phone').value = d.phone_number || '';
                document.getElementById('client-cpf').value = d.cpf || '';
                document.getElementById('client-birth').value = d.birth_date || '';
                alert("Cliente localizado no CRM!");
            } else { alert("Cliente não encontrado. Preencha os campos para cadastrar."); }
        } catch (e) { console.error("Erro CRM:", e); }
    };

    // --- 🎞️ GALERIA NAVEGÁVEL ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        currentGalleryImages = [p.main_image, ...(p.images || []).map(i => i.image)].map(path => 
            path.startsWith('http') ? path : '/media/' + path
        );
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
        if (main) main.src = currentGalleryImages[currentImageIndex];
        const thumbs = document.getElementById('modal-thumbnails-container');
        if (thumbs) {
            thumbs.innerHTML = currentGalleryImages.map((src, i) => `
                <img src="${src}" class="modal-thumb ${i === currentImageIndex ? 'active' : ''}" onclick="jumpToImage(${i})">
            `).join('');
        }
    }

    window.jumpToImage = (i) => { currentImageIndex = i; updateGalleryUI(); };
    window.closeGallery = () => { 
        document.getElementById('image-modal').style.display = 'none'; 
        document.body.style.overflow = 'auto'; 
    };

    // --- 🏦 PDV: VENDAS ---
    window.setPayment = (method, btn) => {
        selectedPayment = method;
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

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
        cont.innerHTML = posCart.map(i => `
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee; font-size:0.9rem;">
                <span>${i.name} (x${i.quantity})</span>
                <span>R$ ${(i.price * i.quantity).toFixed(2)}</span>
            </div>`).join('') || '<p style="color:#999; text-align:center;">Carrinho Vazio</p>';
        const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
        document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
    };

    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Adicione produtos primeiro!");
        const clientName = document.getElementById('client-name').value;
        const clientPhone = document.getElementById('client-phone').value;
        if (!clientName || !clientPhone) return alert("Nome e WhatsApp são obrigatórios.");

        const payload = {
            customer_info: { 
                first_name: clientName, 
                phone_number: clientPhone.replace(/\D/g, ""), 
                cpf: document.getElementById('client-cpf').value.replace(/\D/g, ""),
                birth_date: document.getElementById('client-birth').value || null
            },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity })),
            payment_info: { method: selectedPayment },
            origin: 'POS'
        };

        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value 
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) { 
                document.getElementById('print-client').innerText = clientName;
                document.getElementById('print-total').innerText = document.getElementById('pos-total').innerText;
                document.getElementById('print-date').innerText = new Date().toLocaleString();
                window.print(); 
                alert("Venda registrada com sucesso!"); 
                posCart = []; 
                updatePOSUI(); 
            } else {
                alert("Erro ao processar venda. Tente novamente.");
            }
        } catch (e) { alert("Erro de conexão com o servidor."); }
    };

    setupInputs();
    loadProducts();
    updateUI();
});