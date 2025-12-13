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
				document.getElementById('orderBairro').value = saved.bairro || '';
				document.getElementById('orderPonto').value = saved.ponto || '';
			}
		}catch(e){}
		orderModal.style.display = 'flex';
		const nameInput = document.getElementById('orderName');
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
		const bairro = (document.getElementById('orderBairro').value || '').trim();
		const ponto = (document.getElementById('orderPonto').value || '').trim();
		if(!name || !address){ alert('Por favor informe seu nome e endereço.'); return; }

		// save for next time
		try{ localStorage.setItem('orderInfo', JSON.stringify({name,address,bairro,ponto})); }catch(e){}

		const lines = formatOrderLines();
		const total = `Total: R$ ${CARRINHO.reduce((s,i)=>s+Number(i.preco),0).toFixed(2)}`;
		const header = `Pedido - ${name}`;
		const footer = [`Endereço: ${address}`, `Bairro: ${bairro}`, `Ponto de referência: ${ponto}`];
		const payload = [header, ...lines, '', total, '', ...footer].join('\n');
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