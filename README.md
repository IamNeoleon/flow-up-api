# Flow Up API

Backend service for **Flow Up** — a real-time project management and Kanban-based task tracking system.

Built with NestJS and Prisma, the API provides authentication, RBAC authorization, transactional data consistency, and real-time synchronization via WebSocket.

---

## Tech Stack

* **NestJS v11.0.1**
* **Prisma ORM**
* **PostgreSQL**
* **Class Validator**
* **JWT (Access + Refresh)**
* **Google OAuth**
* **@nestjs/websockets (Socket.IO)**
* **Cron jobs**

---

## Architecture Overview

The application follows a modular, domain-driven structure.

### Core Modules

* `auth`
* `users`
* `workspaces`
* `boards`
* `columns`
* `tasks`
* `comments`
* `statistics`
* `activity`
* `notification`
* `mail`
* `r2` (file storage integration)
* `ws` (WebSocket gateway)
* `cron`

### Architectural Decisions

* Modular NestJS structure
* Role-based access control (RBAC)
* Workspace-level permission isolation
* Custom decorators (e.g., current user, roles)
* JWT authentication (access + refresh)
* Refresh tokens stored in httpOnly cookies
* Google OAuth integration
* Global exception filter for consistent error handling
* Prisma migrations for schema management
* Database transactions for reorder operations (columns/tasks)
* WebSocket gateway for real-time updates
* CORS configuration enabled

---

## Authentication & Authorization

* JWT Access Token
* JWT Refresh Token (httpOnly cookies)
* Google OAuth login
* Role-based guards
* Workspace-scoped permission checks

Authorization is enforced both at the guard level and within domain services to prevent cross-workspace access.

---

## Real-Time Features

Real-time updates are implemented using NestJS WebSocket Gateway.

Events include:

* Task updates
* Column reorder
* Comments
* Notifications
* Activity updates

---

## Database

* Prisma ORM
* PostgreSQL
* Prisma migrations
* Transactional operations for ordering logic
* Relational structure with strict workspace isolation

---

## Getting Started

### Requirements

* Node.js v24.11.0
* PostgreSQL
* npm

---

### Installation

```bash
npm install
```

---

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/flowup
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_BUCKET=your_bucket_name
```

Adjust values according to your environment.

---

### Run Development Server

```bash
npm run start:dev
```

---

### Build

```bash
npm run build
```

---

## Security

* httpOnly cookie-based refresh tokens
* RBAC across workspaces
* CORS configuration
* Centralized exception handling

---

## Status

This backend serves as a portfolio-level fullstack backend implementation demonstrating modular architecture, transactional data handling, RBAC enforcement, and real-time capabilities using NestJS.