/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V17 (FULL RESTORED)
 * Funcionalidades: CRM Total, PDV, Pagamentos, Galeria Corrigida e Padronização.
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    console.log("[SISTEMA] V17 Full - Todas as funcionalidades restauradas e corrigidas.");

    // --- 🚀 INTERFACE E SPLASH SCREEN ---
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

    // --- 🎭 MÁSCARAS DE DADOS (CRM) ---
    const maskCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    const maskPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

    const cpfInput = document.getElementById('client-cpf');
    const phoneInput = document.getElementById('client-phone');
    if (cpfInput) cpfInput.addEventListener('input', (e) => e.target.value = maskCPF(e.target.value));
    if (phoneInput) phoneInput.addEventListener('input', (e) => e.target.value = maskPhone(e.target.value));

    // --- 🛒 CARREGAMENTO DE CATÁLOGO (Integrado com Site e PDV) ---
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
                // Padronização: A função openGallery é chamada no clique da imagem do site
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="${isPDV ? `addToPOS(${p.id})` : `openGallery(${p.id})`}">
                        <img src="${buildUrl(p.main_image)}" class="standard-img" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <p class="price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                        ${!isPDV ? `<button class="btn-buy" onclick="openGallery(${p.id})">VER DETALHES</button>` : ''}
                    </div>
                </div>`;
            }).join('');
        } catch (e) { console.error("[ERRO] Catálogo offline."); }
    };

    // --- 🖼️ GALERIA COM NAVEGAÇÃO CORRIGIDA ---
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

    window.changeImage = (step) => {
        if (currentGalleryImages.length <= 1) return;
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

    // Configuração dos eventos de fechamento do Modal
    const modal = document.getElementById('image-modal');
    const closeBtn = document.getElementById('closeModalBtn');
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    }

    // Botões de navegação lateral
    const btnPrev = document.getElementById('prevBtn');
    const btnNext = document.getElementById('nextBtn');
    if (btnPrev) btnPrev.onclick = () => changeImage(-1);
    if (btnNext) btnNext.onclick = () => changeImage(1);

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    // Efeito de Zoom
    const modalMainImg = document.getElementById('modal-main-image');
    if (modalMainImg) {
        modalMainImg.onclick = function() {
            this.style.transform = this.style.transform === "scale(1.5)" ? "scale(1)" : "scale(1.5)";
            this.style.cursor = this.style.transform === "scale(1.5)" ? "zoom-out" : "zoom-in";
        };
    }

    // --- 👥 CRM: BUSCA DE CLIENTES ---
    window.searchCustomer = async () => {
        const query = document.getElementById('client-search-input')?.value;
        if (!query) return alert("Digite Nome, CPF ou WhatsApp.");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${query}/`);
            if (res.ok) {
                const data = await res.json();
                if (document.getElementById('client-name')) document.getElementById('client-name').value = data.first_name || '';
                if (document.getElementById('client-phone')) document.getElementById('client-phone').value = data.phone_number ? maskPhone(data.phone_number) : '';
                if (document.getElementById('client-cpf')) document.getElementById('client-cpf').value = data.cpf ? maskCPF(data.cpf) : '';
                if (document.getElementById('client-birth')) document.getElementById('client-birth').value = data.birth_date || '';
                alert("Cliente localizado!");
            } else { alert("Cliente não encontrado."); }
        } catch (e) { alert("Erro na busca CRM."); }
    };

    // --- 🏦 PDV: PAGAMENTOS E FINALIZAÇÃO ---
    window.setPayment = (method, btn) => {
        selectedPayment = method;
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    };

    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Carrinho vazio!");
        const cName = document.getElementById('client-name')?.value;
        const cPhoneInput = document.getElementById('client-phone')?.value || '';
        const cPhone = cPhoneInput.replace(/\D/g, '');
        
        if (!cName || cPhone.length < 10) return alert("Nome e Celular são obrigatórios.");

        const payload = {
            customer_info: { 
                first_name: cName, 
                phone_number: cPhone,
                cpf: document.getElementById('client-cpf')?.value.replace(/\D/g, '') || '',
                birth_date: document.getElementById('client-birth')?.value || null 
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
                const printClient = document.getElementById('print-client');
                const printTotal = document.getElementById('print-total');
                if (printClient) printClient.innerText = cName;
                if (printTotal) printTotal.innerText = document.getElementById('pos-total').innerText;
                
                window.print();
                alert("Venda realizada com sucesso!");
                posCart = []; 
                updatePOSUI();
            } else { alert("Erro ao finalizar venda."); }
        } catch (e) { alert("Erro de conexão com o servidor."); }
    };

    // --- 🛒 CARRINHO PDV (ADICIONAR/REMOVER) ---
    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        if (p) {
            const exist = posCart.find(i => i.id === id);
            if (exist) {
                exist.quantity++;
            } else {
                posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
            }
            updatePOSUI();
        }
    };

    window.removeFromPOS = (id) => {
        posCart = posCart.filter(i => i.id !== id);
        updatePOSUI();
    };

    window.updatePOSUI = () => {
        const cont = document.getElementById('pos-cart-items');
        if (!cont) return;
        cont.innerHTML = posCart.map(i => `
            <div class="cart-row" style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <span>${i.name} (x${i.quantity})</span>
                <div>
                    <span style="margin-right:10px;">R$ ${(i.price * i.quantity).toFixed(2).replace('.', ',')}</span>
                    <button onclick="removeFromPOS(${i.id})" class="del-btn" style="color:red; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('') || '<p>Carrinho Vazio</p>';
            
        const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
        const totalDisplay = document.getElementById('pos-total');
        if (totalDisplay) totalDisplay.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    // Inicialização do catálogo
    loadProducts();
});