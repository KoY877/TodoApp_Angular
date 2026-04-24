# Copilot Instructions — TodoApp Angular

## Contexte

Frontend Angular d'une application Kanban fullstack.
Backend : Spring Boot (JWT, cookies httpOnly, refresh token).

---

## Règles générales

- Expliquer chaque correction (problème → cause → solution).
- Préciser le nom du fichier à modifier.
- Ne jamais modifier un fichier non concerné par le bug actuel.
- Avant de toucher un **élément protégé**, afficher un avertissement explicite et demander confirmation.

---

## ⚠️ ÉLÉMENTS PROTÉGÉS — NE PAS MODIFIER SANS AVERTISSEMENT

Ces éléments ont été corrigés et validés. Toute modification accidentelle peut réintroduire des bugs.

### `src/app/components/todoList/column/column.ts`

| Élément | Raison de la protection |
|---|---|
| `generateRandomColor(num)` | Retourne une couleur déterministe depuis un tableau fixe. Ne doit JAMAIS générer aléatoirement (cause NG0100). |
| `loadTasksForColumns()` (forkJoin + `cdr.detectChanges()`) | Le `detectChanges()` est obligatoire après le forkJoin pour afficher les tâches sans clic utilisateur. |
| `ChangeDetectorRef` injecté dans le constructeur | Nécessaire pour les deux corrections ci-dessus. |

---

### `src/app/components/sign-in/sign-in.ts`

| Élément | Raison de la protection |
|---|---|
| `password` validator : **pas** de `Validators.minLength()` | Le minLength bloquait la soumission silencieusement → errorMessage jamais affiché. |
| `ChangeDetectorRef` + `cdr.detectChanges()` dans le catch | Garantit l'affichage de `errorMessage` après une erreur asynchrone (`lastValueFrom`). |
| Gestion `error.status === 0` | Affiche un message lisible en cas de CORS / serveur injoignable. |

---

### `src/app/components/sign-in/sign-in.html`

| Élément | Raison de la protection |
|---|---|
| `<div class="error-message" *ngIf="errorMessage">` | Seul endroit où l'erreur de connexion est affichée. Ne pas supprimer ni déplacer. |

---

### `src/app/components/header/header.ts`

| Élément | Raison de la protection |
|---|---|
| `ngOnInit()` : **pas** de `setTimeout` pour forcer `isConnected` | Le setTimeout masquait le vrai bug et causait NG0100 sur `header.html:19`. |
| `disconnect$.subscribe` avec guard `if (msg !== true) return` | Sans ce guard, le BehaviorSubject émet `false` au démarrage → déconnecte le header après chaque refresh de page. |
| `handleDisconnect()` appelle `authService.logout()` avant `tokenService.clearAll()` | Révoque le cookie httpOnly côté backend. Sans cet appel, l'ancien utilisateur est restauré au prochain refresh. |

---

### `src/app/services/authentication/auth-service.ts`

| Élément | Raison de la protection |
|---|---|
| `logout()` méthode | Appelle `POST /auth/logout` avec `withCredentials: true`. Nécessaire pour la révocation du refresh token (cookie httpOnly). |

---

## Procédure si un élément protégé doit être modifié

1. **Afficher un avertissement** : `⚠️ Cet élément est protégé. Voici pourquoi il a été corrigé ainsi : [raison].`
2. **Expliquer pourquoi la modification est nécessaire** malgré la protection.
3. **Attendre confirmation** de l'utilisateur avant de procéder.

---

## Architecture à respecter

- `TokenService` : stocke l'accessToken **en mémoire uniquement** (jamais en localStorage).
- `Message` (service) : bus d'événements central via `BehaviorSubject`. Tous les `BehaviorSubject` émettent une valeur initiale → toujours mettre un guard sur la valeur reçue.
- `initializeAuth` (APP_INITIALIZER) : restaure la session via cookie httpOnly au démarrage. C'est lui qui émet `messageConnected(true/false)`.
- `authInterceptor` : injecte automatiquement le Bearer token sur toutes les requêtes authentifiées.
