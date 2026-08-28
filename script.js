        (function() {
            // ---- CONFIG ----
            const PRICE = 28;
            const PHONE = '5554981516682';
            const STORAGE_KEY = 'pecpizza_cart';
            const NAME_KEY = 'pecpizza_customer_name';

            // ---- ELEMENTOS ----
            const cartToggle = document.getElementById('cartToggle');
            const cartPanel = document.getElementById('cartPanel');
            const closeCart = document.getElementById('closeCart');
            const cartItemsList = document.getElementById('cartItemsList');
            const cartBadge = document.getElementById('cartBadge');
            const cartBadgeTotal = document.getElementById('cartBadgeTotal');
            const cartPanelTotal = document.getElementById('cartPanelTotal');
            const finalizeBtn = document.getElementById('finalizeBtn');
            const customerName = document.getElementById('customerName');
            const deliveryRadios = document.querySelectorAll('input[name="deliveryOption"]');
            const observations = document.getElementById('observations');
            const toast = document.getElementById('toastFeedback');
            const toastMessage = document.getElementById('toastMessage');

            // ---- ESTADO ----
            let cart = [];

            // ---- PERSISTÊNCIA ----
            function loadFromStorage() {
                try {
                    const savedCart = localStorage.getItem(STORAGE_KEY);
                    if (savedCart) {
                        cart = JSON.parse(savedCart);
                    } else {
                        cart = [];
                    }
                    const savedName = localStorage.getItem(NAME_KEY);
                    if (savedName) {
                        customerName.value = savedName;
                    }
                } catch (e) {
                    cart = [];
                }
                renderCart();
                // Atualiza os campos de quantidade nos cards com os valores do carrinho
                updateQtyInputs();
            }

            function saveToStorage() {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
                    localStorage.setItem(NAME_KEY, customerName.value.trim());
                } catch (e) {}
            }

            // ---- ATUALIZAR CAMPOS DE QUANTIDADE DOS CARDS ----
            function updateQtyInputs() {
                document.querySelectorAll('.flavor-card').forEach(card => {
                    const flavor = card.dataset.flavor;
                    const input = card.querySelector('.qty-input');
                    const item = cart.find(i => i.flavor === flavor);
                    input.value = item ? item.quantity : 0;
                });
            }

            // ---- RENDER ----
            function renderCart() {
                const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                const totalValue = cart.reduce((sum, item) => sum + (item.quantity * PRICE), 0);

                cartBadge.textContent = totalItems;
                cartBadgeTotal.textContent = totalValue.toFixed(2).replace('.', ',');
                cartPanelTotal.textContent = `R$ ${totalValue.toFixed(2).replace('.', ',')}`;

                if (cart.length === 0) {
                    cartItemsList.innerHTML = '<div class="empty-cart-float">Seu carrinho está vazio.</div>';
                    return;
                }

                let html = '';
                cart.forEach((item, index) => {
                    const subtotal = item.quantity * PRICE;
                    html += `
                        <div class="cart-item" data-index="${index}">
                            <div class="cart-item-info">
                                <span class="item-name">${item.flavor}</span>
                                <span class="item-subtotal">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div class="cart-item-controls">
                                <button class="qty-dec" data-index="${index}">−</button>
                                <span class="qty-display">${item.quantity}</span>
                                <button class="qty-inc" data-index="${index}">+</button>
                                <button class="cart-item-remove" data-index="${index}" title="Remover">✕</button>
                            </div>
                        </div>
                    `;
                });
                cartItemsList.innerHTML = html;

                // Eventos dos controles do carrinho
                document.querySelectorAll('.qty-dec').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idx = parseInt(this.dataset.index);
                        if (cart[idx].quantity > 1) {
                            cart[idx].quantity--;
                        } else {
                            cart.splice(idx, 1);
                        }
                        renderCart();
                        saveToStorage();
                        updateQtyInputs();
                    });
                });

                document.querySelectorAll('.qty-inc').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idx = parseInt(this.dataset.index);
                        cart[idx].quantity++;
                        renderCart();
                        saveToStorage();
                        updateQtyInputs();
                    });
                });

                document.querySelectorAll('.cart-item-remove').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idx = parseInt(this.dataset.index);
                        cart.splice(idx, 1);
                        renderCart();
                        saveToStorage();
                        updateQtyInputs();
                    });
                });
            }

            // ---- ADICIONAR ITEM (sem abrir carrinho) ----
            function addItem(flavor, quantity) {
                if (!flavor || quantity < 1) return;
                const existing = cart.find(item => item.flavor === flavor);
                if (existing) {
                    existing.quantity += quantity;
                } else {
                    cart.push({ flavor, quantity });
                }
                renderCart();
                saveToStorage();
                updateQtyInputs();
                // Mostrar toast de feedback
                toastMessage.textContent = `${quantity}x ${flavor} adicionado!`;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2500);
            }

            // ---- REMOVER ITEM (subtrai ou remove) ----
            function removeItem(flavor, quantity = 1) {
                const index = cart.findIndex(item => item.flavor === flavor);
                if (index === -1) return;
                if (cart[index].quantity > quantity) {
                    cart[index].quantity -= quantity;
                } else {
                    cart.splice(index, 1);
                }
                renderCart();
                saveToStorage();
                updateQtyInputs();
            }

            // ---- EVENTOS DOS CARDS ----
            document.querySelectorAll('.flavor-card').forEach(card => {
                const input = card.querySelector('.qty-input');
                const decBtn = card.querySelector('.qty-dec');
                const incBtn = card.querySelector('.qty-inc');
                const addBtn = card.querySelector('.flavor-add-btn');
                const flavor = card.dataset.flavor;

                // Botão "-": decrementa input e remove 1 do carrinho (se >0)
                decBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    let val = parseInt(input.value) || 0;
                    if (val > 0) {
                        val--;
                        input.value = val;
                        removeItem(flavor, 1);
                    }
                });

                // Botão "+": incrementa input e adiciona 1 ao carrinho
                incBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    let val = parseInt(input.value) || 0;
                    val++;
                    input.value = val;
                    addItem(flavor, 1);
                });

                // Impedir que o input fique abaixo de 0 manualmente
                input.addEventListener('change', function() {
                    let val = parseInt(this.value) || 0;
                    if (val < 0) val = 0;
                    this.value = val;
                });

                // Botão "+1": adiciona uma unidade diretamente ao carrinho
                addBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    addItem(flavor, 1);
                    this.classList.add('added');
                    setTimeout(() => this.classList.remove('added'), 1500);
                });
            });

            // ---- TOGGLE CARRINHO (apenas pelo botão) ----
            cartToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                cartPanel.classList.toggle('open');
            });

            closeCart.addEventListener('click', function() {
                cartPanel.classList.remove('open');
            });

            // Fechar ao clicar fora
            document.addEventListener('click', function(e) {
                const float = document.querySelector('.cart-float');
                if (!float.contains(e.target)) {
                    cartPanel.classList.remove('open');
                }
            });

            cartPanel.addEventListener('click', function(e) {
                e.stopPropagation();
            });

            // ---- FINALIZAR PEDIDO ----
            finalizeBtn.addEventListener('click', function() {
                if (cart.length === 0) {
                    alert('Seu carrinho está vazio. Adicione alguns pães antes de finalizar.');
                    return;
                }

                const name = customerName.value.trim();
                if (!name) {
                    alert('Por favor, digite seu nome.');
                    customerName.focus();
                    return;
                }

                let delivery = 'Retirada';
                for (const radio of deliveryRadios) {
                    if (radio.checked) {
                        delivery = radio.value;
                        break;
                    }
                }
                const obs = observations.value.trim();

                let total = 0;
                let itemsList = '';
                cart.forEach(item => {
                    const subtotal = item.quantity * PRICE;
                    total += subtotal;
                    itemsList += `• ${item.quantity}x ${item.flavor} — R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
                });

                const totalFormatted = `R$ ${total.toFixed(2).replace('.', ',')}`;

                let message = `*NOVO PEDIDO — PECPIZZA*\n\n`;
                message += `*Cliente:* ${name}\n\n`;
                message += `*ITENS DO PEDIDO*\n${itemsList}\n`;
                message += `*Recebimento:* ${delivery}\n`;
                if (obs) {
                    message += `*Observações:* ${obs}\n`;
                }
                message += `\n*TOTAL: ${totalFormatted}*`;

                const encoded = encodeURIComponent(message);
                const url = `https://wa.me/${PHONE}?text=${encoded}`;
                window.open(url, '_blank');

                cartPanel.classList.remove('open');
            });

            // ---- SALVAR NOME AUTOMATICAMENTE ----
            customerName.addEventListener('change', function() {
                localStorage.setItem(NAME_KEY, this.value.trim());
            });

            // ---- INICIALIZAÇÃO ----
            loadFromStorage();
        })();
