/**
 * local.ts — le moteur de compréhension qui ne dépend de personne.
 *
 * Deux lectures possibles, dans cet ordre de préférence :
 *  1. les MOTS entendus (transcription Mistral, ou reconnaissance vocale du
 *     navigateur) : on repère ce qui insiste et on en déduit un archétype ;
 *  2. la PROSODIE seule (énergie, variation, silences) quand aucun mot n'est
 *     disponible : la voix suffit — c'est la promesse de l'application.
 *
 * Aucune requête réseau ici, aucun stockage : la fonction est pure et
 * l'application reste utilisable en avion.
 */
import { ARCHETYPES, LISTE_ARCHETYPES } from './archetypes';
import type { Archetype, Idee, Signature } from './types';

/** Minuscules, sans accents : « Forêt » et « foret » se rencontrent enfin. */
export function sansAccents(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const MOTS_VIDES = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'et', 'ou', 'mais', 'que', 'qui', 'quoi',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se', 'mon', 'ma',
  'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'ce', 'cet', 'cette', 'ces', 'a', 'au', 'aux',
  'en', 'dans', 'sur', 'pour', 'par', 'avec', 'sans', 'est', 'sont', 'etre', 'ai', 'as', 'a',
  'pas', 'plus', 'moins', 'tres', 'trop', 'bien', 'tout', 'tous', 'toute', 'toutes', 'y', 'n',
  'l', 's', 'c', 'j', 'qu', 'aujourd', 'hui', 'hier', 'demain', 'la', 'fait', 'faire', 'dit',
]);

/** Les mots porteurs d'un texte (sans doublons, sans mots vides). */
export function motsPorteurs(texte: string): string[] {
  const vus = new Set<string>();
  for (const brut of sansAccents(texte).split(/[^a-z0-9]+/)) {
    if (brut.length < 3 || MOTS_VIDES.has(brut)) continue;
    vus.add(brut);
  }
  return [...vus];
}

/**
 * Repère les mots de la prise de voix qui appartiennent au vocabulaire d'un
 * archétype. Renvoie aussi le score de chaque archétype.
 */
export function scorer(texte: string): {
  indices: string[];
  scores: Record<string, number>;
  meilleur: Archetype;
  partage: boolean;
} {
  const porteurs = motsPorteurs(texte);
  const brut = sansAccents(texte);
  const scores: Record<string, number> = {};

  for (const arch of LISTE_ARCHETYPES) {
    let score = 0;
    for (const mot of arch.motsCles) {
      const cle = sansAccents(mot);
      if (porteurs.includes(cle)) score += 3;
      else if (cle.length > 4 && brut.includes(cle)) score += 1;
    }
    scores[arch.id] = score;
  }

  const classe = [...LISTE_ARCHETYPES].sort((a, b) => scores[b.id] - scores[a.id]);
  const premier = classe[0];
  const second = classe[1];
  const partage = scores[premier.id] === scores[second.id];

  // Les indices affichés à l'utilisateur : les mots de vocabulaire réellement
  // entendus, dans l'ordre où ils ont été prononcés.
  const indices: string[] = [];
  for (const mot of sansAccents(texte).split(/[^a-z0-9]+/)) {
    if (mot.length < 3) continue;
    for (const arch of LISTE_ARCHETYPES) {
      if (arch.motsCles.includes(mot) && !indices.includes(mot)) indices.push(mot);
    }
  }

  if (scores[premier.id] === 0) {
    // Rien de reconnaissable : on choisit de façon stable (jamais au hasard,
    // pour qu'une même prise donne toujours la même signature).
    const stable = porteurs.join('').length % LISTE_ARCHETYPES.length;
    return { indices, scores, meilleur: LISTE_ARCHETYPES[stable], partage: true };
  }

  return { indices: indices.slice(0, 8), scores, meilleur: premier, partage };
}

/* ---------------------------------------------------------------------------
   Lecture de la voix (prosodie), quand aucun mot n'est disponible.
--------------------------------------------------------------------------- */

export interface Prosodie {
  /** Énergie moyenne de la voix (0 = silence, 1 = plein). */
  energie: number;
  /** Variation d'énergie : voix régulière ou agitée. */
  variation: number;
  /** Part du temps passée à se taire. */
  silences: number;
}

export const PROSODIE_DEFAUT: Prosodie = { energie: 0.5, variation: 0.4, silences: 0.35 };

/** Calcule la prosodie d'un enregistrement — sans le quitter, dans le navigateur. */
export async function mesurerProsodie(blob: Blob): Promise<Prosodie> {
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return PROSODIE_DEFAUT;

    const ctx = new AudioCtx();
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    await ctx.close();

    const donnees = buffer.getChannelData(0);
    const pas = Math.max(1, Math.floor(buffer.sampleRate / 50)); // tranches de 20 ms
    const tranches: number[] = [];

    for (let i = 0; i < donnees.length; i += pas) {
      let somme = 0;
      const fin = Math.min(i + pas, donnees.length);
      for (let j = i; j < fin; j += 1) somme += donnees[j] * donnees[j];
      tranches.push(Math.sqrt(somme / Math.max(1, fin - i)));
    }

    if (!tranches.length) return PROSODIE_DEFAUT;

    const max = Math.max(...tranches, 0.0001);
    const normalisees = tranches.map((t) => t / max);
    const moyenne = normalisees.reduce((a, b) => a + b, 0) / normalisees.length;
    const variance = normalisees.reduce((a, b) => a + (b - moyenne) ** 2, 0) / normalisees.length;
    const seuil = Math.max(0.12, max * 0.18);
    const muettes = tranches.filter((t) => t < seuil).length;

    return {
      energie: Math.min(1, moyenne * 1.35),
      variation: Math.min(1, Math.sqrt(variance) * 2.2),
      silences: muettes / tranches.length,
    };
  } catch {
    // Format audio illisible dans ce navigateur : on assume une voix moyenne
    // plutôt que d'abandonner l'utilisateur.
    return PROSODIE_DEFAUT;
  }
}

/** Traduit une prosodie en profil sur les quatre axes. */
function axesDepuisProsodie(p: Prosodie): number[] {
  return [
    Math.round(45 + 35 * (1 - p.energie)),
    Math.round(30 + 60 * p.variation),
    Math.round(38 + 55 * p.silences),
    Math.round(35 + 62 * p.energie),
  ];
}

function distance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((somme, v, i) => somme + (v - b[i]) ** 2, 0));
}

/** Les mots que l'on peut dire d'une voix, sans l'avoir comprise. */
function qualifierVoix(p: Prosodie): string[] {
  const mots: string[] = [];
  mots.push(p.energie > 0.58 ? 'voix portée' : p.energie < 0.32 ? 'voix posée' : 'voix égale');
  mots.push(p.variation > 0.55 ? 'ça bouge' : 'débit régulier');
  if (p.silences > 0.45) mots.push('beaucoup de silences');
  else if (p.silences < 0.15) mots.push('presque pas de pause');
  mots.push(p.energie > 0.5 ? 'l’envie dehors' : 'l’envie dedans');
  return mots;
}

/* ---------------------------------------------------------------------------
   Fabrication de la signature
--------------------------------------------------------------------------- */

/** Redresse les propositions reçues (Mistral aime improviser). */
export function normaliserIdees(brutes: unknown, archetype: Archetype): Idee[] {
  const liste = Array.isArray(brutes) ? brutes : [];
  const propres: Idee[] = [];

  for (const item of liste) {
    const o = (item ?? {}) as Record<string, unknown>;
    const nom = String(o.nom ?? o.name ?? '').trim();
    if (!nom) continue;
    const type = String(o.type ?? 'objet') === 'lieu' ? 'lieu' : 'objet';
    propres.push({
      nom: nom.slice(0, 90),
      type,
      requete: String(o.requete ?? o.query ?? nom).slice(0, 80),
      pourquoi: String(o.pourquoi ?? o.why ?? '').slice(0, 120),
    });
    if (propres.length === 5) break;
  }

  // Moins de cinq bonnes propositions : on complète avec celles de l'archétype.
  for (const replis of archetype.idees) {
    if (propres.length >= 5) break;
    if (!propres.some((p) => p.nom === replis.nom)) propres.push(replis);
  }
  return propres.slice(0, 5);
}

function signatureDepuisArchetype(
  archetype: Archetype,
  options: {
    phrase?: string;
    indices: string[];
    axes?: number[];
    source: Signature['source'];
    lecture: Signature['lecture'];
    transcription: string;
    duree: number;
  },
): Signature {
  return {
    archetype,
    phrase: options.phrase?.trim() || archetype.phrase,
    palette: archetype.palette,
    mots: archetype.mots,
    idees: archetype.idees,
    axes: options.axes ?? [...archetype.axes],
    indices: options.indices,
    source: options.source,
    lecture: options.lecture,
    transcription: options.transcription,
    duree: options.duree,
    date: new Date().toISOString(),
  };
}

/** Lecture « mots » : la transcription a parlé. */
export function depuisTexte(
  texte: string,
  duree: number,
  source: Signature['source'] = 'local',
  phrase?: string,
): Signature {
  const { meilleur, indices } = scorer(texte);
  return signatureDepuisArchetype(meilleur, {
    phrase,
    indices,
    source,
    lecture: 'mots',
    transcription: texte.trim(),
    duree,
  });
}

/** Lecture « voix » : faute de mots, la prosodie décide. */
export function depuisProsodie(p: Prosodie, duree: number, transcription = ''): Signature {
  const axes = axesDepuisProsodie(p);
  let meilleur = LISTE_ARCHETYPES[0];
  let ecart = Number.POSITIVE_INFINITY;
  for (const arch of LISTE_ARCHETYPES) {
    const d = distance(axes, [...arch.axes]);
    if (d < ecart) {
      ecart = d;
      meilleur = arch;
    }
  }
  return signatureDepuisArchetype(meilleur, {
    indices: qualifierVoix(p),
    axes,
    source: 'local',
    lecture: 'voix',
    transcription,
    duree,
  });
}

/** Le résumé texte copiable d'une signature. */
export function resumeSignature(s: Signature): string {
  return [
    `Ma signature ÉCHO : ${s.archetype.nom}`,
    s.phrase,
    `Palette : ${s.palette.join(' · ')}`,
    `Planche : ${s.mots.map((m) => m.mot).join(' · ')}`,
    'À découvrir :',
    ...s.idees.map((i) => `- ${i.type === 'lieu' ? 'Lieu' : 'Objet'} : ${i.nom} — ${i.pourquoi}`),
  ].join('\n');
}

export { ARCHETYPES };
