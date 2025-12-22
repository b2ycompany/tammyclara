/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V12
 * Foco: UX/UI (Remoção de itens), Correção de Erros 400/500 e CRM
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    
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

    // --- 🎭 MÁSCARAS DE ENTRADA ---
    const maskCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    const maskPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

    const cpfInput = document.getElementById('client-cpf');
    const phoneInput = document.getElementById('client-phone');
    if (cpfInput) cpfInput.addEventListener('input', (e) => e.target.value = maskCPF(e.target.value));
    if (phoneInput) phoneInput.addEventListener('input', (e) => e.target.value = maskPhone(e.target.value));

    // --- 🛒 CARREGAMENTO DE PRODUTOS ---
    window.loadProducts = async () => {
        const container = document.getElementById('product-results') || document.getElementById('products-container');
        if (!container) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            allProducts = await res.json();
            container.innerHTML = allProducts.map(p => {
                availableProducts[p.id] = p;
                return `
                <div class="product-card" onclick="addToPOS(${p.id})">
                    <img src="${p.main_image ? (p.main_image.startsWith('http') ? p.main_image : '/media/'+p.main_image) : 'https://placehold.co/150x150'}" onerror="this.src='https://placehold.co/150x150'">
                    <h4>${p.name}</h4>
                    <p>R$ ${parseFloat(p.price).toFixed(2)}</p>
                </div>`;
            }).join('');
        } catch (e) { console.error("Erro ao carregar catálogo."); }
    };

    // --- 👥 CRM E BUSCA ---
    window.searchCustomer = async () => {
        const query = document.getElementById('client-search-input')?.value;
        if (!query) return alert("Digite algo para buscar.");
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
        } catch (e) { alert("Erro no CRM."); }
    };

    // --- 🏦 FINALIZAÇÃO ---
    window.setPayment = (method, btn) => {
        selectedPayment = method;
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Carrinho vazio!");
        
        const cName = document.getElementById('client-name').value.trim();
        const cPhoneRaw = document.getElementById('client-phone').value.replace(/\D/g, '');
        const cCpfRaw = document.getElementById('client-cpf').value.replace(/\D/g, '');
        const cBirth = document.getElementById('client-birth').value;

        if (!cName || cPhoneRaw.length < 10) return alert("Nome e WhatsApp são obrigatórios.");

        const customer_info = { first_name: cName, phone_number: cPhoneRaw };
        if (cCpfRaw) customer_info.cpf = cCpfRaw;
        if (cBirth && cBirth !== "") customer_info.birth_date = cBirth;

        const payload = {
            customer_info: customer_info,
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

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || "Erro no servidor");

            document.getElementById('print-client').innerText = cName;
            document.getElementById('print-total').innerText = document.getElementById('pos-total').innerText;
            window.print();
            
            alert("Venda realizada!");
            posCart = []; updatePOSUI();
            ['client-name', 'client-phone', 'client-cpf', 'client-birth', 'client-search-input'].forEach(id => {
                if(document.getElementById(id)) document.getElementById(id).value = '';
            });
        } catch (e) { alert("ERRO: " + e.message); }
    };

    // --- 🛒 LÓGICA DO CARRINHO (COM REMOÇÃO) ---
    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        if (p) {
            const exist = posCart.find(i => i.id === id);
            exist ? exist.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
            updatePOSUI();
        }
    };

    window.removeFromPOS = (id) => {
        posCart = posCart.filter(item => item.id !== id);
        updatePOSUI();
    };

    window.updatePOSUI = () => {
        const cont = document.getElementById('pos-cart-items');
        if (cont) {
            cont.innerHTML = posCart.map(i => `
                <div class="cart-item-row" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
                    <div style="flex-grow:1;">
                        <span style="font-weight:600;">${i.name}</span><br>
                        <small style="color:#666;">${i.quantity}x R$ ${i.price.toFixed(2)}</small>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-weight:700;">R$ ${(i.price * i.quantity).toFixed(2)}</span>
                        <button onclick="removeFromPOS(${i.id})" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.1rem;" title="Remover item">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>`).join('') || '<p style="color:#999; text-align:center;">Carrinho vazio</p>';
            
            const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
            document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
        }
    };

    loadProducts();
});