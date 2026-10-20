import type { AlphaAppConfig } from '@alphabette/shell';

/**
 * Configuration de l'application.
 * C'est ici que l'on décrit l'identité du site : son nom, son sous-titre, sa
 * couleur, son sous-domaine et ses liens (dons, compte, clés d'API).
 */
export const APP: AlphaAppConfig = {
  key: 'echo',
  name: 'ÉCHO',
  tagline: 'Dis 20 secondes, on devine le reste',

  // Couleur d'identité du site : toute la base s'y adapte.
  accent: '#E2725B',

  // Pictogramme de l'application, affiché dans la barre et le registre.
  icon: '🎙️',

  // Adresses publiques (sous-domaine + chemin sur alphabette.fr).
  subdomain: 'echo',
  homePath: '/echo',

  // Liens de l'écosystème.
  donUrl: 'https://alphabette.fr/don',
  accountUrl: 'https://alphabette.fr/compte',
  apiKeysUrl: 'https://alphabette.fr/cles',

  // Compteur de la barre écosystème : calculé automatiquement depuis le
  // registre central (X applications en ligne / Y au total). Pour forcer des
  // valeurs précises (ex. essai en cours), décommenter :
  // counter: { unlocked: 3, total: 16, trialDaysLeft: 7 },

  apiKeyState: 'ok',
  accountState: 'ok',
};
