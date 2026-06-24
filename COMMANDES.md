# MakeYourBoard - Commandes utiles

## Lancer le projet

```bash
npm run dev
```

## Générer les thumbnails

npx tsx scripts/generate-pedal-thumbnails.ts
```

## Vider le cache Next.js

```bash
rm -rf .next
npm run dev
```

## Réinstaller les dépendances

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## Reset complet

```bash
rm -rf .next
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

## Build production

```bash
npm run build
```

## Déploiement

```bash
git add .
git commit -m "message"
git push
```
