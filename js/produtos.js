// Produtos agora serão carregados do arquivo `menu.csv` e transformados em objetos
// Cada linha do CSV usa `;` como separador com este cabeçalho esperado:
// Categoria;Nome;Ingredientes;Preço Grande;Preço Junior

const PRODUTOS = [];

function parsePrice(v){
	if(!v) return null;
	v = String(v).trim();
	if(v === '-' || v === '') return null;
	v = v.replace(',', '.');
	const n = parseFloat(v);
	return isNaN(n)? null : n;
}

function loadMenuCsv(){
	return fetch('assets/data/menu.csv').then(r=>r.arrayBuffer()).then(buf=>{
		// try UTF-8 first, fallback to windows-1252 if mojibake detected
		let text = new TextDecoder('utf-8').decode(buf);

		// se detectar caracteres quebrados (mojibake), usa windows-1252
		if (/Ã.|�/.test(text)) {
			text = new TextDecoder('windows-1252').decode(buf);
		}

		text = text || '';
		const lines = text.split(/\r?\n/).filter(l=>l.trim());
		const rows = lines.map(line => line.split(';'));
		const header = rows[0].map(c=> (c||'').toLowerCase()).join('|');
		let start = 0;
		if(header.includes('categoria') && header.includes('nome')) start = 1;
		let id = 1;
		for(let i=start;i<rows.length;i++){
			const cols = rows[i].map(c=> (c||'').trim());
			if(cols.length < 2) continue;
			const categoria = cols[0] || 'Lanche';
			const nome = cols[1] || ('Item '+id);
			const ingredientes = cols[2] || '';
			const precoGrande = parsePrice(cols[3]);
			const precoJunior = parsePrice(cols[4]);
			PRODUTOS.push({
				id: id,
				nome: nome,
				descricao: ingredientes,
				categorias: [categoria],
				preco: precoGrande || (precoJunior || 0),
				preco_grande: precoGrande,
				preco_junior: precoJunior,
				imagens: [],
			});
			id++;
		}
		return PRODUTOS;
	});
}

// expor uma promessa inicial para uso por app.js
const PRODUTOS_READY = loadMenuCsv();