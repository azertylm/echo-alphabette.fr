/**
 * archetypes.ts — les six signatures de goût d'ÉCHO.
 *
 * Ce fichier est la matière première de l'application : six univers complets
 * (palette, planche d'ambiance, propositions concrètes) et les mots français
 * qui y conduisent. Le moteur local s'en sert quand aucune clé Mistral n'est
 * disponible : ÉCHO rend toujours quelque chose de juste, même hors connexion.
 */
import type { Archetype, ArchetypeId, Idee } from './types';

/* ---------------------------------------------------------------------------
   Liens : jamais de lien mort. Un objet part vers une recherche d'artisanat,
   un lieu vers une recherche de carte. Le lien se construit à partir de la
   requête, donc il fonctionne pour n'importe quelle proposition.
--------------------------------------------------------------------------- */

export const lienIdee = (idee: Idee): string =>
  idee.type === 'lieu'
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(idee.requete)}`
    : `https://www.etsy.com/fr/search?q=${encodeURIComponent(idee.requete)}`;

export const libelleLien = (idee: Idee): string => (idee.type === 'lieu' ? 'Voir sur la carte' : 'Trouver cet objet');

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  brut: {
    id: 'brut',
    nom: 'Brut chaleureux',
    phrase:
      'Tu aimes ce qui a déjà vécu : le bois qui se patine, la terre qui garde la trace des mains, les matières qui se bonifient au lieu de s’user.',
    palette: ['#8C5A3C', '#C98A5B', '#E8D5BE', '#4A3728', '#A8B5A0'],
    mots: [
      { mot: 'Bois patiné', emoji: '🪵' },
      { mot: 'Terre cuite', emoji: '🏺' },
      { mot: 'Pierre brute', emoji: '🪨' },
      { mot: 'Laine épaisse', emoji: '🧶' },
      { mot: 'Feu lent', emoji: '🕯️' },
    ],
    idees: [
      { nom: 'Un banc en chêne massif', type: 'objet', requete: 'banc chene massif artisanal', pourquoi: 'Il se transmet au lieu de se remplacer.' },
      { nom: 'Une lampe en terre cuite', type: 'objet', requete: 'lampe terre cuite artisanale', pourquoi: 'La lumière chaude de tes fins de journée.' },
      { nom: 'Un plaid en laine non traitée', type: 'objet', requete: 'plaid laine brute francaise', pourquoi: 'Une matière qui vit, comme toi.' },
      { nom: 'Un bistrot à feu de bois', type: 'lieu', requete: 'bistrot feu de bois cuisine du marche', pourquoi: 'Le bruit des assiettes, pas celui des écrans.' },
      { nom: 'Un atelier de poterie', type: 'lieu', requete: 'atelier poterie cours initiation', pourquoi: 'Tes mains savent déjà quoi faire.' },
    ],
    axes: [84, 62, 45, 38],
    motsCles: [
      'bois', 'terre', 'cuisine', 'maison', 'artisan', 'artisanal', 'rustique', 'campagne', 'poterie',
      'argile', 'pain', 'feu', 'racines', 'famille', 'grand-mere', 'marche', 'lent', 'simple', 'vrai',
      'jardin', 'potager', 'manger', 'four', 'casseroles', 'vieux', 'ancien', 'camping', 'feu de bois',
    ],
  },

  lumiere: {
    id: 'lumiere',
    nom: 'Lumière calme',
    phrase:
      'Tu cherches l’espace : peu d’objets, beaucoup d’air, et cette lumière du matin qui rend tout plus simple. Ton luxe, c’est le silence.',
    palette: ['#F4F1EA', '#DCD5C8', '#B9C4C9', '#8A9BA3', '#3F4A52'],
    mots: [
      { mot: 'Blanc cassé', emoji: '🤍' },
      { mot: 'Silence', emoji: '🌫️' },
      { mot: 'Lin lavé', emoji: '🧺' },
      { mot: 'Verre clair', emoji: '🫧' },
      { mot: 'Matin lent', emoji: '🌤️' },
    ],
    idees: [
      { nom: 'Un plaid en coton lavé', type: 'objet', requete: 'plaid coton lave naturel', pourquoi: 'Le confort sans la surcharge.' },
      { nom: 'Un vase en grès blanc', type: 'objet', requete: 'vase gres blanc mat artisanal', pourquoi: 'Une seule ligne, bien posée.' },
      { nom: 'Un banc de fenêtre en frêne', type: 'objet', requete: 'banc de fenetre frene clair', pourquoi: 'Pour lire dans la bonne lumière.' },
      { nom: 'Une grande serre botanique', type: 'lieu', requete: 'grande serre jardin botanique', pourquoi: 'De la lumière, du vert, aucun bruit.' },
      { nom: 'Un café lumineux à l’aube', type: 'lieu', requete: 'cafe lumineux ouvert tot le matin', pourquoi: 'Ta meilleure heure, personne autour.' },
    ],
    axes: [42, 22, 88, 26],
    motsCles: [
      'calme', 'silence', 'repos', 'reposant', 'matin', 'lire', 'lecture', 'livre', 'blanc', 'clair',
      'respiration', 'respirer', 'paix', 'doux', 'leger', 'fenetre', 'the', 'yoga', 'meditation',
      'ecrire', 'ranger', 'rangement', 'cocooning', 'dormir', 'sieste', 'seul', 'tranquille', 'vide',
      'epure', 'minimal', 'simple', 'lumiere', 'aube', 'reveil',
    ],
  },

  nuit: {
    id: 'nuit',
    nom: 'Nuit urbaine',
    phrase:
      'Tu es du clan de ceux qui s’allument le soir : le béton qui réverbère, la ville qui ne dort pas, et cette énergie qui te tient éveillé plus longtemps que prévu.',
    palette: ['#12141C', '#2A2F45', '#5B6BFF', '#C9D2FF', '#F2C14E'],
    mots: [
      { mot: 'Néon', emoji: '🟣' },
      { mot: 'Béton', emoji: '🏙️' },
      { mot: 'Pluie sur l’asphalte', emoji: '🌧️' },
      { mot: 'Jazz de minuit', emoji: '🎷' },
      { mot: 'Contraste fort', emoji: '⚡' },
    ],
    idees: [
      { nom: 'Une enseigne néon sur mesure', type: 'objet', requete: 'neon personnalise sur mesure texte', pourquoi: 'Une phrase à toi, allumée le soir.' },
      { nom: 'Des enceintes à l’ancienne', type: 'objet', requete: 'enceintes vintage hifi restaurees', pourquoi: 'Le son rond des morceaux que tu aimes.' },
      { nom: 'Un manteau droit, noir', type: 'objet', requete: 'manteau droit noir laine coupe nette', pourquoi: 'Une silhouette, pas une tendance.' },
      { nom: 'Un bar à vinyles', type: 'lieu', requete: 'bar a vinyles disquaire soiree', pourquoi: 'La musique qu’on écoute debout.' },
      { nom: 'Une friche culturelle', type: 'lieu', requete: 'friche culturelle expo concert', pourquoi: 'Là où la ville s’invente encore.' },
    ],
    axes: [38, 86, 30, 92],
    motsCles: [
      'ville', 'nuit', 'musique', 'concert', 'ami', 'amis', 'copains', 'fete', 'sortir', 'bar', 'danse',
      'danser', 'film', 'cine', 'cinema', 'travail', 'boulot', 'ordinateur', 'code', 'projet', 'vitesse',
      'stress', 'pression', 'neon', 'metro', 'techno', 'jeu', 'jeux', 'video', 'urgence', 'deadline',
      'affaires', 'reunion', 'cafe', 'energie', 'tard', 'fatigue',
    ],
  },

  sel: {
    id: 'sel',
    nom: 'Sel et vent',
    phrase:
      'Il te faut du large : de l’air qui bouge, de l’horizon, et cette impression de petitesse qui remet tout à l’endroit. Tu respires mieux dehors.',
    palette: ['#0E3B4A', '#2E7D8F', '#9FD3D8', '#E7E3D4', '#C2703F'],
    mots: [
      { mot: 'Embruns', emoji: '🌊' },
      { mot: 'Bois flotté', emoji: '🪵' },
      { mot: 'Grand air', emoji: '💨' },
      { mot: 'Corde tressée', emoji: '🪢' },
      { mot: 'Horizon net', emoji: '🌅' },
    ],
    idees: [
      { nom: 'Une veste de quart', type: 'objet', requete: 'veste de quart marine impermeable', pourquoi: 'Faite pour rester dehors.' },
      { nom: 'Des jumelles marines', type: 'objet', requete: 'jumelles marines grossissement 7x50', pourquoi: 'Pour regarder plus loin que prévu.' },
      { nom: 'Un carnet de bord en toile', type: 'objet', requete: 'carnet de bord toile relie', pourquoi: 'Noter ce que la mer t’a dit.' },
      { nom: 'Une crique à marée basse', type: 'lieu', requete: 'crique sauvage maree basse acces pied', pourquoi: 'L’endroit que personne ne connaît.' },
      { nom: 'Un port de pêche au matin', type: 'lieu', requete: 'port de peche retour des bateaux matin', pourquoi: 'Le bruit des caisses et du vent.' },
    ],
    axes: [56, 30, 78, 72],
    motsCles: [
      'mer', 'ocean', 'plage', 'voyage', 'voyager', 'voile', 'bateau', 'vent', 'peche', 'ile', 'sable',
      'plongee', 'vague', 'vagues', 'large', 'horizon', 'marcher', 'marche', 'randonnee', 'montagne',
      'dehors', 'promenade', 'exterieur', 'velo', 'air', 'paysage', 'nature', 'aventure', 'partir',
      'evasion', 'camping', 'lac', 'riviere',
    ],
  },

  or: {
    id: 'or',
    nom: 'Or intérieur',
    phrase:
      'Chez toi, tout est feutré : le velours, le cuivre, les conversations qui durent. Tu aimes les plaisirs choisis et les pièces qui ont une histoire.',
    palette: ['#3B1F2B', '#6E3B4E', '#B98A5E', '#E6C79C', '#F6EDE3'],
    mots: [
      { mot: 'Velours', emoji: '🎭' },
      { mot: 'Cuivre', emoji: '🥃' },
      { mot: 'Bougie', emoji: '🕯️' },
      { mot: 'Fauteuil profond', emoji: '🛋️' },
      { mot: 'Longue table', emoji: '🍷' },
    ],
    idees: [
      { nom: 'Une lampe en laiton', type: 'objet', requete: 'lampe laiton massif mid-century', pourquoi: 'Une lumière qui dore la pièce.' },
      { nom: 'Un fauteuil en velours', type: 'objet', requete: 'fauteuil velours colore assise profonde', pourquoi: 'Pour s’asseoir vraiment.' },
      { nom: 'Une carafe en cristal', type: 'objet', requete: 'carafe cristal taillee artisanale', pourquoi: 'Rendre l’eau un peu cérémonieuse.' },
      { nom: 'Un bar à cocktails feutré', type: 'lieu', requete: 'bar cocktails feutre lumiere tamisee', pourquoi: 'On y parle bas, on y reste tard.' },
      { nom: 'Une librairie ancienne', type: 'lieu', requete: 'librairie ancienne livres rares', pourquoi: 'L’odeur du papier qui a servi.' },
    ],
    axes: [76, 70, 34, 44],
    motsCles: [
      'vin', 'restaurant', 'cuisiner', 'gateau', 'diner', 'velours', 'elegance', 'elegant', 'classique',
      'opera', 'musee', 'art', 'parfum', 'chocolat', 'cafe', 'soiree', 'conversation', 'culture',
      'livre', 'histoire', 'gastronomie', 'table', 'recevoir', 'invites', 'cuisine', 'gouter', 'raffine',
      'lent', 'plaisir', 'belle', 'beau',
    ],
  },

  vert: {
    id: 'vert',
    nom: 'Vert vivant',
    phrase:
      'Tu as besoin de pousser : voir une tige se lever, des feuilles occuper l’espace, la vie reprendre là où on ne l’attendait pas. Tu aimes ce qui grandit.',
    palette: ['#123524', '#2F6B4F', '#7FB069', '#D9E5C4', '#F0E7D0'],
    mots: [
      { mot: 'Feuillage', emoji: '🌿' },
      { mot: 'Terreau', emoji: '🪴' },
      { mot: 'Oiseaux', emoji: '🐦' },
      { mot: 'Céramique', emoji: '🍶' },
      { mot: 'Lumière filtrée', emoji: '🌳' },
    ],
    idees: [
      { nom: 'Des pots en terre cuite', type: 'objet', requete: 'pots terre cuite brut formes variees', pourquoi: 'La base de tout, sans détour.' },
      { nom: 'Une jardinière sur pied', type: 'objet', requete: 'jardiniere sur pied metal atelier', pourquoi: 'Cultiver même sans jardin.' },
      { nom: 'Un arrosoir en zinc', type: 'objet', requete: 'arrosoir zinc ancien restaure', pourquoi: 'Un geste quotidien qui apaise.' },
      { nom: 'Les serres d’un jardin botanique', type: 'lieu', requete: 'serres jardin botanique visite plantes tropicales', pourquoi: 'Un voyage à vingt minutes.' },
      { nom: 'Une pépinière de quartier', type: 'lieu', requete: 'pepiniere producteur local plantes', pourquoi: 'Des plantes qui tiendront chez toi.' },
    ],
    axes: [66, 50, 70, 60],
    motsCles: [
      'plante', 'plantes', 'potager', 'foret', 'arbre', 'arbres', 'vert', 'nature', 'compost', 'balcon',
      'fleur', 'fleurs', 'graines', 'semis', 'ecologie', 'terreau', 'oiseaux', 'saison', 'saisons',
      'parc', 'bois', 'champ', 'jardin', 'cultiver', 'arroser', 'vivant', 'grandir', 'pousser', 'ferme',
    ],
  },
};

export const LISTE_ARCHETYPES: Archetype[] = Object.values(ARCHETYPES);