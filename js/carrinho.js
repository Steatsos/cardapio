let CARRINHO = JSON.parse(localStorage.getItem("carrinho")) || [];


function salvarCarrinho() {
localStorage.setItem("carrinho", JSON.stringify(CARRINHO));
}


function addCarrinho(prod, options) {
	const item = Object.assign({}, prod);
	if(options && typeof options === 'object'){
		if(options.observacoes) item.observacoes = options.observacoes;
		if(options.tamanho) item.tamanho = options.tamanho;
		if(options.acrescimos) item.acrescimos = options.acrescimos;
		if(typeof options.acrescimos_total !== 'undefined') item.acrescimos_total = options.acrescimos_total;
		// allow an explicit final price (preco_final) calculated by the modal
		if(typeof options.preco_final !== 'undefined') item.preco = Number(options.preco_final) || item.preco;
	}
	CARRINHO.push(item);
	salvarCarrinho();
	const obsText = (item.tamanho && String(item.tamanho).toLowerCase()==='jr')? ` (Jr)` : '';
	const obsNote = item.observacoes? ` — ${item.observacoes}` : '';
	alert(prod.nome + obsText + obsNote + ' adicionado ao pedido');
	atualizarCarrinhoUI();
		// update modal total if visible
		if(document.getElementById('orderModal') && document.getElementById('orderModal').style.display === 'flex') updateOrderTotalUI();
}


function atualizarCarrinhoUI() {
const lista = document.getElementById("listaCarrinho");
if(!CARRINHO || CARRINHO.length === 0){
	lista.innerHTML = `<li>Carrinho vazio</li>`;
	} else {
		lista.innerHTML = CARRINHO.map(p => {
			const sizeLabel = (p.tamanho && String(p.tamanho).toLowerCase()==='jr')? ` — Jr` : '';
			const obs = p.observacoes? ` — ${p.observacoes}` : '';
			const adds = Array.isArray(p.acrescimos) && p.acrescimos.length? ` — +${p.acrescimos.map(a=>a.nome).join(', ')}` : '';
			const preco = (typeof p.preco === 'number')? p.preco : Number(p.preco) || 0;
			return `<li>${p.nome}${sizeLabel}${adds}${obs} — R$ ${preco.toFixed(2)}</li>`;
		}).join("");
}
// keep order total in sync
updateOrderTotalUI();
}


// Abrir e fechar modal
document.getElementById("abrirCarrinho").onclick = () => {
document.getElementById("carrinhoModal").style.display = "flex";
};


document.getElementById("carrinhoModal").onclick = e => {
if (e.target.id === "carrinhoModal") e.target.style.display = "none";
};


// (handler defined further below)

// include product id in messages and provide send via email
function formatOrderLines(){
	return CARRINHO.map(p => {
		const isJr = p.tamanho && String(p.tamanho).toLowerCase() === 'jr';
		const sizeLabel = isJr ? ' - Jr' : ''; // omit 'Grande' (default)
		const obs = p.observacoes? ` - Obs: ${p.observacoes}` : '';
		const adds = Array.isArray(p.acrescimos) && p.acrescimos.length ? ` - Com ${p.acrescimos.map(a=>a.nome).join(', ')}` : '';
		return `${p.nome}${sizeLabel}${adds}${obs} - R$ ${Number(p.preco).toFixed(2)}`;
	});
}

// Open order-details modal to collect customer data, then send WhatsApp
const btnEnviarZap = document.getElementById("enviarZap");
if(btnEnviarZap){
	btnEnviarZap.addEventListener('click', ()=>{
		if(!CARRINHO || CARRINHO.length === 0){ alert('Carrinho vazio'); return; }
		const orderModal = document.getElementById('orderModal');
		if(!orderModal) return alert('Modal de pedido não encontrado');
		// try to prefill from saved info
		try{
			const saved = JSON.parse(localStorage.getItem('orderInfo')||'null');
			if(saved){
				document.getElementById('orderName').value = saved.name || '';
				document.getElementById('orderAddress').value = saved.address || '';
				document.getElementById('orderComplemento').value = saved.complemento || '';
				// set method (entrega|retirada)
				try{
					if(saved.method && saved.method === 'retirada'){
						document.getElementById('orderMethodRetirada').checked = true;
					} else {
						document.getElementById('orderMethodEntrega').checked = true;
					}
				}catch(e){}
				setBairroValue(saved.bairro || '');
				document.getElementById('orderPonto').value = saved.ponto || '';
			}
			// apply method visibility
			toggleOrderMethod();
		}catch(e){}
		orderModal.style.display = 'flex';
		const nameInput = document.getElementById('orderName');
		updateOrderTotalUI();
		if(nameInput) nameInput.focus();
	});
}

// Order modal handlers
const orderModal = document.getElementById('orderModal');
if(orderModal){
	const orderBackdrop = document.getElementById('orderModalBackdrop');
	const closeBtn = document.getElementById('closeOrderModal');
	const cancelBtn = document.getElementById('orderCancel');
	const sendBtn = document.getElementById('orderSendWhats');

	const hideOrderModal = ()=> orderModal.style.display = 'none';
	if(orderBackdrop) orderBackdrop.addEventListener('click', hideOrderModal);
	if(closeBtn) closeBtn.addEventListener('click', hideOrderModal);
	if(cancelBtn) cancelBtn.addEventListener('click', hideOrderModal);

	if(sendBtn) sendBtn.addEventListener('click', ()=>{
		if(!CARRINHO || CARRINHO.length === 0){ alert('Carrinho vazio'); return; }
			const name = (document.getElementById('orderName').value || '').trim();
			const address = (document.getElementById('orderAddress').value || '').trim();
			const complemento = (document.getElementById('orderComplemento').value || '').trim();
			const ponto = (document.getElementById('orderPonto').value || '').trim();
				let bairro = '';
			const otherWrap = document.getElementById('orderBairroOtherWrap');
			if(otherWrap && otherWrap.style.display !== 'none'){
				bairro = (document.getElementById('orderBairroOther').value || '').trim();
				} else {
						bairro = (document.getElementById('orderBairroSelect').value || '').trim();
				}
				const methodIsRetirada = (document.getElementById('orderMethodRetirada') && document.getElementById('orderMethodRetirada').checked);
				if(!name || (!methodIsRetirada && !address)){ alert('Por favor informe seu nome e endereço.'); return; }

			// save for next time
			try{ 
				const method = (document.getElementById('orderMethodRetirada') && document.getElementById('orderMethodRetirada').checked) ? 'retirada' : 'entrega';
				localStorage.setItem('orderInfo', JSON.stringify({name,address,bairro,ponto,complemento,method}));
			}catch(e){}

		const lines = formatOrderLines();
		const cartValue = CARRINHO.reduce((s,i)=>s+Number(i.preco),0).toFixed(2);
		let deliveryKnown = true;
		if(methodIsRetirada){
			deliveryKnown = true;
		} else {
			const otherWrapCheck = document.getElementById('orderBairroOtherWrap');
			if(otherWrapCheck && otherWrapCheck.style.display !== 'none'){
				deliveryKnown = false;
			} else {
				const sel = document.getElementById('orderBairroSelect');
				if(sel){
					const optSel = sel.options[sel.selectedIndex];
					if(!optSel) deliveryKnown = false;
					else {
						const feeAttr = optSel.getAttribute('data-fee');
						if(!feeAttr || feeAttr === '') deliveryKnown = false;
					}
				}
			}
		}
		let total = Number(cartValue);
		let deliveryFeeValue = 0;
		if(!methodIsRetirada && deliveryKnown){
			const sel = document.getElementById('orderBairroSelect');
			if(sel){
				const optSel = sel.options[sel.selectedIndex];
				const feeAttr = optSel && optSel.getAttribute('data-fee');
				const n = feeAttr ? Number(feeAttr) : NaN;
				if(!isNaN(n)){
					deliveryFeeValue = n;
					total += n;
				}
			}
		}
		const totalStr = `Total: R$ ${Number(total).toFixed(2)}`;
		const totalForWhats = totalStr + (methodIsRetirada ? '' : (deliveryKnown ? '' : ' — consultar taxa de entrega'));
		const header = methodIsRetirada ? `PEDIDO PARA RETIRADA - ${name}` : `PEDIDO PARA ENTREGA - ${name}`;
		let footer = [];
		if(methodIsRetirada){
			footer.push('Retirar na loja');
			if(ponto) footer.push(`Ponto de referência: ${ponto}`);
		} else {
			footer = [`Endereço: ${address}${complemento? ' — ' + complemento : ''}` + `, ${bairro}` + `, ${ponto}`];
		}
		const payload = [header, ...lines, '', totalForWhats, '', ...footer].join('\n');
		const texto = encodeURIComponent(payload);
		const url = `https://wa.me/5516996202763?text=${texto}`;
		hideOrderModal();
		window.open(url, '_blank');
	});
}

// email button removed from UI; guard in case element exists
const btnEnviarEmail = document.getElementById('enviarEmail');
if(btnEnviarEmail){
	btnEnviarEmail.style.display = 'none';
}

// Limpar carrinho
function limparCarrinho(){
	CARRINHO = [];
	salvarCarrinho();
	atualizarCarrinhoUI();
	updateOrderTotalUI();
}

const btnLimpar = document.getElementById('limparCarrinho');
if(btnLimpar) btnLimpar.onclick = limparCarrinho;

// Contact modal handlers (open/close/send)
const btnOpenContact = document.getElementById('openContact');
const contactModal = document.getElementById('contactModal');
if(btnOpenContact && contactModal){
	btnOpenContact.addEventListener('click', ()=> contactModal.classList.add('show'));
}
const contactBackdrop = document.getElementById('contactModalBackdrop');
const btnCloseContact = document.getElementById('closeContactModal');
if(contactBackdrop) contactBackdrop.addEventListener('click', ()=> contactModal.classList.remove('show'));
if(btnCloseContact) btnCloseContact.addEventListener('click', ()=> contactModal.classList.remove('show'));

// send contact via email
const btnContactEmail = document.getElementById('contactSendEmail');
const btnContactWhats = document.getElementById('contactSendWhatsApp');
if(btnContactEmail) btnContactEmail.addEventListener('click', ()=>{
	const name = document.getElementById('contactName').value || '';
	const msg = document.getElementById('contactMessage').value || '';
	const subject = encodeURIComponent('Contato - Cardápio');
	const body = encodeURIComponent(`Nome: ${name}\n\n${msg}`);
	window.location.href = `mailto:vla.eleut@gmail.com?subject=${subject}&body=${body}`;
});
if(btnContactWhats) btnContactWhats.addEventListener('click', ()=>{
	const name = document.getElementById('contactName').value || '';
	const msg = document.getElementById('contactMessage').value || '';
	const texto = encodeURIComponent(`Contato: ${name}\n\n${msg}`);
	window.open(`https://wa.me/5516996202763?text=${texto}`, '_blank');
});

// inicializa UI
atualizarCarrinhoUI();

// Delivery fees loaded by js/delivery.js (Delivery.loadFees)

function updateBairroDisplay(selectedValue){
	const feeSpan = document.getElementById('orderBairroFee');
	const otherWrap = document.getElementById('orderBairroOtherWrap');
	if(!feeSpan) return;
	const val = (selectedValue||'').trim();
	if(!val){ feeSpan.textContent = ''; otherWrap.style.display = 'none'; return; }
	const sel = document.getElementById('orderBairroSelect');
	if(!sel){ feeSpan.textContent = ''; return; }
	const opt = Array.from(sel.options).find(o => o.value.toLowerCase() === val.toLowerCase());
	if(opt){
		const fee = opt.getAttribute('data-fee');
		if(fee && fee !== ''){
			const n = Number(fee);
			if(!isNaN(n)) feeSpan.textContent = `Entrega: R$ ${n.toFixed(2)}`;
			else feeSpan.textContent = '';
		} else {
			feeSpan.innerHTML = '<strong style="color:#c00">consultar taxa de entrega</strong>';
		}
		otherWrap.style.display = (opt.value === 'Outro') ? 'block' : 'none';
		if(opt.value === 'Outro') document.getElementById('orderBairroOther').focus();
	} else {
		// value not in select options: show consultar
		feeSpan.innerHTML = '<strong style="color:#c00">consultar taxa de entrega</strong>';
		otherWrap.style.display = 'none';
	}
	// update displayed total whenever bairro changes
	updateOrderTotalUI();
}

// compute totals and update modal total UI
function updateOrderTotalUI(){
	const orderTotalValue = document.getElementById('orderTotalValue');
	const orderTotalNote = document.getElementById('orderTotalNote');
	if(!orderTotalValue) return;
	const cartValue = CARRINHO.reduce((s,i)=>s+Number(i.preco),0);
	const methodIsRetirada = (document.getElementById('orderMethodRetirada') && document.getElementById('orderMethodRetirada').checked);
	let deliveryKnown = true;
	let deliveryFeeValue = 0;
	if(!methodIsRetirada){
		const sel = document.getElementById('orderBairroSelect');
		const otherWrap = document.getElementById('orderBairroOtherWrap');
		if(otherWrap && otherWrap.style.display !== 'none'){
			deliveryKnown = false;
		} else if(sel){
			const opt = sel.options[sel.selectedIndex];
			if(!opt) deliveryKnown = false;
			else {
				const feeAttr = opt.getAttribute('data-fee');
				if(!feeAttr || feeAttr === '') deliveryKnown = false;
				else { const n = Number(feeAttr); if(!isNaN(n)) deliveryFeeValue = n; }
			}
		}
	}
	const total = cartValue + deliveryFeeValue;
	orderTotalValue.textContent = Number(total).toFixed(2);
	if(orderTotalNote) orderTotalNote.textContent = (methodIsRetirada ? '' : (deliveryKnown ? '' : '— consultar taxa de entrega'));
}

// toggle address fields based on method (entrega|retirada)
function toggleOrderMethod(){
	const retirada = document.getElementById('orderMethodRetirada').checked;
	const addressWrap = document.getElementById('orderAddressWrap');
	const compWrap = document.getElementById('orderComplementoWrap');
	const bairroWrap = document.getElementById('orderBairroWrap');
	const pontoWrap = document.getElementById('orderPontoWrap');
	const otherWrap = document.getElementById('orderBairroOtherWrap');
	if(retirada){
		if(addressWrap) addressWrap.style.display = 'none';
		if(compWrap) compWrap.style.display = 'none';
		if(bairroWrap) bairroWrap.style.display = 'none';
		if(pontoWrap) pontoWrap.style.display = 'none';
		if(otherWrap) otherWrap.style.display = 'none';
	} else {
		if(addressWrap) addressWrap.style.display = '';
		if(compWrap) compWrap.style.display = '';
		if(bairroWrap) bairroWrap.style.display = '';
		if(pontoWrap) pontoWrap.style.display = '';
		// otherWrap visibility controlled by bairro selection
		if(otherWrap && document.getElementById('orderBairroSelect')){
			const sel = document.getElementById('orderBairroSelect');
			const opt = sel.options[sel.selectedIndex];
			otherWrap.style.display = (opt && opt.value === 'Outro') ? 'block' : 'none';
		}
	}
	// refresh total when method changes
	updateOrderTotalUI();
}

// wire method radios
const rbEntrega = document.getElementById('orderMethodEntrega');
const rbRetirada = document.getElementById('orderMethodRetirada');
if(rbEntrega) rbEntrega.addEventListener('change', toggleOrderMethod);
if(rbRetirada) rbRetirada.addEventListener('change', toggleOrderMethod);

function setBairroValue(saved){
	const sel = document.getElementById('orderBairroSelect');
	const otherWrap = document.getElementById('orderBairroOtherWrap');
	const otherInput = document.getElementById('orderBairroOther');
	if(!sel) return;
	const val = (saved||'').trim();
	if(!val){ sel.value = ''; otherWrap.style.display = 'none'; updateBairroDisplay(''); return; }
	const opt = Array.from(sel.options).find(o=>o.value.toLowerCase() === val.toLowerCase());
	if(opt){
		sel.value = opt.value;
		if(opt.value === 'Outro'){
			otherWrap.style.display = 'block';
			otherInput.value = '';
			otherInput.focus();
		} else {
			otherWrap.style.display = 'none';
		}
		updateBairroDisplay(opt.value);
	} else {
		// not found: select Outro and put value in other input
		sel.value = 'Outro';
		otherWrap.style.display = 'block';
		otherInput.value = val;
		updateBairroDisplay('Outro');
	}
}

// wire change listener for select
const bairroSelect = document.getElementById('orderBairroSelect');
if(bairroSelect){
	bairroSelect.addEventListener('change', e=>{
		updateBairroDisplay(e.target.value);
		updateOrderTotalUI();
	});
}

// load fees on startup
// load fees via Delivery module
if(window.Delivery && typeof window.Delivery.loadFees === 'function'){
	Delivery.loadFees().then(()=>{
		// try to prefill bairro after delivery options loaded
		try{ const savedInfo = JSON.parse(localStorage.getItem('orderInfo')||'null'); if(savedInfo && savedInfo.bairro) setBairroValue(savedInfo.bairro); }catch(e){}
		updateOrderTotalUI();
	}).catch(()=>{});
}

// Update total UI when cart changes at initialization
updateOrderTotalUI();