/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V11
 * Foco: Correção de UNIQUE constraint (Email) e campos obrigatórios (Nome/Celular)
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

    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/400x600?text=Sem+Foto';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

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
                    <img src="${buildUrl(p.main_image)}" onerror="this.src='https://placehold.co/150x150'">
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

    // --- 🏦 FINALIZAÇÃO (CORREÇÃO UNIQUE CONSTRAINT EMAIL) ---
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

        // Apenas Nome e Celular são obrigatórios
        if (!cName || cPhoneRaw.length < 10) {
            return alert("Nome e WhatsApp são obrigatórios para finalizar a venda.");
        }

        // Criamos o objeto enviando APENAS o que foi preenchido.
        // O e-mail foi removido para evitar o erro de 'UNIQUE constraint failed'.
        const customer_info = { 
            first_name: cName, 
            phone_number: cPhoneRaw 
        };
        
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

            if (!res.ok) {
                console.error("Erro detalhado da API:", data);
                throw new Error(data.error || data.message || "Erro ao processar venda");
            }

            // Sucesso: Preencher cupom e imprimir
            document.getElementById('print-client').innerText = cName;
            document.getElementById('print-total').innerText = document.getElementById('pos-total').innerText;
            window.print();
            
            alert("Venda realizada com sucesso!");
            posCart = []; 
            updatePOSUI();
            
            // Limpar campos
            ['client-name', 'client-phone', 'client-cpf', 'client-birth', 'client-search-input'].forEach(id => {
                if(document.getElementById(id)) document.getElementById(id).value = '';
            });
        } catch (e) {
            console.error("Erro no Checkout:", e);
            alert("ERRO NO CHECKOUT: " + e.message);
        }
    };

    // --- 🛒 LÓGICA AUXILIAR ---
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
                <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #eee;">
                    <span>${i.name} (x${i.quantity})</span>
                    <span>R$ ${(i.price * i.quantity).toFixed(2)}</span>
                </div>`).join('') || 'Vazio';
            const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
            document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
        }
    };

    loadProducts();
});