# TodoApp Angular — Kanban Frontend

Angular 21 frontend for a fullstack Kanban board application.
Connects to a Spring Boot backend running on `http://localhost:8081`.

---

## Features

* Kanban board UI (columns + draggable tasks)
* JWT authentication (login / register / auto-refresh)
* Access token stored in memory (not localStorage)
* Refresh token managed via httpOnly cookie (handled by the backend)
* Route guards for protected pages
* Environment-based API URL configuration

---

## Getting Started

### Prerequisites

* Node.js 20+
* Angular CLI 21

### Install dependencies

```bash
npm install
```

### Development server

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The app will reload automatically on file changes.

### Backend connection

The app expects the Spring Boot API at `http://localhost:8081`.
To change the URL, edit the environment files:

* `src/app/environements/environement.dev.ts` — development
* `src/app/environements/environement.prod.ts` — production

---

## Build

```bash
ng build
```

Output is placed in the `dist/` directory.

---

## Running unit tests

```bash
ng test
```

---

## Angular CLI reference

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.2.

### Code scaffolding

```bash
ng generate component component-name
ng generate --help
```

### Running end-to-end tests

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
