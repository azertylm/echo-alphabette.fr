/**
 * types.ts — le vocabulaire d'ÉCHO.
 *
 * Une « signature » est ce que l'application rend à l'utilisateur après avoir
 * écouté vingt secondes de sa voix : un nom de style, une phrase, une palette,
 * une planche d'ambiance et cinq objets ou lieux à aller voir.
 */

export type ArchetypeId = 'brut' | 'lumiere' | 'nuit' | 'sel' | 'or' | 'vert';

/** Une tuile de la planche d'ambiance (mot + pictogramme). */
export interface Mot {
  mot: string;
  emoji: string;
}

/** Une proposition concrète : un objet à s'offrir, ou un lieu à aller voir. */
export interface Idee {
  nom: string;
  type: 'objet' | 'lieu';
  /** Requête de recherche (sert à construire le lien). */
  requete: string;
  /** Pourquoi celle-là, en quelques mots. */
  pourquoi: string;
}

/**
 * Un archétype de goût. Les palettes sont du CONTENU (la signature de
 * l'utilisateur), pas de l'interface : l'habillage de l'application, lui, ne
 * dérive que de `--ab-accent`.
 */
export interface Archetype {
  id: ArchetypeId;
  nom: string;
  phrase: string;
  palette: string[];
  mots: Mot[];
  idees: Idee[];
  /** Profil sur les quatre axes, de 0 à 100. */
  axes: [number, number, number, number];
  /** Mots entendus qui font pencher la balance vers cet archétype. */
  motsCles: string[];
}

/** Les quatre axes affichés sous la signature. */
export const AXES = ['Chaleur', 'Densité', 'Lumière', 'Mouvement'] as const;

export interface Signature {
  archetype: Archetype;
  /** Phrase personnelle (Mistral) ou phrase de l'archétype (repli local). */
  phrase: string;
  palette: string[];
  mots: Mot[];
  idees: Idee[];
  axes: number[];
  /** Mots réellement entendus dans la prise de voix. */
  indices: string[];
  /** D'où vient l'analyse : Mistral (BYOK) ou moteur local. */
  source: 'mistral' | 'local';
  /** « mots » = analysé sur la transcription, « voix » = prosodie seule. */
  lecture: 'mots' | 'voix';
  transcription: string;
  duree: number;
  date: string;
}
