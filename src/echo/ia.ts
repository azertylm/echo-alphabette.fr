/**
 * ia.ts — la part Mistral d'ÉCHO (IA souveraine, hébergée en France).
 *
 * Deux appels, jamais plus :
 *  1. transcrire la prise de voix (BYOK — la clé reste dans le navigateur de
 *     l'utilisateur, l'audio ne part que vers api.mistral.ai) ;
 *  2. lire la transcription et en tirer une signature personnelle.
 *
 * Sans clé, ou si Mistral répond mal : le moteur local prend le relais
 * (local.ts). ÉCHO ne montre jamais d'écran vide.
 */
import { ARCHETYPES, LISTE_ARCHETYPES } from './archetypes';
import { normaliserIdees } from './local';
import type { Archetype, Idee, Signature } from './types';

export const MODELE_TEXTE = 'mistral-small-latest';
export const MODELE_AUDIO = 'voxtral-mini-latest';
export const URL_CHAT = 'https://api.mistral.ai/v1/chat/completions';
export const URL_AUDIO = 'https://api.mistral.ai/v1/audio/transcriptions';

/** Clé BYOK, propre à l'application, stockée dans le navigateur uniquement. */
export const CLE_LS = 'echo.mistral-cle';

export function lireCle(): string | null {
  try {
    return localStorage.getItem(CLE_LS);
  } catch {
    return null;
  }
}

export function ecrireCle(cle: string | null) {
  try {
    if (cle) localStorage.setItem(CLE_LS, cle);
    else localStorage.removeItem(CLE_LS);
  } catch {
    /* mode privé : on ignore, la clé n'est simplement pas mémorisée. */
  }
}

/* ---------------------------------------------------------------------------
   1. Transcrire la voix
--------------------------------------------------------------------------- */

export async function transcrire(cle: string, audio: Blob): Promise<string> {
  const corps = new FormData();
  const extension = audio.type.includes('ogg') ? 'ogg' : audio.type.includes('mp4') ? 'mp4' : 'webm';
  corps.append('file', new File([audio], `prise.${extension}`, { type: audio.type || 'audio/webm' }));
  corps.append('model', MODELE_AUDIO);
  corps.append('language', 'fr');
  corps.append('temperature', '0');

  const reponse = await fetch(URL_AUDIO, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}` },
    body: corps,
  });

  if (reponse.status === 401) throw new Error('Clé Mistral refusée (401). Vérifie-la dans « Clé IA ».');
  if (reponse.status === 429) throw new Error('Mistral est très sollicité (429). Réessaie dans un instant.');
  if (!reponse.ok) throw new Error(`Transcription indisponible (${reponse.status}).`);

  const json = (await reponse.json()) as { text?: string };
  return String(json?.text ?? '').trim();
}

/* ---------------------------------------------------------------------------
   2. Lire la transcription
--------------------------------------------------------------------------- */

const SYSTEME = `Tu es ÉCHO, l'application de l'écosystème alphabette.fr qui dit aux gens ce qu'ils aiment.
L'utilisateur vient de parler vingt secondes de sa journée, sans se censurer. Tu reçois sa transcription.

Tu choisis l'archétype de goût le plus juste parmi cette liste (identifiant exact) :
${LISTE_ARCHETYPES.map((a) => `- ${a.id} : ${a.nom} — ${a.phrase}`).join('\n')}

Tu réponds UNIQUEMENT par un objet JSON, sans texte autour, exactement :
{
  "archetype": "brut | lumiere | nuit | sel | or | vert",
  "phrase": "une phrase de 20 à 35 mots, en français, au tutoiement, qui dit à l'utilisateur ce que sa voix trahit",
  "indices": ["3 à 6 mots ou expressions réellement présents dans la transcription"],
  "idees": [
    { "nom": "objet ou lieu concret", "type": "objet | lieu", "requete": "requête de recherche courte en français", "pourquoi": "5 à 9 mots" }
  ]
}

Règles :
- exactement 5 idées, dont au moins 2 lieux, jamais de doublon avec ce que la personne possède déjà ;
- « requete » sans accents ni majuscules, comme une recherche qu'on taperait vraiment ;
- « pourquoi » = bénéfice personnel, pas description commerciale ;
- la phrase commence par quelque chose de vivant, jamais « Tu es quelqu'un qui » ni « En tant que » ;
- aucun mot anglais, aucun emoji, aucune flatterie creuse.`;

export interface LectureMistral {
  archetype: Archetype;
  phrase: string;
  indices: string[];
  idees: Idee[];
}

export async function lireAvecMistral(cle: string, transcription: string): Promise<LectureMistral> {
  const reponse = await fetch(URL_CHAT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cle}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELE_TEXTE,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEME },
        { role: 'user', content: `Transcription de la prise de voix :\n« ${transcription} »` },
      ],
    }),
  });

  if (reponse.status === 401) throw new Error('Clé Mistral refusée (401). Vérifie-la dans « Clé IA ».');
  if (reponse.status === 429) throw new Error('Mistral est très sollicité (429). Réessaie dans un instant.');
  if (!reponse.ok) throw new Error(`Analyse indisponible (${reponse.status}).`);

  const json = (await reponse.json()) as { choices?: { message?: { content?: string } }[] };
  const texte = json?.choices?.[0]?.message?.content;
  if (!texte) throw new Error('Réponse de Mistral vide.');

  let brut: Record<string, unknown>;
  try {
    brut = JSON.parse(texte) as Record<string, unknown>;
  } catch {
    throw new Error('Réponse de Mistral illisible.');
  }

  const id = String(brut.archetype ?? '').trim() as keyof typeof ARCHETYPES;
  const archetype = ARCHETYPES[id] ?? LISTE_ARCHETYPES[0];

  return {
    archetype,
    phrase: String(brut.phrase ?? '').trim(),
    indices: (Array.isArray(brut.indices) ? (brut.indices as unknown[]) : [])
      .map((i) => String(i).trim())
      .filter(Boolean)
      .slice(0, 8),
    idees: normaliserIdees(brut.idees, archetype),
  };
}

/** Assemble la signature finale à partir de la lecture Mistral. */
export function signatureMistral(
  lecture: LectureMistral,
  transcription: string,
  duree: number,
): Signature {
  return {
    archetype: lecture.archetype,
    phrase: lecture.phrase || lecture.archetype.phrase,
    palette: lecture.archetype.palette,
    mots: lecture.archetype.mots,
    idees: lecture.idees,
    axes: [...lecture.archetype.axes],
    indices: lecture.indices.length ? lecture.indices : [],
    source: 'mistral',
    lecture: 'mots',
    transcription,
    duree,
    date: new Date().toISOString(),
  };
}
