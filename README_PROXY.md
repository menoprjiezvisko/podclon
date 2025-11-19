# PodClone — bezpečné používanie ListenNotes API

Tento projekt používa ListenNotes API. Aby sme neriskovali verejné zverejnenie API kľúča v client-side JS, odporúčame použiť serverovú proxy (serverless function).

1) Vyber, kde budeš proxy hostovať:
   - Vercel (odporúčané) — vytvor súbor `api/listennotes.js` (obsah v repozitári).
   - Netlify — použij `netlify/functions/listennotes.js`.

2) Nastav environmentálnu premennú v hosting platforme:
   - LISTENNOTES_KEY = tvoj ListenNotes API key

3) Upravi vo frontende:
   - V `index.html` nastav `API_BASE = '/api/listennotes'` (už hotové v tejto vetve).
   - Frontend volá napr. `/api/listennotes/search?q=...` a `/api/listennotes/podcasts/:id?sort=recent_first`.

4) Bezpečnosť:
   - Neumiestňuj produkčný kľúč do index.html alebo do commitov.
   - Ak si už kľúč omylom commitol, okamžite ho zruš (revoke) a vytvor nový.
   - Na odstránenie kľúča z histórie repozitára použi `git filter-repo` alebo `bfg` a pushni force (opatrne).

5) Voliteľné vylepšenia:
   - Pridať cache alebo rate-limit v proxy pre zníženie počtu volaní.
   - Pridať jednoduché logovanie a metriky.
