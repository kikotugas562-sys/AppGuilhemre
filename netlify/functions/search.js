const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(statusCode, obj){ return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(obj) }; }
function list(){ return []; }
function addUnique(arr, value){
  if(value === undefined || value === null) return;
  const v = String(value).trim();
  if(v.length < 2) return;
  if(!arr.includes(v)) arr.push(v);
}
function normalizeUrl(url){
  if(!url) return "";
  let u = String(url).trim();
  if(!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}
function hostNoWww(url){
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./,""); } catch { return ""; }
}
function sameDomain(root, other){ return hostNoWww(root) && hostNoWww(root) === hostNoWww(other); }
function resolveLink(base, href){
  try{
    if(!href) return "";
    const h = String(href).trim();
    const l = h.toLowerCase();
    if(l.startsWith("mailto:") || l.startsWith("tel:") || l.startsWith("javascript:") || l.startsWith("#")) return "";
    return new URL(h, base).href.split("#")[0];
  }catch{return "";}
}
function stripHtml(html){
  if(!html) return "";
  let s = String(html);
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/\{[^{}]*(provider_name|provider_url|author_name|thumbnail_url|wp-json|oembed)[^{}]*\}/gi, " ");
  s = s.replace(/<br\s*\/?>/gi, ". ");
  s = s.replace(/<\/(p|div|li|h1|h2|h3|h4|section|article)>/gi, ". ");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeHtml(s);
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
function decodeHtml(s){
  return String(s)
    .replace(/&nbsp;/g," ")
    .replace(/&amp;/g,"&")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">")
    .replace(/&quot;/g,'"')
    .replace(/&#039;/g,"'")
    .replace(/&#39;/g,"'");
}
function mostlyUppercase(s){
  const letters = Array.from(String(s||"")).filter(ch => ch.toLowerCase() !== ch.toUpperCase());
  if(letters.length < 12) return false;
  const upper = letters.filter(ch => ch === ch.toUpperCase()).length;
  return upper / letters.length > 0.72;
}
function sentenceCase(s){
  s = decodeHtml(String(s||"")).trim();
  s = s.replace(/^>\s*/g,"").replace(/\bBEM[-\s]?VINDO\s+À?\s+/i,"").replace(/\s+/g," ").trim();
  if(mostlyUppercase(s)) s = s.toLocaleLowerCase("pt-PT");
  s = s.replace(/^\s*([a-záàâãéêíóôõúç])/iu, m => m.toLocaleUpperCase("pt-PT"));
  s = s.replace(/([.!?]\s+)([a-záàâãéêíóôõúç])/giu, (m,p1,p2)=>p1+p2.toLocaleUpperCase("pt-PT"));
  s = s.replace(/\bgps\b/gi,"GPS").replace(/\bnif\b/gi,"NIF").replace(/\bnipc\b/gi,"NIPC").replace(/\biva\b/gi,"IVA");
  return s;
}
function isBadSentence(text){
  if(!text) return true;
  const x = String(text).trim();
  if(x.length < 35 || x.length > 520) return true;
  const l = x.toLowerCase();
  const bad = ["provider_name","provider_url","author_name","thumbnail_url","wp-json","oembed","type\":\"rich","html\":\"","\\u00","powered by wordpress","elegant themes","código do projeto","codigo do projeto","poci-","feder","compete 2020","denominación del proyecto","proyectos de i+d","newsletter","dados pessoais","carrinho","checkout","home","pt en","en pt","login","logout","account","menu","cookies","read more","saber mais","política de privacidade","privacy policy"];
  if(bad.some(b => l.includes(b))) return true;
  const letters = Array.from(x).filter(ch => /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(ch)).length;
  return letters < 25;
}
function sentences(text){
  const out = [];
  for(const p of String(text||"").split(/(?<=[.!?])\s+/)){
    let q = p.trim().replace(/^[\s\-|.,;:]+|[\s\-|.,;:]+$/g,"");
    q = sentenceCase(q);
    if(!isBadSentence(q)) addUnique(out,q);
    if(out.length >= 160) break;
  }
  return out;
}
async function fetchWithTimeout(url, ms=3500){
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), ms);
  try{
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36",
        "Accept":"text/html,application/xhtml+xml,application/xml,text/xml,text/plain,*/*",
        "Accept-Language":"pt-PT,pt;q=0.9,en;q=0.6"
      }
    });
    const text = await res.text();
    clearTimeout(timer);
    if(text && text.length > 40) return text;
  }catch{
    clearTimeout(timer);
  }
  return "";
}
async function getPageHtml(url, allowReader=true){
  let html = await fetchWithTimeout(url, 3500);
  if(html) return html;
  if(allowReader){
    const reader = "https://r.jina.ai/http://r.jina.ai/http://";
    try{
      const ru = "https://r.jina.ai/" + url;
      const txt = await fetchWithTimeout(ru, 4500);
      if(txt && txt.length > 80) return `<html><body><pre>${escapeHtml(txt)}</pre></body></html>`;
    }catch{}
  }
  return "";
}
function escapeHtml(s){ return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
function linkScore(url){
  const u = String(url||"").toLowerCase();
  let s = 0;
  for(const g of ["contactos","contacto","contacts","contact"]) if(u.includes(g)) s += 80;
  for(const g of ["sobre","about","quem-somos","empresa","company","servicos","services","produtos","products","catalogo","noticias","news","media","imprensa","sustentabilidade","legal","privacy","politica","termos","morada","localizacao","informacoes","informações"]) if(u.includes(g)) s += 20;
  for(const b of ["cart","checkout","account","login","logout","tag/","category/","wp-json","feed","replytocom","author/","?add-to-cart"]) if(u.includes(b)) s -= 30;
  if(u.includes("/pt")) s += 5;
  return s;
}
function extractLinks(base, html, root){
  const out = [];
  const rx = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while((m = rx.exec(html || ""))){
    const u = resolveLink(base, m[1]);
    if(u && sameDomain(root, u) && !/\.(jpg|jpeg|png|gif|webp|svg|css|js|ico|zip|rar|mp4|mp3|pdf)(\?|$)/i.test(u)) addUnique(out,u);
    if(out.length >= 250) break;
  }
  return out;
}
function extractEmails(text){
  const out = [];
  let t = decodeHtml(text||"");
  t = t.replace(/mailto:/gi," ").replace(/\s*\[at\]\s*/gi,"@").replace(/\s*\(at\)\s*/gi,"@").replace(/\s+at\s+/gi,"@").replace(/\s*\[dot\]\s*/gi,".").replace(/\s*\(dot\)\s*/gi,".").replace(/\s+dot\s+/gi,".");
  const rx = /[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/gi;
  let m;
  while((m = rx.exec(t))){
    const e = m[0].toLowerCase().trim();
    if(/\.(png|jpg|jpeg|webp|svg|gif)$/.test(e) || e.includes("@2x.") || e.includes("@3x.") || e.includes("logo")) continue;
    addUnique(out,e);
  }
  return out;
}
function extractPhones(text){
  const out = [];
  let t = decodeHtml(text||"");
  t = t.replace(/tel:/gi," ").replace(/%20/g," ").replace(/&nbsp;/g," ").replace(/00351/g,"+351");
  const rx = /\+351(?:[\s\-.]*\d){9}/g;
  let m;
  while((m = rx.exec(t))){
    const digits = m[0].replace(/\D/g,"");
    if(digits.length !== 12 || !digits.startsWith("351")) continue;
    const v = `+351 ${digits.slice(3,6)} ${digits.slice(6,9)} ${digits.slice(9,12)}`;
    addUnique(out,v);
  }
  return out;
}
function extractNifs(text){
  const out = [];
  const rx = /(NIF|NIPC|VAT|Contribuinte)[^\d]{0,16}(\d{9})/gi;
  let m; while((m = rx.exec(text||""))) addUnique(out,m[2]);
  return out;
}
function extractSocials(html){
  const out = [];
  const rx = /https?:\/\/[^'"\s<>]+/gi;
  let m; while((m = rx.exec(html||""))){ const u=m[0], l=u.toLowerCase(); if(["linkedin.com","facebook.com","instagram.com","youtube.com","twitter.com","x.com"].some(x=>l.includes(x))) addUnique(out,u); }
  return out;
}
function pick(items, words, max){
  const out = [];
  for(const it of items){
    const l = String(it).toLowerCase();
    if(words.some(w=>l.includes(w))) addUnique(out,it);
    if(out.length >= max) break;
  }
  return out;
}
function best(items, max){
  const out = [];
  for(const it of items){ if(!isBadSentence(it)) addUnique(out,it); if(out.length>=max) break; }
  return out;
}
function addSiteVariants(queue, startSite){
  try{
    const u = new URL(startSite), host = u.hostname, path = u.pathname || "/";
    const hosts = [host, host.startsWith("www.") ? host.slice(4) : "www."+host];
    for(const h of hosts){
      addUnique(queue, `https://${h}${path}`);
      addUnique(queue, `https://${h}/`);
      addUnique(queue, `http://${h}${path}`);
      addUnique(queue, `http://${h}/`);
    }
  }catch{}
}
function addContactGuesses(queue, startSite){
  try{
    const u = new URL(startSite);
    const root = `${u.protocol}//${u.hostname}`;
    const paths = ["contactos","contacto","contact","contacts","pt/contactos","pt/contacto","pt/contact","pt/contacts","sobre/contactos","empresa/contactos","sobre-nos","quem-somos","about","empresa","morada","localizacao","localização","informacoes","informações","info","contacts-us","contact-us"];
    for(const p of paths){ addUnique(queue, `${root}/${p}`); addUnique(queue, `${root}/${p}/`); }
  }catch{}
}
async function addSitemapLinks(queue, startSite, deadline){
  try{
    const u = new URL(startSite);
    const hosts = [u.hostname, u.hostname.startsWith("www.") ? u.hostname.slice(4) : "www."+u.hostname];
    for(const h of hosts){
      for(const sm of [`https://${h}/sitemap.xml`,`https://${h}/sitemap_index.xml`,`https://${h}/wp-sitemap.xml`]){
        if(Date.now() > deadline) return;
        const xml = await getPageHtml(sm, false);
        if(!xml) continue;
        const rx = /https?:\/\/[^<>"'\s]+/gi;
        let m; while((m = rx.exec(xml))){
          const url = m[0];
          if(sameDomain(startSite, url)){
            const lu=url.toLowerCase();
            if(["contact","contacto","contacts","sobre","about","empresa","produt","servic","/pt"].some(x=>lu.includes(x))) addUnique(queue,url);
          }
          if(queue.length > 260) break;
        }
      }
    }
  }catch{}
}
async function processUrl(cur, startSite, state){
  const html = await getPageHtml(cur, true);
  if(!html) return;
  state.pagesRead++;
  addUnique(state.sources, cur);
  const plain = stripHtml(html);
  if(plain.length > 100){
    state.allText += " " + plain;
    state.rawPages.push({url:cur, text: plain.length>5000 ? plain.slice(0,5000)+"..." : plain});
  }
  for(const x of extractEmails(html+" "+plain)) addUnique(state.emails,x);
  for(const x of extractPhones(html+" "+plain)) addUnique(state.phones,x);
  for(const x of extractNifs(plain)) addUnique(state.nifs,x);
  for(const x of extractSocials(html)) addUnique(state.socials,x);
  for(const s of sentences(plain)){
    const l=s.toLowerCase();
    if(["morada","rua ","avenida","apartado","zona industrial","localizacao","localização","portugal","gps","latitude","longitude","horário","horario"].some(w=>l.includes(w))) addUnique(state.locations,s);
    if(state.locations.length >= 15) break;
  }
  const found = extractLinks(cur, html, startSite).sort((a,b)=>linkScore(b)-linkScore(a) || a.length-b.length);
  for(const u of found){
    const sc = linkScore(u);
    if(sc > -10 && !state.seen.has(u) && !state.queue.includes(u)) addUnique(state.queue,u);
    if(sc > 0) addUnique(state.important,u);
    if(state.queue.length > 220) break;
  }
}
async function searchCompany(input){
  const name = String(input?.name || "Empresa");
  const site = normalizeUrl(input?.site || "");
  if(!site) throw new Error("Site vazio ou inválido.");
  let maxPages = Number(input?.maxPages || 25);
  if(!Number.isFinite(maxPages)) maxPages=25;
  maxPages = Math.max(3, Math.min(maxPages, 50));

  const deadline = Date.now() + 8500;
  const state = {queue:[], seen:new Set(), sources:[], emails:[], phones:[], nifs:[], locations:[], socials:[], important:[], rawPages:[], allText:"", pagesRead:0};
  addUnique(state.queue, site);
  addSiteVariants(state.queue, site);
  addContactGuesses(state.queue, site);
  await addSitemapLinks(state.queue, site, deadline);

  while(state.queue.length && state.pagesRead < maxPages && Date.now() < deadline){
    const batch = [];
    while(state.queue.length && batch.length < 3 && state.pagesRead + batch.length < maxPages){
      const cur = state.queue.shift();
      if(!cur || state.seen.has(cur)) continue;
      state.seen.add(cur);
      batch.push(cur);
    }
    if(!batch.length) break;
    await Promise.all(batch.map(u=>processUrl(u, site, state).catch(()=>{})));
  }

  const sent = sentences(state.allText);
  let about = pick(sent, ["empresa","fundada","referencia","referência","especializada","experiencia","experiência","historia","história","internacional","grupo"], 10);
  let services = pick(sent, ["produto","produtos","servico","serviços","servicos","solucoes","soluções","fabrico","producao","produção","marca","catalogo","catálogo","qualidade"], 12);
  let market = pick(sent, ["cliente","clientes","mercado","design","inovacao","inovação","sustentabilidade","exportacao","exportação","internacional","qualidade"], 10);
  let news = pick(sent, ["noticia","notícias","news","media","imprensa","evento","novidade","blog","sustentabilidade"], 6);
  let legal = pick(sent, ["nif","nipc","legal","privacidade","cookies","termos","certificacao","certificação","certificado"], 6);
  if(!about.length) about = best(sent,6);
  if(!services.length) services = best(sent.slice(6),6);

  const strong = [];
  for(const s of best(about,5)) addUnique(strong,s);
  for(const s of best(services,6)) addUnique(strong,s);
  for(const s of best(market,5)) addUnique(strong,s);
  for(const s of best(news,3)) addUnique(strong,s);
  for(const s of best(legal,3)) addUnique(strong,s);
  if(strong.length < 8) for(const s of best(sent,16)) addUnique(strong,s);

  const facts = [];
  addUnique(facts, `Páginas lidas: ${state.pagesRead}`);
  if(state.nifs.length) addUnique(facts, `NIF/NIPC encontrados: ${state.nifs.slice(0,4).join(", ")}`);
  if(state.sources.length) addUnique(facts, `Fontes analisadas: ${state.sources.length}`);

  let summary = strong.length ? strong.slice(0,5).join(" ") : "";
  if(!summary) summary = state.pagesRead === 0 ? "Não foi possível ler texto público do site. O site pode bloquear leitura automática, carregar por JavaScript ou estar indisponível para o servidor." : "O site foi lido, mas não foram encontradas frases públicas suficientemente claras para resumo.";
  const note = Date.now() >= deadline ? "A pesquisa atingiu o limite de tempo da versão Netlify e devolveu a informação encontrada até ao momento." : "";

  return {
    ok: state.pagesRead > 0 || state.emails.length > 0 || state.phones.length > 0,
    name, site, searchedAt: new Date().toISOString().replace("T"," ").slice(0,19),
    pagesRead: state.pagesRead,
    pagesDiscovered: state.seen.size + state.queue.length,
    summary, error:"", note,
    highlights: best(strong,8),
    strongSummary: best(strong,18),
    keyFacts: facts,
    emails: state.emails,
    phones: state.phones,
    nifs: state.nifs,
    locations: best(state.locations,10),
    socials: state.socials,
    importantLinks: state.important.slice(0,25),
    sources: state.sources,
    rawPages: state.rawPages,
    sections: {about, services, market, news, legal}
  };
}

exports.handler = async (event) => {
  if(event.httpMethod === "OPTIONS") return {statusCode:204, headers:JSON_HEADERS, body:""};
  if(event.httpMethod !== "POST") return json(405, {ok:false, error:"Método não permitido."});
  try{
    const input = JSON.parse(event.body || "{}");
    const result = await searchCompany(input);
    return json(200, result);
  }catch(err){
    return json(500, {
      ok:false, name:"Erro", site:"", summary:err?.message || "Erro desconhecido.", error:err?.message || "Erro desconhecido.",
      pagesRead:0, pagesDiscovered:0, note:"",
      highlights:[], strongSummary:[], keyFacts:[], emails:[], phones:[], nifs:[], locations:[], socials:[], importantLinks:[], sources:[], rawPages:[],
      sections:{about:[],services:[],market:[],news:[],legal:[]}
    });
  }
};
