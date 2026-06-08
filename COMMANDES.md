# MakeYourBoard - Commandes utiles

## Lancer le projet

npm run dev

## Générer les thumbnails des pédales

npx tsx scripts/generate-pedal-thumbnails.ts

## Si le script s'arrête à 1000 pédales

Relancer simplement :

npx tsx scripts/generate-pedal-thumbnails.ts

jusqu'à obtenir :

Pédales à traiter : 0

## Build de production

npm run build

## Déploiement

git add .
git commit -m "..."
git push
