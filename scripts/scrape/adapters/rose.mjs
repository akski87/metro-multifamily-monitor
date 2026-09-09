/**
 * Rose Associates availability widget (availability.rosenyc.com).
 * Rows: unit · address · type · n BA · sf Sq.Ft. · $gross, then "$net Net Effective Rent".
 * Ported from journal-square-monitor scrape.py (_rose_ex).
 */
import { evaluateJson, gotoSettle, withPage } from "./browser.mjs";

export function roseExtractorJs(addrPattern) {
  const addr = JSON.stringify(addrPattern);
  return `JSON.stringify((()=>{
  const addrRe=new RegExp(${addr});
  const L=(document.body.innerText||'').split('\\n').map(s=>s.replace(/\\s+$/,'')).filter(s=>s.trim());
  const out=[];
  for(let i=0;i<L.length;i++){
    if(!addrRe.test(L[i])) continue;
    const p=L[i].split('\\t').map(s=>s.trim()).filter(Boolean);
    const unit=p[0];
    const type=p.find(x=>/studio|bed|br/i.test(x))||'';
    const beds=/studio/i.test(type)?0:parseInt((type.match(/\\d+/)||['0'])[0]);
    const bM=(p.find(x=>/\\bBA\\b/i.test(x))||'').match(/[\\d.]+/);
    const sf=parseInt((p.find(x=>/Sq\\.?\\s*Ft/i.test(x))||'').replace(/[^\\d]/g,''))||null;
    const gross=parseInt((p.find(x=>/^\\$/.test(x))||'').replace(/[^\\d]/g,''))||null;
    let net=null,avail=null;
    for(let j=i+1;j<Math.min(i+8,L.length);j++){
      if(addrRe.test(L[j])) break;
      const nm=L[j].match(/\\$([\\d,]+)(?:\\.\\d+)?\\s*Net Effective/i);
      if(nm) net=parseInt(nm[1].replace(/,/g,''));
      if(/^\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}$/.test(L[j].trim())) avail=L[j].trim();
    }
    if(unit) out.push({unit,beds,baths:bM?parseFloat(bM[0]):null,sqft:sf,asking:gross,net,avail,source:'rose_widget'});
  }
  return out;
})())`;
}

export async function fetchRoseUnits(building) {
  const url = building.portal_url || building.url;
  if (!url) throw new Error("rose_widget: missing portal_url/url");
  const addr = building.addr_pattern || building.address || "";
  if (!addr) throw new Error("rose_widget: missing addr_pattern");
  return withPage(async (page, { settleMs }) => {
    await gotoSettle(page, url, settleMs);
    const rows = await evaluateJson(page, roseExtractorJs(addr));
    return Array.isArray(rows) ? rows : [];
  });
}
