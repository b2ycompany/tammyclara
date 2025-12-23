/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V17 (FULL & FIX)
 * Foco: Correção de Fechamento de Modal, Galeria com Zoom e CRM Total
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    // --- 🚀 INTERFACE E SPLASH ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        if (heroCard) heroCard.classList.add('show');
    }, 2500); 

    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/400x600?text=Sem+Foto';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

    // --- 🎭 MÁSCARAS CRM ---
    const maskCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    const maskPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

    const cpfInput = document.getElementById('client-cpf');
    const phoneInput = document.getElementById('client-phone');
    if (cpfInput) cpfInput.addEventListener('input', (e) => e.target.value = maskCPF(e.target.value));
    if (phoneInput) phoneInput.addEventListener('input', (e) => e.target.value = maskPhone(e.target.value));

    // --- 🛒 CARREGAMENTO DE CATÁLOGO ---
    window.loadProducts = async () => {
        const pdvContainer = document.getElementById('product-results');
        const siteContainer = document.getElementById('products-container');
        const container = pdvContainer || siteContainer;
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            allProducts = await res.json();
            container.innerHTML = allProducts.map(p => {
                availableProducts[p.id] = p;
                const isPDV = !!pdvContainer;
                return `
                <div class="product-card" onclick="${isPDV ? `addToPOS(${p.id})` : `openGallery(${p.id})`}">
                    <div class="product-img-wrapper">
                        <img src="${buildUrl(p.main_image)}" class="standard-img" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <p class="price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                        ${!isPDV ? `<button class="btn-buy">VER DETALHES</button>` : ''}
                    </div>
                </div>`;
            }).join('');
        } catch (e) { console.error("[ERRO] Falha no carregamento."); }
    };

    // --- 🖼️ GALERIA COM NAVEGAÇÃO, ZOOM E FIX FECHAMENTO ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        currentGalleryImages = [buildUrl(p.main_image)];
        if (p.images) p.images.forEach(img => currentGalleryImages.push(buildUrl(img.image)));
        currentImageIndex = 0;
        updateGalleryUI();
        
        const modal = document.getElementById('image-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeGallery = () => {
        const modal = document.getElementById('image-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            // Reset do Zoom ao fechar
            const mainImg = document.getElementById('modal-main-image');
            if (mainImg) mainImg.style.transform = "scale(1)";
        }
    };

    window.changeImage = (step) => {
        currentImageIndex = (currentImageIndex + step + currentGalleryImages.length) % currentGalleryImages.length;
        updateGalleryUI();
    };

    window.jumpToImage = (idx) => {
        currentImageIndex = idx;
        updateGalleryUI();
    };

    function updateGalleryUI() {
        const main = document.getElementById('modal-main-image');
        const thumbs = document.getElementById('modal-thumbnails-container');
        if (main) {
            main.src = currentGalleryImages[currentImageIndex];
            main.style.transform = "scale(1)"; 
        }
        if (thumbs) {
            thumbs.innerHTML = currentGalleryImages.map((src, i) => `
                <img src="${src}" class="thumb ${i === currentImageIndex ? 'active' : ''}" onclick="jumpToImage(${i})">
            `).join('');
        }
    }

    // Zoom ao clicar na imagem
    const modalImg = document.getElementById('modal-main-image');
    if (modalImg) {
        modalImg.onclick = function(e) {
            e.stopPropagation(); // Impede fechar ao clicar na imagem
            this.style.transform = this.style.transform === "scale(1.5)" ? "scale(1)" : "scale(1.5)";
        };
    }

    // Fechar ao clicar fora ou no botão
    const modalOverlay = document.getElementById('image-modal');
    if (modalOverlay) {
        modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeGallery(); };
    }
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) closeBtn.onclick = closeGallery;

    // --- 👥 CRM BUSCA ---
    window.searchCustomer = async () => {
        const query = document.getElementById('client-search-input')?.value;
        if (!query) return alert("Digite Nome, CPF ou WhatsApp.");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${query}/`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('client-name').value = data.first_name || '';
                document.getElementById('client-phone').value = data.phone_number ? maskPhone(data.phone_number) : '';
                document.getElementById('client-cpf').value = data.cpf ? maskCPF(data.cpf) : '';
                document.getElementById('client-birth').value = data.birth_date || '';
                alert("Cliente localizado!");
            } else { alert("Cliente não encontrado."); }
        } catch (e) { console.error(e); }
    };

    // --- 🏦 PDV FINALIZAÇÃO ---
    window.setPayment = (method, btn) => {
        selectedPayment = method;
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Carrinho vazio!");
        const cName = document.getElementById('client-name').value;
        const cPhone = document.getElementById('client-phone').value.replace(/\D/g, '');
        if (!cName || cPhone.length < 10) return alert("Nome e Celular obrigatórios.");

        const payload = {
            customer_info: { 
                first_name: cName, phone_number: cPhone,
                cpf: document.getElementById('client-cpf').value.replace(/\D/g, ''),
                birth_date: document.getElementById('client-birth').value || null 
            },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity })),
            payment_info: { method: selectedPayment },
            origin: 'POS'
        };

        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                document.getElementById('print-client').innerText = cName;
                document.getElementById('print-total').innerText = document.getElementById('pos-total').innerText;
                window.print();
                alert("Venda realizada!");
                posCart = []; updatePOSUI();
            }
        } catch (e) { console.error(e); }
    };

    // --- 🛒 CARRINHO ---
    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        if (p) {
            const exist = posCart.find(i => i.id === id);
            exist ? exist.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
            updatePOSUI();
        }
    };
    window.removeFromPOS = (id) => { posCart = posCart.filter(i => i.id !== id); updatePOSUI(); };
    window.updatePOSUI = () => {
        const cont = document.getElementById('pos-cart-items');
        if (!cont) return;
        cont.innerHTML = posCart.map(i => `
            <div class="cart-row"><span>${i.name} (x${i.quantity})</span>
            <div><span>R$ ${(i.price * i.quantity).toFixed(2)}</span>
            <button onclick="removeFromPOS(${i.id})" class="del-btn"><i class="fas fa-trash"></i></button></div></div>`).join('') || '<p>Vazio</p>';
        const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
        document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
    };

    loadProducts();
});