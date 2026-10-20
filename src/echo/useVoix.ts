/**
 * useVoix.ts — la prise de voix : un geste, vingt secondes, aucune saisie.
 *
 * Trois choses en parallèle pendant l'écoute :
 *  1. l'enregistrement audio (ce qui part vers Mistral si une clé existe) ;
 *  2. la mesure du niveau sonore, pour que l'utilisateur se voie entendre ;
 *  3. la reconnaissance vocale du navigateur, qui donne un texte de secours
 *     immédiat si aucune clé n'est configurée.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Prise {
  /** L'audio enregistré (peut être vide si le navigateur n'a rien produit). */
  blob: Blob;
  /** Ce que la reconnaissance du navigateur a cru entendre. */
  texteEntendu: string;
  duree: number;
}

interface ResultatVocal {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

interface ReconnaissanceVocale {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((evenement: ResultatVocal) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type ConstructeurVocal = new () => ReconnaissanceVocale;

function constructeurVocal(): ConstructeurVocal | null {
  const w = window as unknown as {
    SpeechRecognition?: ConstructeurVocal;
    webkitSpeechRecognition?: ConstructeurVocal;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function meilleurTypeAudio(): string | undefined {
  const candidats = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  if (typeof MediaRecorder === 'undefined') return undefined;
  return candidats.find((type) => MediaRecorder.isTypeSupported(type));
}

export interface OptionsVoix {
  /** Durée maximale de la prise, en secondes. */
  dureeMax: number;
  /** Appelé une seule fois, à la fin de la prise. */
  onFini: (prise: Prise) => void;
}

export interface RetourVoix {
  ecoute: boolean;
  /** Hauteurs de la forme d'onde, de 0 à 1 (32 valeurs). */
  bars: number[];
  /** Niveau courant, de 0 à 1. */
  niveau: number;
  secondes: number;
  texte: string;
  erreur: string | null;
  demarrer: () => void;
  arreter: () => void;
  effacerErreur: () => void;
}

const NB_BARRES = 32;

export function useVoix({ dureeMax, onFini }: OptionsVoix): RetourVoix {
  const [ecoute, setEcoute] = useState(false);
  const [bars, setBars] = useState<number[]>(() => new Array(NB_BARRES).fill(0));
  const [niveau, setNiveau] = useState(0);
  const [secondes, setSecondes] = useState(0);
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistreur = useRef<MediaRecorder | null>(null);
  const morceaux = useRef<Blob[]>([]);
  const flux = useRef<MediaStream | null>(null);
  const contexte = useRef<AudioContext | null>(null);
  const animation = useRef(0);
  const chrono = useRef<number | null>(null);
  const vocal = useRef<ReconnaissanceVocale | null>(null);
  const finalise = useRef(false);
  const debut = useRef(0);
  const texteFinal = useRef('');
  const texteProvisoire = useRef('');
  const barresRef = useRef<number[]>(new Array(NB_BARRES).fill(0));
  const dureeMaxRef = useRef(dureeMax);
  const onFiniRef = useRef(onFini);

  dureeMaxRef.current = dureeMax;
  onFiniRef.current = onFini;

  /** Tout couper proprement : micro, analyseur, reconnaissance, minuteur. */
  const liberer = useCallback(() => {
    if (chrono.current !== null) {
      window.clearInterval(chrono.current);
      chrono.current = null;
    }
    if (animation.current) {
      window.cancelAnimationFrame(animation.current);
      animation.current = 0;
    }
    try {
      vocal.current?.stop();
    } catch {
      /* déjà arrêtée. */
    }
    vocal.current = null;
    flux.current?.getTracks().forEach((piste) => piste.stop());
    flux.current = null;
    if (contexte.current && contexte.current.state !== 'closed') {
      void contexte.current.close();
    }
    contexte.current = null;
    enregistreur.current = null;
    setEcoute(false);
    setNiveau(0);
    barresRef.current = new Array(NB_BARRES).fill(0);
    setBars(barresRef.current);
  }, []);

  const arreter = useCallback(() => {
    if (chrono.current !== null) {
      window.clearInterval(chrono.current);
      chrono.current = null;
    }
    const dur = Math.max(0, (Date.now() - debut.current) / 1000);
    const machine = enregistreur.current;
    if (machine && machine.state !== 'inactive') {
      // `onstop` se charge de rendre la prise : rien à faire ici.
      machine.stop();
      return;
    }
    if (!finalise.current) {
      finalise.current = true;
      const blob = new Blob(morceaux.current, { type: morceaux.current[0]?.type ?? 'audio/webm' });
      liberer();
      onFiniRef.current({ blob, texteEntendu: texteFinal.current.trim(), duree: dur });
    }
  }, [liberer]);

  const demarrer = useCallback(() => {
    if (ecoute) return;
    setErreur(null);
    setTexte('');
    setSecondes(0);
    texteFinal.current = '';
    texteProvisoire.current = '';
    morceaux.current = [];
    finalise.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setErreur('Ce navigateur ne donne pas accès au microphone.');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then((obtenu) => {
        flux.current = obtenu;
        debut.current = Date.now();
        setEcoute(true);

        // 1. Enregistrement.
        const type = meilleurTypeAudio();
        const machine = new MediaRecorder(obtenu, type ? { mimeType: type } : undefined);
        machine.ondataavailable = (evenement) => {
          if (evenement.data && evenement.data.size > 0) morceaux.current.push(evenement.data);
        };
        machine.onstop = () => {
          if (finalise.current) return;
          finalise.current = true;
          const duree = Math.max(0, (Date.now() - debut.current) / 1000);
          const blob = new Blob(morceaux.current, {
            type: morceaux.current[0]?.type ?? type ?? 'audio/webm',
          });
          const dit = texteFinal.current.trim();
          liberer();
          onFiniRef.current({ blob, texteEntendu: dit, duree });
        };
        enregistreur.current = machine;
        machine.start(250);

        // 2. Forme d'onde : l'utilisateur se voit parler.
        const AudioCtx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          contexte.current = ctx;
          const source = ctx.createMediaStreamSource(obtenu);
          const analyseur = ctx.createAnalyser();
          analyseur.fftSize = 1024;
          analyseur.smoothingTimeConstant = 0.75;
          source.connect(analyseur);
          const donnees = new Uint8Array(analyseur.fftSize);
          let derniere = 0;

          const dessiner = (horodatage: number) => {
            animation.current = window.requestAnimationFrame(dessiner);
            if (horodatage - derniere < 55) return; // ~18 images par seconde
            derniere = horodatage;
            analyseur.getByteTimeDomainData(donnees);
            let somme = 0;
            for (let i = 0; i < donnees.length; i += 1) {
              const v = (donnees[i] - 128) / 128;
              somme += v * v;
            }
            const rms = Math.sqrt(somme / donnees.length);
            const valeur = Math.min(1, rms * 3.4);
            setNiveau(valeur);
            barresRef.current = [...barresRef.current.slice(1), valeur];
            setBars(barresRef.current);
          };
          animation.current = window.requestAnimationFrame(dessiner);
        }

        // 3. Reconnaissance du navigateur : un texte de secours, tout de suite.
        const Constructeur = constructeurVocal();
        if (Constructeur) {
          const reco = new Constructeur();
          reco.lang = 'fr-FR';
          reco.continuous = true;
          reco.interimResults = true;
          reco.maxAlternatives = 1;
          reco.onresult = (evenement) => {
            let provisoire = '';
            for (let i = evenement.resultIndex; i < evenement.results.length; i += 1) {
              const resultat = evenement.results[i];
              const dit = resultat?.[0]?.transcript ?? '';
              if (resultat.isFinal) texteFinal.current += `${dit} `;
              else provisoire += dit;
            }
            texteProvisoire.current = provisoire;
            setTexte(`${texteFinal.current}${provisoire}`.trim());
          };
          reco.onerror = () => {
            /* la reconnaissance est un bonus : son échec ne casse rien. */
          };
          try {
            reco.start();
            vocal.current = reco;
          } catch {
            vocal.current = null;
          }
        }

        // 4. Minuteur : la prise s'arrête toute seule.
        chrono.current = window.setInterval(() => {
          const ecoule = (Date.now() - debut.current) / 1000;
          setSecondes(ecoule);
          if (ecoule >= dureeMaxRef.current) arreter();
        }, 100);
      })
      .catch(() => {
        setErreur('Microphone refusé. Autorise le micro dans le navigateur, ou écris trois mots.');
      });
  }, [arreter, ecoute, liberer]);

  // Le composant disparaît en pleine prise : on range tout.
  useEffect(
    () => () => {
      liberer();
    },
    [liberer],
  );

  return {
    ecoute,
    bars,
    niveau,
    secondes,
    texte,
    erreur,
    demarrer,
    arreter,
    effacerErreur: () => setErreur(null),
  };
}
