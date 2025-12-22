/**
 * TAMMY'S STORE - CORE SCRIPT UNIFICADO V7
 * Foco: CRM Multibusca (Nome, CPF, Tel), Pagamentos e Cadastro Automático
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX'; // Padrão inicial
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    // --- 🚀 INTERFACE E SPLASH (DESIGN ORIGINAL) ---
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

    // --- 🛒 CATÁLOGO ---
    window.loadProducts = async () => {
        const container = document.getElementById('products-container') || document.getElementById('product-results');
        if (!container) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            const products = await res.json();
            allProducts = products;
            container.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                const imgSource = buildUrl(p.main_image);
                
                // Se estiver no PDV
                if (document.getElementById('product-results')) {
                    return `
                    <div class="product-card" onclick="addToPOS(${p.id})">
                        <img src="${imgSource}" onerror="this.src='https://placehold.co/150x150?text=Sem+Foto';">
                        <h4>${p.name}</h4>
                        <p>R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>`;
                }
                // Se estiver na Vitrine do Site
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${imgSource}" alt="${p.name}" onerror="this.src='https://placehold.co/400x600';">
                    </div>
                    <div style="flex-grow:1;">
                        <h3>${p.name}</h3>
                        <p style="color:#d4af37; font-weight:600;">R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>
                    <button class="btn-gold-outline add-cart-btn" data-id="${p.id}">ADICIONAR</button>
                </div>`;
            }).join('');
        } catch (e) { console.error("Erro ao carregar produtos:", e); }
    };

    // --- 👥 CRM: BUSCA MULTIFUNCIONAL ---
    window.searchCustomer = async () => {
        const query = document.getElementById('client-search-input')?.value;
        if (!query) return alert("Digite o Nome, CPF ou Telefone para buscar.");

        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${query}/`);
            if (res.ok) {
                const data = await res.json();
                if(document.getElementById('client-name')) document.getElementById('client-name').value = data.first_name || '';
                if(document.getElementById('client-phone')) document.getElementById('client-phone').value = data.phone_number || '';
                if(document.getElementById('client-cpf')) document.getElementById('client-cpf').value = data.cpf || '';
                if(document.getElementById('client-birth')) document.getElementById('client-birth').value = data.birth_date || '';
                alert("Cliente localizado no CRM!");
            } else {
                alert("Cliente não encontrado. Preencha os campos para cadastro automático.");
            }
        } catch (e) { alert("Erro na busca."); }
    };

    // --- 🏦 PAGAMENTO E FINALIZAÇÃO ---
    window.setPayment = (method, btn) => {
        selectedPayment = method;
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Carrinho vazio!");
        
        const clientName = document.getElementById('client-name')?.value;
        const clientPhone = document.getElementById('client-phone')?.value;
        const clientCpf = document.getElementById('client-cpf')?.value;
        const clientBirth = document.getElementById('client-birth')?.value;

        if (!clientName || !clientPhone) return alert("Nome e Telefone são obrigatórios para o CRM.");

        const payload = {
            customer_info: { 
                first_name: clientName, 
                phone_number: clientPhone, 
                cpf: clientCpf,
                birth_date: clientBirth 
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
                // Preenche cupom térmico
                if(document.getElementById('print-client')) document.getElementById('print-client').innerText = clientName;
                if(document.getElementById('print-total')) document.getElementById('print-total').innerText = document.getElementById('pos-total').innerText;
                
                window.print(); // Comando de impressão
                alert("Venda registrada e CRM atualizado!");
                posCart = []; 
                updatePOSUI();
                
                // Limpa campos do CRM
                ['client-name', 'client-phone', 'client-cpf', 'client-birth', 'client-search-input'].forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.value = '';
                });
            } else {
                alert("Erro ao salvar venda no servidor.");
            }
        } catch (e) { alert("Erro de conexão ao processar."); }
    };

    // --- 🛒 LÓGICA DO CARRINHO PDV ---
    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        if (p) {
            const exist = posCart.find(i => i.id === id);
            exist ? exist.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
            updatePOSUI();
        }
    };

    window.updatePOSUI = () => {
        const cont = document.getElementById('pos-cart-items');
        if (cont) {
            cont.innerHTML = posCart.map(i => `
                <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                    <span>${i.name} (x${i.quantity})</span>
                    <span>R$ ${(i.price * i.quantity).toFixed(2)}</span>
                </div>`).join('') || 'Carrinho Vazio';
            
            const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
            document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
        }
    };

    // Inicialização
    loadProducts();
});