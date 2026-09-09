/**
 * Generic DOM scrape: navigate URL, run a JS extractor that returns JSON.stringify(units[]).
 * Use for marketing sites (Urby cards, Journal Squared <article>, Yardi grids).
 */
import { evaluateJson, gotoSettle, withPage } from "./browser.mjs";

/** Built-in extractors matching journal-square-monitor scrape.py (EX map). */
export const BUILTIN_EXTRACTORS = {
  journal_squared: `JSON.stringify([...document.querySelectorAll('article')].map(a=>{
    const L=a.innerText.split('\\n').map(s=>s.trim()).filter(Boolean);
    const t=L[0]||''; const beds=/studio/i.test(t)?0:parseInt((t.match(/\\d+/)||['0'])[0]);
    const b=(L.find(l=>/Bath/i.test(l))||'').match(/[\\d.]+/);
    const sf=(L.find(l=>/SQ\\.?\\s*FT/i.test(l))||'').replace(/[^\\d]/g,'');
    const p=(L.find(l=>/^\\$\\d/.test(l))||'').replace(/[^\\d]/g,'');
    const unit=L.find(l=>/^[A-Za-z]?\\d{3,4}[A-Za-z]?$/.test(l)&&!/SQ/i.test(l));
    const av=(L.find(l=>/Available/i.test(l))||'').trim();
    return {unit,beds,baths:b?parseFloat(b[0]):null,sqft:sf?parseInt(sf):null,asking:p?parseInt(p):null,avail:av,source:'dom_read'};
  }).filter(r=>r.asking))`,

  urby: `JSON.stringify([...document.querySelectorAll('.floorplan-card')].map(card=>{
    const L=card.innerText.split('\\n').map(s=>s.trim()).filter(Boolean);
    const bb=L.find(l=>/Bed/i.test(l)&&/Bath/i.test(l))||'';
    const beds=parseInt((bb.match(/(\\d+)\\s*Bed/i)||[,'0'])[1]);
    const bath=(bb.match(/(\\d+(?:\\.\\d+)?)\\s*Bath/i)||[])[1];
    const pl=L.find(l=>/\\$\\d/.test(l))||''; const p=(pl.match(/\\$\\s?([\\d,]+)/)||[])[1];
    const unit=(L.find(l=>/Apt\\.?\\s*\\S*\\d/i.test(l))||'').replace(/Apt\\.?\\s*/i,'').trim();
    const av=(L.find(l=>/Available/i.test(l))||'').trim();
    const conc=/includes concessions/i.test(card.innerText);
    return {unit,beds,baths:bath?parseFloat(bath):null,asking:conc?null: (p?parseInt(p.replace(/,/g,'')):null), net:conc?(p?parseInt(p.replace(/,/g,'')):null):null,avail:av,source:'dom_read'};
  }).filter(r=>r.asking||r.net))`,

  greyson: `JSON.stringify([...document.querySelectorAll('[class*="listingRow"]')].map(row=>{
    const f=[...row.querySelectorAll('*')].filter(e=>e.children.length===0&&e.textContent.trim()).map(e=>e.textContent.trim());
    const t=f.find(x=>/^(Studio|\\d+\\s*Bed)/i.test(x))||'';
    const beds=/studio/i.test(t)?0:parseInt((t.match(/\\d+/)||['0'])[0]);
    const bM=(f.find(x=>/Bath/i.test(x))||'').match(/[\\d.]+/);
    const pM=(f.find(x=>/\\$/.test(x))||'').replace(/[^\\d]/g,'');
    return {unit:f[0],beds,baths:bM?parseFloat(bM[0]):null,net:pM?parseInt(pM):null,asking:null,source:'dom_read'};
  }).filter(r=>r.net))`,

  metrovue: `JSON.stringify((()=>{
    const L=(document.body.innerText||'').split('\\n').map(s=>s.trim()).filter(Boolean); const out=[];
    for(let i=0;i<L.length;i++){ const rm=L[i].match(/^RESIDENCE:\\s*(\\S+)/i); if(!rm) continue;
      const unit=rm[1]; const t=L[i-1]||'';
      const beds=/studio/i.test(t)?0:parseInt((t.match(/(\\d+)\\s*Bed/i)||[,'0'])[1]||(t.match(/\\d+/)||['0'])[0]);
      const bM=t.match(/(\\d+)\\s*Bath/i); const baths=bM?parseFloat(bM[1]):(beds===0?1:null);
      let sf=null,price=null,avail=null;
      for(let j=i+1;j<Math.min(i+7,L.length);j++){ if(/^RESIDENCE:/i.test(L[j])) break;
        const sm=L[j].match(/Sq\\.?Ft:\\s*([\\d,]+)/i); if(sm) sf=parseInt(sm[1].replace(/,/g,''));
        const pm=L[j].match(/PRICE:\\s*\\$([\\d,]+)/i); if(pm) price=parseInt(pm[1].replace(/,/g,''));
        const am=L[j].match(/AVAILABLE FROM:\\s*(.+)/i); if(am) avail=am[1].trim(); }
      out.push({unit,beds,baths,sqft:sf,asking:price,avail,source:'dom_read'}); }
    return out; })())`,
};

export async function fetchDomUnits(building) {
  const url = building.url;
  if (!url) throw new Error("dom_read: missing url");
  const expr =
    building.extractor_js ||
    BUILTIN_EXTRACTORS[building.extractor] ||
    BUILTIN_EXTRACTORS[building.id];
  if (!expr) {
    throw new Error(
      `dom_read: set extractor to a builtin (${Object.keys(BUILTIN_EXTRACTORS).join(", ")}) or extractor_js`,
    );
  }
  return withPage(async (page, { settleMs }) => {
    await gotoSettle(page, url, settleMs);
    const rows = await evaluateJson(page, expr);
    return Array.isArray(rows) ? rows : [];
  });
}
