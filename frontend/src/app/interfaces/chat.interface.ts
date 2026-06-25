// ── Modèles internes de l'application ────────────────────────────────────────

export interface Message {
  id?: string;
  role: 'user' | 'ai';
  text: string;
  timestamp?: Date;
}

/**
 * Représentation interne d'une conversation,
 * alignée sur ce que renvoie l'API (ApiConversation).
 *
 * - `updated`  : date ISO ou label formaté (ex. "13 juin 2026")
 * - `messages` : tableau optionnel ; vide par défaut avant chargement
 */
export interface Conversation {
  id: string;
  title: string;
  preview: string;   // courte description affichée dans la sidebar card
  updated: string;   // date de dernière mise à jour (string formatée)
  messages: Message[]; // historique local (chargé à la demande)
  createdAt?: Date;
}
