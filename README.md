# tierlistrr

Crée, visualise et range **n'importe quelle** tier list — fromages, sauces piquantes,
cocktails… — en glissant des éléments (avec photos) du meilleur au pire.

Remake open source de [OpenTierBoy](https://github.com/infinia-yzl/opentierboy),
pensé pour l'auto-hébergement : pas de compte, pas de connexion, une seule base
SQLite. On arrive sur la page d'accueil, on voit toutes les tier lists, on en crée
une, on la visualise ou on la modifie.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — tokens du design system *marathon* (voir plus bas)
- **Drizzle ORM** sur **libSQL/SQLite** (`@libsql/client`, fichier local)
- **@hello-pangea/dnd** pour le glisser-déposer
- Server Actions pour toutes les mutations, images stockées sur disque
- **IA** : génération d'éléments via **Groq** (API compatible OpenAI) + images
  via **Pollinations** (sans clé)
- **Auth** : **better-auth** (code OTP par email, sans mot de passe), emails via SMTP

## Démarrer en développement

```bash
npm install
npm run dev
# http://localhost:3000
```

La base et le dossier d'uploads sont créés automatiquement au premier lancement
dans `./data` (ignoré par git). Aucune étape de migration : le schéma est appliqué
de façon idempotente au démarrage.

## Auto-hébergement (production)

```bash
npm run build
npm run start          # PORT=3000 par défaut
```

Variables d'environnement :

| Variable        | Rôle                                                         | Défaut               |
| --------------- | ------------------------------------------------------------ | -------------------- |
| `DATA_DIR`      | Dossier de la base SQLite **et** des images uploadées        | `./data`             |
| `DATABASE_URL`  | URL libSQL explicite (ex. `file:/var/lib/tierlistrr/app.db`) | dérivé de `DATA_DIR` |
| `PORT`          | Port HTTP                                                     | `3000`               |
| `GROQ_API_KEY`  | Active la génération IA d'éléments (clé Groq gratuite)        | — (IA désactivée)    |
| `GROQ_MODEL`    | Modèle LLM utilisé                                            | `llama-3.3-70b-versatile` |
| `GROQ_BASE_URL` | Endpoint compatible OpenAI (pour pointer ailleurs que Groq)  | `https://api.groq.com/openai/v1` |
| `POLLINATIONS_BASE_URL` | Base du service d'images (pour self-host/proxy)     | `https://image.pollinations.ai` |
| `POLLINATIONS_TOKEN` | Token gratuit (auth.pollinations.ai) : limites plus hautes, pas de file | — |
| `IMAGE_CONCURRENCY` | Nb d'images générées en parallèle en arrière-plan       | `2` |
| `BETTER_AUTH_SECRET` | **Requis en prod** : secret aléatoire (`openssl rand -base64 32`) | — |
| `BETTER_AUTH_URL` | URL publique de l'app (pour les cookies/CSRF)             | déduit de la requête |
| `SMTP_HOST` / `SMTP_PORT` | Serveur SMTP pour l'envoi des codes OTP (Gmail : `smtp.gmail.com` / `587`) | — |
| `SMTP_USER` / `SMTP_PASS` | Identifiants SMTP (Gmail : email + **mot de passe d'application**) | — |
| `SMTP_FROM` | Adresse d'expéditeur des emails                          | `SMTP_USER` |

Pour persister les données, montez un volume sur `DATA_DIR` (la base + le dossier
`uploads/` y vivent). C'est tout ce qu'il faut sauvegarder.

### IA (optionnel)

Sans `GROQ_API_KEY`, l'app fonctionne normalement et le bouton « Générer » est
simplement masqué. Avec une clé (gratuite sur [console.groq.com](https://console.groq.com)),
le board affiche **Générer** : l'IA propose des éléments pour le thème de la liste
et leur associe une image générée par [Pollinations](https://pollinations.ai)
(aucune clé requise). Les éléments arrivent **immédiatement** (classables tout de
suite) ; les images se génèrent **en arrière-plan** (worker in-process, concurrence
limitée + retries), sont **téléchargées et stockées sur disque**, et apparaissent
au fur et à mesure. Un `POLLINATIONS_TOKEN` (gratuit) accélère et fiabilise tout
ça. Idem à l'ajout manuel d'un élément : option « Générer l'image (IA) ».

## Déploiement Docker / Komodo

Le repo fournit un `Dockerfile` (build Next.js *standalone*, image Debian slim
non-root, healthcheck) et un `compose.yaml` prêt pour [Komodo](https://komo.do).

**Komodo** — crée une **Stack** pointant sur ce repo (fichier `compose.yaml`),
puis renseigne l'**Environment** de la Stack :

```env
TIERLISTRR_PORT=3000
GROQ_API_KEY=gsk_xxx        # optionnel (active la génération IA)
# GROQ_MODEL=llama-3.3-70b-versatile
```

Komodo build l'image et lance le conteneur. Le volume nommé `tierlistrr-data`
(monté sur `/data`) persiste la base SQLite **et** les images uploadées.

**Docker Compose** (manuel) :

```bash
GROQ_API_KEY=gsk_xxx docker compose up -d --build
```

## Modèle de données

- **tierlists** — `id`, `slug`, `title`, `description`, timestamps
- **tiers** — `id`, `tierlistId`, `label`, `color`, `position`
- **items** — `id`, `tierlistId`, `tierId` *(null = pool « à classer »)*, `name`,
  `imagePath`, `position`

Chaque liste démarre avec 5 tiers (S, A, B, C, D) renommables/recolorables, et un
pool « à classer » qui reçoit les nouveaux éléments.

## Design system « marathon »

L'identité visuelle suit le design system *marathon* : palette chaleureuse et
éditoriale — fond papier `#f7f5f0`, encre `#1a1614`, accent terracotta `#d85b3d`,
vert sauge `#6b8e65` —, titres et chiffres en serif (Georgia), libellés en
capitales trackées (Arial). Tous les tokens sont centralisés dans
[`src/app/globals.css`](src/app/globals.css) (`@theme`), ce qui permet de re-skinner
en une passe.

> Le projet source vit dans Claude Design. Pour resynchroniser les composants, on
> utilise le MCP `claude_design` depuis le CLI desktop (`/design-login` requis,
> indisponible en session web).

## Feuille de route

- [x] **Base** — création / visualisation / édition de tier lists, drag & drop, photos
- [x] **IA** — bouton « Générer » : Groq propose les éléments du thème, Pollinations
  génère les images, le tout atterrit dans « à classer »
- [x] **Images IA sur disque** — téléchargées et persistées (concurrence limitée
  + retries), plus de hotlink ni de 429 à l'affichage
- [ ] Réordonnancement des tiers par glisser-déposer
- [ ] Export image de la tier list

## Licence

Open source. Remake inspiré d'OpenTierBoy.
