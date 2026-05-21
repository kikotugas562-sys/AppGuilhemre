# Pesquisa Inteligente de Empresas — Netlify + GitHub

Esta é a versão online da app, preparada para publicar com GitHub + Netlify.

## Estrutura

```text
empresa-intel-netlify-github-final/
├─ index.html
├─ package.json
├─ netlify.toml
└─ netlify/
   └─ functions/
      └─ search.js
```

## Como testar localmente

1. Instala Node.js.
2. Instala Netlify CLI:

```powershell
npm install -g netlify-cli
```

3. Entra na pasta:

```powershell
cd .\empresa-intel-netlify-github-final
```

4. Corre:

```powershell
netlify dev
```

5. Abre o link que aparecer no terminal, normalmente:

```text
http://localhost:8888
```

## Como publicar no GitHub + Netlify

1. Cria um repositório novo no GitHub.
2. Envia todos os ficheiros desta pasta para o repositório.
3. Entra no Netlify.
4. Clica em **Add new site**.
5. Escolhe **Import an existing project**.
6. Liga ao GitHub.
7. Escolhe o repositório.
8. Nas configurações:
   - Build command: pode ficar vazio ou `npm run build`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
9. Clica em **Deploy**.

## Importante

Esta versão funciona online, mas Netlify tem limite de tempo por função. Por isso:
- usa primeiro 12 ou 25 páginas;
- 50 páginas pode devolver apenas o que conseguir antes do limite;
- sites com Cloudflare, bloqueio de bots, cookies obrigatórios ou JavaScript pesado podem falhar.

A app:
- extrai emails;
- extrai telefones apenas com `+351`;
- mostra emails e telefones apenas na caixa **Contactos**;
- identifica emails por tipo quando possível;
- mantém textos lidos fechados com seta;
- exporta JSON e CSV.
