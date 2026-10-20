/**
 * vues.tsx — les trois écrans d'ÉCHO.
 *
 * 1. L'écoute : un bouton, une forme d'onde, rien à écrire.
 * 2. L'analyse : trois phrases qui défilent, pour que l'attente ait un sens.
 * 3. La signature : ce que l'application a compris, la palette, la planche
 *    d'ambiance et cinq propositions concrètes avec leurs liens.
 */
import { useState } from 'react';
import { libelleLien, lienIdee } from './archetypes';
import { resumeSignature } from './local';
import type { Signature } from './types';
import { AXES } from './types';

const Micro = () => (
  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3Z"
      fill="currentColor"
    />
    <path
      d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const Stop = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" />
  </svg>
);

export function BoutonCopier({
  texte,
  libelle,
  fantome,
}: {
  texte: string;
  libelle: string;
  fantome?: boolean;
}) {
  const [fait, setFait] = useState(false);
  return (
    <button
      type="button"
      className={`ec-bouton${fantome ? ' ec-bouton--fantome' : ''}${fait ? ' ec-bouton--fait' : ''}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texte);
        } catch {
          /* navigateur sans presse-papiers : on ne bloque pas l'utilisateur. */
        }
        setFait(true);
        window.setTimeout(() => setFait(false), 1800);
      }}
    >
      {fait ? 'Copié ✓' : libelle}
    </button>
  );
}

/* --------------------- Repli : quelques mots écrits --------------------- */

export function RepliTexte({ onSubmit }: { onSubmit: (texte: string) => void }) {
  const [texte, setTexte] = useState('');
  return (
    <form
      className="ec-cle"
      onSubmit={(evenement) => {
        evenement.preventDefault();
        const propre = texte.trim();
        if (propre) onSubmit(propre);
      }}
    >
      <input
        value={texte}
        placeholder="par exemple : la mer, le bois, ma cuisine, marcher dehors"
        aria-label="Quelques mots sur ce que tu aimes"
        onChange={(evenement) => setTexte(evenement.target.value)}
      />
      <button type="submit" className="ec-bouton">
        Deviner avec ces mots
      </button>
    </form>
  );
}

/* ------------------------------- 1. L'écoute ----------------------------- */

export function SceneEcoute({
  ecoute,
  bars,
  secondes,
  texte,
  dureeMax,
  erreur,
  onDemarrer,
  onArreter,
}: {
  ecoute: boolean;
  bars: number[];
  secondes: number;
  texte: string;
  dureeMax: number;
  erreur: string | null;
  onDemarrer: () => void;
  onArreter: () => void;
}) {
  const restant = Math.max(0, Math.ceil(dureeMax - secondes));

  return (
    <section className="ec-scene" aria-label="Prise de voix">
      <button
        type="button"
        className={`ec-micro${ecoute ? ' ec-micro--ecoute' : ''}`}
        onClick={ecoute ? onArreter : onDemarrer}
        aria-label={ecoute ? 'Arrêter la prise de voix' : 'Commencer à parler'}
      >
        {ecoute && (
          <>
            <span className="ec-micro__halo" aria-hidden="true" />
            <span className="ec-micro__halo ec-micro__halo--2" aria-hidden="true" />
          </>
        )}
        {ecoute ? <Stop /> : <Micro />}
      </button>

      <p className="ec-scene__invite">
        {ecoute ? 'Je t’écoute…' : 'Appuie, puis parle vingt secondes'}
      </p>
      <p className="ec-scene__aide">
        {ecoute
          ? 'Parle comme tu parles d’habitude. Ne cherche pas tes mots : ce sont les tiens qui m’intéressent.'
          : 'Raconte ta journée, ce qui t’a plu, ce qui t’a pesé. Aucun formulaire, aucun champ à remplir.'}
      </p>

      <div className="ec-ondes" aria-hidden="true">
        {bars.map((valeur, index) => (
          <span
            key={index}
            className="ec-onde"
            style={{ height: `${Math.max(3, Math.round(6 + valeur * 52))}px` }}
          />
        ))}
      </div>

      {ecoute && (
        <>
          <p className="ec-chrono">
            <b>{restant}</b> s
          </p>
          {texte && <p className="ec-dit">« {texte} »</p>}
        </>
      )}

      {!ecoute && (
        <div className="ec-etapes">
          <div className="ec-etape">
            <b>1 · Tu parles</b>
            Vingt secondes, à voix haute, sans te censurer.
          </div>
          <div className="ec-etape">
            <b>2 · J’écoute</b>
            Ta voix, ton rythme, tes mots — jamais ton nom.
          </div>
          <div className="ec-etape">
            <b>3 · Tu reçois</b>
            Ta signature, ta palette, cinq choses à découvrir.
          </div>
        </div>
      )}

      {erreur && <p className="ec-erreur">{erreur}</p>}
    </section>
  );
}

/* ------------------------------- 2. L'analyse --------------------------- */

const ETAPES_ANALYSE = [
  'J’écoute ta voix…',
  'Je repère ce qui insiste…',
  'Je compose ta signature…',
];

export function SceneAnalyse() {
  return (
    <section className="ec-analyse" aria-live="polite">
      <div className="ec-analyse__rond" aria-hidden="true" />
      <ul className="ec-analyse__lignes">
        {ETAPES_ANALYSE.map((etape, index) => (
          <li key={etape} style={{ animationDelay: `${index * 0.55}s` }}>
            {etape}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------ 3. La signature ------------------------- */

export function SignatureVue({
  signature,
  onAffiner,
  onRecommencer,
}: {
  signature: Signature;
  onAffiner: () => void;
  onRecommencer: () => void;
}) {
  const badge =
    signature.lecture === 'voix'
      ? 'Lecture de la voix'
      : signature.source === 'mistral'
        ? 'Mistral · clé BYOK'
        : 'Mots entendus · moteur local';

  return (
    <article className="ec-signature" aria-label="Ta signature">
      <header className="ec-signature__tete">
        <span className="ec-source">🔎 {badge}</span>
        <h1 className="ec-signature__nom">{signature.archetype.nom}</h1>
        <p className="ec-signature__phrase">{signature.phrase}</p>
      </header>

      <div className="ec-bloc">
        <h2 className="ec-bloc__titre">Ta palette</h2>
        <div className="ec-palette">
          {signature.palette.map((teinte) => (
            <span key={teinte} className="ec-teinte" style={{ background: teinte }}>
              {teinte}
            </span>
          ))}
        </div>
      </div>

      <div className="ec-bloc">
        <h2 className="ec-bloc__titre">Ta planche d’ambiance</h2>
        <div className="ec-planche">
          {signature.mots.map((mot) => (
            <div key={mot.mot} className="ec-tuile">
              <span className="ec-tuile__emoji" aria-hidden="true">
                {mot.emoji}
              </span>
              <span className="ec-tuile__mot">{mot.mot}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ec-bloc">
        <h2 className="ec-bloc__titre">Cinq choses à aller voir</h2>
        <div className="ec-idees">
          {signature.idees.map((idee) => (
            <div key={idee.nom} className="ec-idee">
              <span className="ec-idee__type" aria-hidden="true">
                {idee.type === 'lieu' ? '📍' : '🎁'}
              </span>
              <span>
                <span className="ec-idee__nom">{idee.nom}</span>
                <br />
                <span className="ec-idee__pourquoi">{idee.pourquoi}</span>
              </span>
              <a
                className="ec-idee__lien"
                href={lienIdee(idee)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {libelleLien(idee)} ↗
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="ec-bloc">
        <h2 className="ec-bloc__titre">Ton profil de goût</h2>
        <div className="ec-axes">
          {AXES.map((nom, index) => (
            <div key={nom} className="ec-axe">
              <span className="ec-axe__nom">{nom}</span>
              <span className="ec-axe__barre">
                <span
                  className="ec-axe__valeur"
                  style={{ width: `${Math.max(4, Math.min(100, signature.axes[index] ?? 0))}%` }}
                />
              </span>
              <span className="ec-axe__chiffre">{signature.axes[index] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {signature.indices.length > 0 && (
        <div className="ec-bloc">
          <h2 className="ec-bloc__titre">
            {signature.lecture === 'voix' ? 'Ce que ta voix trahissait' : 'Ce que j’ai retenu de toi'}
          </h2>
          <div className="ec-indices">
            {signature.indices.map((indice) => (
              <span key={indice} className="ec-indice">
                {indice}
              </span>
            ))}
          </div>
          {signature.transcription && (
            <details className="ec-transcription">
              <summary>Relire ce que j’ai entendu</summary>
              <p>{signature.transcription}</p>
            </details>
          )}
        </div>
      )}

      <footer className="ec-actions">
        <button type="button" className="ec-bouton" onClick={onAffiner}>
          Affiner : 10 secondes de plus
        </button>
        <BoutonCopier texte={resumeSignature(signature)} libelle="Copier ma signature" fantome />
        <button type="button" className="ec-bouton ec-bouton--fantome" onClick={onRecommencer}>
          Recommencer
        </button>
      </footer>
    </article>
  );
}
