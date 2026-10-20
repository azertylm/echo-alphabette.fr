/**
 * ÉCHO — « Dis 20 secondes, on devine le reste ».
 *
 * L'application ne demande jamais de décrire quoi que ce soit : elle écoute
 * vingt secondes de voix, en tire une signature de goût (nom, palette, planche
 * d'ambiance) et cinq objets ou lieux concrets à découvrir.
 *
 * Les deux barres du haut viennent de la base commune (@alphabette/shell) :
 * elles ne sont ni recodées, ni dupliquées ici.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '@alphabette/shell';
import '@alphabette/shell/style.css';
import './echo/echo.css';
import { APP } from './alphabette.app';
import { RepliTexte, SceneAnalyse, SceneEcoute, SignatureVue } from './echo/vues';
import { depuisProsodie, depuisTexte, mesurerProsodie } from './echo/local';
import { ecrireCle, lireAvecMistral, lireCle, signatureMistral, transcrire } from './echo/ia';
import { useVoix, type Prise } from './echo/useVoix';
import type { Signature } from './echo/types';

const LS_DERNIERE = 'echo.derniere-signature';
const DUREE_PRISE = 20;
const DUREE_AFFINAGE = 10;
/** Durée minimale de l'écran d'analyse : le récit a besoin d'un souffle. */
const SOUFFLE_ANALYSE = 2100;

const messageErreur = (e: unknown): string =>
  e instanceof Error ? e.message : 'Mistral n’a pas répondu. J’ai utilisé le moteur local.';

function chargerDerniere(): Signature | null {
  try {
    const brut = localStorage.getItem(LS_DERNIERE);
    return brut ? (JSON.parse(brut) as Signature) : null;
  } catch {
    return null;
  }
}

type Etat = 'ecoute' | 'analyse' | 'signature';

export function App() {
  const [etat, setEtat] = useState<Etat>('ecoute');
  const [signature, setSignature] = useState<Signature | null>(null);
  const [dureeMax, setDureeMax] = useState(DUREE_PRISE);
  const [souci, setSouci] = useState<string | null>(null);
  const [derniere, setDerniere] = useState<Signature | null>(() => chargerDerniere());

  const transcriptionPrecedente = useRef('');
  const affinageEnAttente = useRef(false);

  /**
   * Le cœur : une prise (voix, ou quelques mots écrits en repli) devient une
   * signature. Mistral d'abord, moteur local ensuite — jamais d'écran vide.
   */
  const traiter = useCallback(async (prise: { blob: Blob | null; texteEntendu: string; duree: number }) => {
    setSouci(null);
    setEtat('analyse');
    const t0 = Date.now();

    let transcription = [transcriptionPrecedente.current, prise.texteEntendu]
      .filter(Boolean)
      .join(' ')
      .trim();
    let analyse: Signature | null = null;
    const cle = lireCle();

    if (cle) {
      try {
        if (prise.blob && prise.blob.size > 0) {
          const dit = await transcrire(cle, prise.blob);
          if (dit) {
            transcription = [transcriptionPrecedente.current, dit].filter(Boolean).join(' ').trim();
          }
        }
        if (transcription) {
          const lecture = await lireAvecMistral(cle, transcription);
          analyse = signatureMistral(lecture, transcription, prise.duree);
        }
      } catch (erreur) {
        setSouci(messageErreur(erreur));
      }
    }

    if (!analyse) {
      if (transcription) {
        analyse = depuisTexte(transcription, prise.duree, 'local');
      } else if (prise.blob) {
        // Aucun mot : la voix seule parle (énergie, variation, silences).
        const prosodie = await mesurerProsodie(prise.blob);
        analyse = depuisProsodie(prosodie, prise.duree);
      } else {
        analyse = depuisProsodie({ energie: 0.5, variation: 0.4, silences: 0.35 }, 0);
      }
    }

    const repos = Math.max(0, SOUFFLE_ANALYSE - (Date.now() - t0));
    if (repos > 0) await new Promise((suite) => window.setTimeout(suite, repos));

    transcriptionPrecedente.current = transcription;
    setSignature(analyse);
    setEtat('signature');
    setDerniere(analyse);
    try {
      localStorage.setItem(LS_DERNIERE, JSON.stringify(analyse));
    } catch {
      /* mode privé : la signature n'est simplement pas mémorisée. */
    }
  }, []);

  const analyser = useCallback(
    (prise: Prise) => {
      void traiter({ blob: prise.blob, texteEntendu: prise.texteEntendu, duree: prise.duree });
    },
    [traiter],
  );

  const voix = useVoix({ dureeMax, onFini: analyser });

  const affiner = useCallback(() => {
    setSignature(null);
    affinageEnAttente.current = true;
    setDureeMax(DUREE_AFFINAGE);
  }, []);

  const recommencer = useCallback(() => {
    transcriptionPrecedente.current = '';
    setSignature(null);
    setSouci(null);
    setDureeMax(DUREE_PRISE);
    setEtat('ecoute');
  }, []);

  // « Affiner » change la durée de prise : on démarre dès que le hook l'a prise
  // en compte (une nouvelle prise vient compléter la précédente).
  useEffect(() => {
    if (affinageEnAttente.current) {
      affinageEnAttente.current = false;
      voix.demarrer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dureeMax]);

  const revoirDerniere = useCallback(() => {
    if (!derniere) return;
    setSignature(derniere);
    transcriptionPrecedente.current = derniere.transcription;
    setEtat('signature');
  }, [derniere]);

  const entete = useMemo(
    () => (
      <>
        <p className="ec-eyebrow">🎙️ ÉCHO · écosystème alphabette.fr</p>
        <h1 className="ec-titre">
          Ta voix suffit : <em>dis vingt secondes</em>, je devine le reste.
        </h1>
        <p className="ec-sous">
          Pas de formulaire, pas de profil à remplir, rien à chercher. Tu parles de ta journée comme tu
          la raconterais à quelqu’un ; ÉCHO en tire ta signature de goût et cinq choses que tu ne
          connaissais pas encore.
        </p>
      </>
    ),
    [],
  );

  return (
    <AppShell app={APP}>
      <div className="ec-page">
        {etat === 'ecoute' && (
          <>
            {entete}
            <SceneEcoute
              ecoute={voix.ecoute}
              bars={voix.bars}
              secondes={voix.secondes}
              texte={voix.texte}
              dureeMax={dureeMax === DUREE_AFFINAGE ? DUREE_AFFINAGE : DUREE_PRISE}
              erreur={voix.erreur}
              onDemarrer={voix.demarrer}
              onArreter={voix.arreter}
            />

            {derniere && (
              <p className="ec-pied">
                <button type="button" className="ec-bouton ec-bouton--fantome" onClick={revoirDerniere}>
                  Revoir ma dernière signature : {derniere.archetype.nom}
                </button>
              </p>
            )}

            <div className="ec-note">
              <details>
                <summary>Pas de micro, ou pas envie de parler ?</summary>
                <p>
                  Trois mots suffisent. ÉCHO devine à partir de ce que tu lui donnes — c’est le même
                  moteur, la même signature.
                </p>
                <RepliTexte
                  onSubmit={(texte) => void traiter({ blob: null, texteEntendu: texte, duree: 0 })}
                />
              </details>
            </div>

            <ReglagesCle />

            <p className="ec-pied">
              Ta voix n’est enregistrée que pour cette analyse. Aucun son n’est conservé ni réutilisé,
              aucune donnée n’est revendue. IA Mistral (France) ou moteur local.
            </p>
          </>
        )}

        {etat === 'analyse' && (
          <>
            <p className="ec-eyebrow">🎙️ ÉCHO</p>
            <h1 className="ec-titre">Je t’ai écouté.</h1>
            <SceneAnalyse />
          </>
        )}

        {etat === 'signature' && signature && (
          <>
            <p className="ec-eyebrow">🎙️ ÉCHO · ta signature</p>
            {souci && <p className="ec-erreur">{souci}</p>}
            <SignatureVue signature={signature} onAffiner={affiner} onRecommencer={recommencer} />
            <p className="ec-pied">
              Cette signature se précise à chaque prise. Déjà {signature.idees.length} pistes concrètes,
              tirées de ta seule voix.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

/* ---------------------------------------------------------------------------
   Le seul réglage de l'application : la clé Mistral (BYOK), qui reste dans le
   navigateur. Sans clé, tout fonctionne quand même — en local.
--------------------------------------------------------------------------- */

function ReglagesCle() {
  const [cle, setCle] = useState(() => lireCle() ?? '');
  const [etat, setEtat] = useState<'repos' | 'enregistree' | 'effacee'>(() =>
    lireCle() ? 'enregistree' : 'repos',
  );

  return (
    <div className="ec-note">
      <strong>Comment ça marche :</strong> ta voix devient un texte {lireCle() ? 'par ' : '— '}
      <em>Mistral AI</em> (serveurs en France) si tu fournis ta clé, sinon par le moteur de
      reconnaissance du navigateur, et à défaut par la seule prosodie de ta voix. Dans tous les cas,
      tu obtiens une signature. Aucun son n’est conservé.
      <details>
        <summary>Clé Mistral (optionnel, BYOK)</summary>
        <p>
          Avec une clé, ÉCHO transcrit ta voix par Mistral et rédige une signature vraiment
          personnelle. La clé reste dans ce navigateur : elle n’est envoyée qu’à api.mistral.ai.
        </p>
        <div className="ec-cle">
          <input
            type="password"
            value={cle}
            placeholder="sk-…"
            aria-label="Clé Mistral"
            onChange={(evenement) => setCle(evenement.target.value)}
          />
          <button
            type="button"
            className="ec-bouton"
            onClick={() => {
              ecrireCle(cle.trim() || null);
              setEtat(cle.trim() ? 'enregistree' : 'effacee');
            }}
          >
            Enregistrer
          </button>
          <button
            type="button"
            className="ec-bouton ec-bouton--fantome"
            onClick={() => {
              ecrireCle(null);
              setCle('');
              setEtat('effacee');
            }}
          >
            Effacer
          </button>
        </div>
        <p className="ec-cle__etat">
          {etat === 'enregistree' && '✓ Clé enregistrée dans ce navigateur : la prochaine prise passera par Mistral.'}
          {etat === 'effacee' && 'Clé effacée. ÉCHO utilise le moteur local.'}
          {etat === 'repos' && 'Aucune clé : ÉCHO fonctionne entièrement en local.'}
        </p>
      </details>
    </div>
  );
}
