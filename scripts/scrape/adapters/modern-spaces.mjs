/**
 * Modern Spaces iframe listings (newdev.modernspacesnyc.com/Search/Frame).
 * Lines: "<address>, <unit>" then "$price" / "n Br" / "n Bth".
 * Ported from journal-square-monitor scrape.py (_MS).
 */
import { evaluateJson, gotoSettle, withPage } from "./browser.mjs";

export function modernSpacesExtractorJs(addressLine) {
  const addr = JSON.stringify(addressLine);
  return `JSON.stringify((()=>{
  const ADDR=${addr};
  const L=(document.body.innerText||'').split('\\n').map(s=>s.trim()).filter(Boolean);
  const head=new RegExp('^'+ADDR.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&')+',\\\\s*(\\\\S+)');
  const out=[];
  for(let i=0;i<L.length;i++){
    const m=L[i].match(head); if(!m) continue;
    const unit=m[1]; let price=null,beds=0,baths=null;
    for(let j=i+1;j<Math.min(i+7,L.length);j++){
      if(head.test(L[j])) break;
      const pm=L[j].match(/\\$\\s?([\\d,]+)/); if(pm&&price===null) price=parseInt(pm[1].replace(/,/g,''));
      const bm=L[j].match(/^(\\d+)\\s*Br$/i); if(bm) beds=parseInt(bm[1]);
      const am=L[j].match(/^(\\d+(?:\\.\\d+)?)\\s*Bth$/i); if(am) baths=parseFloat(am[1]);
    }
    if(price) out.push({unit,beds,baths,asking:price,net:null,source:'modern_spaces'});
  }
  return out;
})())`;
}

export async function fetchModernSpacesUnits(building) {
  const url = building.portal_url || building.url;
  if (!url) throw new Error("modern_spaces: missing portal_url/url");
  const addr = building.addr_line || building.address;
  if (!addr) throw new Error("modern_spaces: missing addr_line");
  return withPage(async (page, { settleMs }) => {
    await gotoSettle(page, url, Math.max(settleMs, 10000));
    const rows = await evaluateJson(page, modernSpacesExtractorJs(addr));
    return Array.isArray(rows) ? rows : [];
  });
}
