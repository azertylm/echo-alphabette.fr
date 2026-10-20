# ÉCHO

**Dis 20 secondes, on devine le reste**

Application de l'écosystème [alphabette.fr](https://alphabette.fr).

- Adresses : **https://echo.alphabette.fr** (sous-domaine) et
  **https://alphabette.fr/echo** (chemin).
- Base commune : [`@alphabette/shell`](https://alphabette.fr) — les deux barres du
  haut (écosystème + application), le thème jour/nuit, la densité et le plein écran.

## Démarrer

```powershell
bun install
bun run dev
```

## Structure

```
src/
  main.tsx            point d'entrée
  App.tsx             application enveloppée par <AppShell>
  alphabette.app.ts   identité du site (nom, sous-titre, couleur, liens)
  echo/
    types.ts          vocabulaire (signature, archétype, idée)
    archetypes.ts     les six univers : palette, planche, 5 propositions, liens
    local.ts          moteur local : mots entendus ou prosodie seule
    ia.ts             Mistral : transcription (Voxtral) + lecture (chat)
    useVoix.ts        prise de voix : MediaRecorder, onde, minuteur, repli vocal
    vues.tsx          les trois écrans (écoute, analyse, signature)
    echo.css          habillage (couleurs dérivées de --ab-accent)
  shell/              base commune @alphabette/shell (générée, à ne pas recoder)
```

## Comment ÉCHO devine

1. **Tu parles 20 secondes.** Un bouton, aucune question, aucun champ à remplir.
2. **Trois lectures possibles, dans cet ordre :**
   - *Mots + Mistral* (clé BYOK) : transcription Voxtral, puis lecture de la
     transcription pour une phrase vraiment personnelle ;
   - *Mots seuls* : reconnaissance vocale du navigateur, puis moteur local ;
   - *Voix seule* : sans aucun mot, la prosodie (énergie, variation, silences)
     désigne l'archétype le plus proche.
3. **Tu reçois ta signature** : nom de l'univers, palette de 5 teintes, planche
   d'ambiance, profil sur 4 axes et 5 objets ou lieux concrets avec leur lien.

Aucun son n'est conservé. La clé Mistral reste dans le navigateur et n'est
envoyée qu'à `api.mistral.ai`. Sans clé, l'application fonctionne entièrement
en local.

## La base commune

Le contenu de l'application se place à l'intérieur de `<AppShell>` :

```tsx
<AppShell app={APP}>…contenu…</AppShell>
```

L'identité (nom, sous-titre, couleur, compteur, liens) se règle **uniquement**
dans `src/alphabette.app.ts`. Ne pas recoder les barres : elles viennent de la base.

## La copie de la base embarquée

`new:app` copie la dernière version de la base dans `src/shell/` : l'application
est autonome, `bun install && bun run dev` fonctionne immédiatement, sans liaison
locale. Le fichier `src/shell/.shell-version` mémorise la version embarquée.

Pour actualiser la base d'une application existante, depuis le dépôt du hub :

```powershell
bun run sync:shell <chemin-de-cette-application>
```
