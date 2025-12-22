// Delivery helper: loads entrega.csv via PapaParse and exposes fee lookup
(function(global){
    const map = {}; // key -> numeric fee or null
    function normalize(s){
        if(!s) return '';
        try{ return s.normalize('NFC').trim(); }catch(e){ return String(s).trim(); }
    }

    async function loadFees(){
        const sel = document.getElementById('orderBairroSelect');
        if(!sel) return;
        try{
            const r = await fetch('assets/data/entrega.csv');
            const buf = await r.arrayBuffer();
            let txt;
            try{ txt = new TextDecoder('windows-1252').decode(buf); }
            catch(e){ try{ txt = new TextDecoder('iso-8859-1').decode(buf);}catch(e2){ txt = new TextDecoder('utf-8').decode(buf);} }
            const res = Papa.parse(txt, {header:true, delimiter:';', skipEmptyLines:true});
            // clear existing options (except the placeholder)
            const placeholder = sel.querySelector('option[value=""]');
            sel.innerHTML = '';
            if(placeholder) sel.appendChild(placeholder);
            res.data.forEach(row=>{
                const rawB = row['Bairro'] || row['bairro'] || Object.values(row)[0] || '';
                const rawT = row['Taxa de Entrega'] || row['Taxa'] || row['taxa'] || Object.values(row)[1] || '';
                const bairro = normalize(rawB);
                const taxaRaw = (rawT||'').toString().trim();
                if(!bairro) return;
                const key = bairro.toLowerCase();
                const fee = taxaRaw === '' ? null : Number(taxaRaw.replace(',','.'));
                map[key] = isNaN(fee) ? null : fee;
                const opt = document.createElement('option');
                opt.value = bairro;
                if(map[key] !== null){
                    opt.setAttribute('data-fee', String(map[key]));
                    opt.textContent = `${bairro} — R$ ${map[key].toFixed(2)}`;
                } else {
                    opt.setAttribute('data-fee','');
                    opt.textContent = `${bairro} — consultar taxa de entrega`;
                }
                sel.appendChild(opt);
            });
            // ensure single Outro
            if(!sel.querySelector('option[value="Outro"]')){
                const outroOpt = document.createElement('option');
                outroOpt.value = 'Outro';
                outroOpt.textContent = 'Outro';
                outroOpt.setAttribute('data-fee','');
                sel.appendChild(outroOpt);
            }
        }catch(e){
            // on error, ensure 'Outro' exists
            if(!sel.querySelector('option[value="Outro"]')){
                const outroOpt = document.createElement('option');
                outroOpt.value = 'Outro';
                outroOpt.textContent = 'Outro';
                sel.appendChild(outroOpt);
            }
            console.error('Failed to load delivery fees', e);
        }
    }

    function getFee(bairro){
        if(!bairro) return null;
        const key = normalize(bairro).toLowerCase();
        return typeof map[key] === 'number' ? map[key] : null;
    }

    global.Delivery = { loadFees, getFee, normalize };
})(window);
