# Product Requirements Document (PRD)

## Overview

**NEXT BINGE WATCH** currently operates as a single-user application where all tracked series, episode watch progress, primary and custom lists, recommendations, and language preferences are shared globally without authentication or user ownership. As a result, multiple viewers cannot maintain independent watchlists or progress histories, there is no role-based control over who can access or create accounts, and personal viewing data cannot be protected behind user credentials.

This feature introduces **User Authentication, Role-Based User Management, and Multi-User Watchlist Isolation**. Public visitors can continue browsing series and people discovery pages without signing in, while authenticated users (`ADMIN` and `USER`) gain a fully isolated personal workspace—including their own 3 protected primary lists (`Want to Watch`, `Watching`, `Watched`), custom Series and People lists, tracked series, watched episodes, personalized "Next Binge Watch" recommendations, and language preferences. Credentials are protected using `bcryptjs` across both frontend and backend so plaintext passwords are never transmitted in request payloads; `ADMIN` users manage account creation, role updates, and user deactivation/deletion; authenticated users can change their own password; a local-development-only (`localhost`) **DEV Mode** enables one-click login from the list of registered users; and all pre-existing watchlist data is seamlessly migrated to the initial seeded `ADMIN` user configured via environment variables.

## Objectives

### Business and Product Goals
- Enable secure multi-user usage of **NEXT BINGE WATCH** with complete per-user isolation of watchlists, custom lists, episode tracking, personalized recommendations, and language preferences.
- Enforce strict role-based administration (`ADMIN` vs. `USER`) so only administrators can register and manage user accounts, while keeping public catalog discovery accessible without friction.
- Protect user credentials end-to-end using `bcryptjs` on both frontend and backend during authentication and password changes so raw plaintext passwords never traverse request payloads or persist in storage.
- Preserve 100% of existing watchlist items, watched episodes, primary/custom lists, and preferences during rollout by migrating them cleanly to the initial seeded `ADMIN` account configured in `backend/.env`.
- Accelerate local development and QA workflows with a strictly `localhost`-gated **DEV Mode** one-click user switcher on the login screen.

### Success Criteria and Key Metrics
- **Zero Data Loss on Migration:** 100% of pre-existing primary lists, custom Series/People lists, tracked series, watched episodes, and preferences are preserved and owned by the initial seeded `ADMIN` account (`FIRST_USER_ADMIN_EMAIL`) after migration.
- **Complete User Isolation:** 0% cross-user data leakage—every authenticated user views and mutates strictly their own lists, tracked series, watched episodes, recommendations, and preferences.
- **Role & Access Control Integrity:** 100% of user-management actions (list, create, role change, deactivate/delete) reject non-`ADMIN` or unauthenticated callers; 100% of private watchlist/list/tracking/account endpoints reject unauthenticated callers while public discovery (Search, Series Profile, Person Profile) remains accessible without login.
- **Credential Validation & Security:** 100% of registration and password-change operations enforce all field rules (UUID identifier, unique case-insensitive username max 39 chars `[A-Za-z0-9-]`, valid unique case-insensitive email max 254 chars, password 8–60 chars) and use `bcryptjs` on both frontend and backend with zero plaintext passwords transmitted or persisted.
- **DEV Mode Safety Boundary:** 100% of non-`localhost` / production environments completely hide and disable DEV Mode one-click login in both UI and backend.
- **Responsiveness, Localization & Accessibility:** 95% of login, password-change, and user-management flows complete within 500 ms locally; 100% of new UI copy and error messages are localized in `en` and `pt-BR`; 0 critical or serious WCAG 2.1 Level AA violations across desktop (`1280px+`) and mobile (`375px`).

## User stories

- **US1 (Public Discovery vs. Authenticated Features):** As an unauthenticated visitor, I want to search for TV series and people and view Series and Person profiles without signing in, and be clearly prompted or redirected to sign in when accessing Watchlist, My Lists, episode tracking, or account settings, so that I can explore the catalog freely before logging in.
- **US2 (Sign In & Sign Out):** As a registered user (`ADMIN` or `USER`), I want to sign in using either my username or email (case-insensitive) together with my password—without my plaintext password ever appearing in network requests—and sign out cleanly at any time, so that my personal watchlists and progress stay protected.
- **US3 (Self-Service Password Change):** As an authenticated user, I want to change my own password by confirming my current password and entering a new password with confirmation, so that I can keep my account secure.
- **US4 (Admin User Registration & Management):** As an `ADMIN` user, I want to view the list of registered users, create new `ADMIN` or `USER` accounts, change another user's role, and deactivate or delete other users (with safeguards preventing self-lockout), so that I can control who has access to the application.
- **US5 (Automatic First Admin Seed & Legacy Data Migration):** As the system owner deploying the update, I want the first `ADMIN` account to be seeded automatically from `backend/.env` environment variables and all pre-existing watchlist items, custom lists, watched episodes, and preferences to be migrated to that account, so that upgrading never loses existing tracking data.
- **US6 (Isolated Multi-User Watchlists & Lists):** As a newly created user, I want to immediately have my own independent set of 3 protected primary lists (`Want to Watch`, `Watching`, `Watched`), custom Series and People lists, watched episodes, personalized recommendations, and language preference, so that my viewing activity never interferes with other users.
- **US7 (Local Development DEV Mode Login):** As a developer testing locally on `localhost`, I want a DEV Mode panel on the login screen that lists registered users and lets me sign in as any active user with a single button click, so that I can switch roles and test multi-user isolation rapidly without retyping credentials.

## Core features

### 1. User Accounts, Roles & Initial Admin Seeding
Introduces persistent user identities with strict validation rules, two permission roles (`ADMIN` and `USER`), and automated seeding of the initial administrator from environment configuration.

At a high level, every user has a unique UUID identifier, a unique case-insensitive username, a unique case-insensitive email, a `bcryptjs`-protected password credential, a role (`ADMIN` or `USER`), and an active/inactive lifecycle state. On initial setup/migration, the system provisions the first `ADMIN` user using the environment variables defined in `backend/.env` (`FIRST_USER_ADMIN_ROLE`, `FIRST_USER_ADMIN_USERNAME`, `FIRST_USER_ADMIN_EMAIL`, `FIRST_USER_ADMIN_PASSWORD`).

- **FR1:** Each user account must store:
  - **ID:** Unique UUID identifier.
  - **Username:** Required, unique case-insensitively (e.g., `Lucas-Dev` and `lucas-dev` conflict), trimmed, 1 to 39 characters, allowing only ASCII letters (`A-Z`, `a-z`), numbers (`0-9`), and dashes (`-`).
  - **Email:** Required, valid email format, unique case-insensitively, maximum length 254 characters.
  - **Password:** Required, minimum length 8 characters and maximum length 60 characters prior to hashing.
  - **Role:** Required, strictly one of `ADMIN` or `USER`.
  - **Status:** Active or deactivated state (deactivated users cannot sign in and any existing sessions for them are invalidated).
- **FR2:** The first registered user must be automatically seeded using the values configured in `backend/.env`: `FIRST_USER_ADMIN_ROLE`, `FIRST_USER_ADMIN_USERNAME`, `FIRST_USER_ADMIN_EMAIL`, and `FIRST_USER_ADMIN_PASSWORD`.
- **FR3:** Only users with the `ADMIN` role are permitted to create new user accounts; public self-registration must not exist.
- **FR4:** Every newly created user (including the seeded initial `ADMIN`) must automatically receive their own personal set of the 3 built-in protected primary Series lists (`Want to Watch`, `Watching`, `Watched`) so they can track series immediately upon first login.

### 2. Authentication, Session Handling & `bcryptjs` Credential Protection
Provides sign-in, session persistence across reloads, sign-out, and end-to-end `bcryptjs` password protection across frontend and backend.

At a high level, users sign in on the Login screen using either their **username or email** (case-insensitive) plus their password. Following the `bcryptjs` library model (`https://github.com/bcrypt-js/bcrypt.js`), the frontend hashes/transforms the password with `bcryptjs` before submitting authentication or password-change requests so plaintext passwords are never sent in HTTP payloads, while the backend performs server-side `bcryptjs` verification and storage hashing so captured client payloads are never directly usable as database credentials.

- **FR5:** Users must be able to authenticate on the Login screen using either their **username** or **email** (matched case-insensitively) along with their password.
- **FR6:** Both authentication (login) and password-change flows must use `bcryptjs` on the frontend and backend so plaintext passwords are never transmitted over the wire in request payloads and never stored in plaintext in the database.
- **FR7:** Invalid credentials (unknown identifier or wrong password) must fail with a generic, localized authentication error that does not reveal whether the username or email exists; deactivated accounts must be prevented from logging in with an appropriate localized error.
- **FR8:** Authenticated sessions must persist across page reloads until the user explicitly signs out, the session expires, or the account is deactivated/deleted.
- **FR9:** Authenticated users must be able to sign out from the application navigation, immediately clearing session state and returning to a clean unauthenticated state (or Login screen when on a protected route).

### 3. Access Control: Public Discovery vs. Protected Workspace
Separates public catalog browsing from private user-owned tracking, lists, and account/admin workflows.

At a high level, unauthenticated visitors can use Search and view Series and Person profiles without being blocked. Protected routes (`/watchlist`, `/watchlist/:listId`, account password change, and admin user management) require authentication and redirect unauthenticated visitors to the Login screen (preserving the intended destination after login).

- **FR10:** Public discovery features—Home search, Series Profile viewing, and Person Profile viewing—must remain accessible without authentication; when unauthenticated, personal list membership badges are omitted and list/tracking actions prompt or navigate the visitor to sign in.
- **FR11:** All personal tracking and account routes and mutations—My Lists (`/watchlist`), List Detail (`/watchlist/:listId`), adding/updating/removing tracked series, marking/unmarking episodes or seasons, managing custom lists and list memberships, saving user preferences, and changing password—must require an authenticated active user.
- **FR12:** All user-management routes and views must require an authenticated active user with the `ADMIN` role; `USER` accounts attempting to access them must be denied cleanly with localized feedback.

### 4. Self-Service Password Change
Allows any logged-in user to securely update their own password from their account settings.

At a high level, an authenticated user navigates to the Change Password view/section, enters their current password, a new password (8–60 characters), and a confirmation matching the new password. Both frontend and backend apply `bcryptjs` handling, verify the current password before applying the update, and provide clear localized confirmation or inline validation feedback.

- **FR13:** Logged-in users (`ADMIN` and `USER`) must have an option to change their own password requiring three fields: **Current Password**, **New Password**, and **Confirm New Password**.
- **FR14:** Password change must validate that:
  - The current password matches the user's existing stored credential.
  - The new password is between 8 and 60 characters long.
  - The confirmation field matches the new password exactly.
  - The new password differs from the current password (or rejects blank/mismatched entries with clear localized errors).
- **FR15:** Upon successful password change, the updated credential must take effect immediately for subsequent logins, and the user must receive clear localized confirmation feedback.

### 5. Admin User Management
Gives `ADMIN` users full visibility and lifecycle control over application accounts.

At a high level, `ADMIN` users access a dedicated User Management screen (visible in navigation only to `ADMIN` users) where they can inspect all registered users, create new users, promote/demote roles between `ADMIN` and `USER`, deactivate or reactivate users, and permanently delete other users after confirmation.

- **FR16:** `ADMIN` users must be able to view a list of all registered users showing each user's username, email, role (`ADMIN` / `USER`), account status (active / deactivated), and creation date.
- **FR17:** `ADMIN` users must be able to create a new user by providing a valid username (1–39 chars, `[A-Za-z0-9-]`, unique case-insensitively), valid email (max 254 chars, unique case-insensitively), initial password (8–60 chars, protected via `bcryptjs`), and role (`ADMIN` or `USER`).
- **FR18:** `ADMIN` users must be able to change another user's role between `ADMIN` and `USER`, and deactivate or reactivate another user's account.
- **FR19:** `ADMIN` users must be able to delete another user account only after an explicit confirmation dialog warning that the user's watchlists, lists, and watch history will be permanently removed.
- **FR20 (Admin Safety Guards):** An `ADMIN` must not be allowed to demote, deactivate, or delete their own currently logged-in account, and the system must never allow removing or deactivating the last active `ADMIN` account.

### 6. Login DEV Mode (Local Development Only)
Streamlines multi-user testing on `localhost` with one-click login while ensuring zero exposure outside local development.

At a high level, when the application runs in local development (`localhost`), the Login screen renders a clearly badged **DEV Mode** panel displaying the registered users (username, email, role, status). Clicking a user's one-click login button authenticates immediately as that user. Outside local development, the panel is never rendered and the backing DEV-login capability is completely disabled.

- **FR21:** In local development (`localhost`) only, the Login screen must display a **DEV Mode** section listing registered users with a one-click **Login** action for each active user (deactivated users are clearly marked and cannot be logged into).
- **FR22:** Clicking a user in **DEV Mode** must authenticate as that selected user immediately, establish a normal authenticated session, and navigate into the application with that user's isolated watchlists and permissions.
- **FR23:** Outside local development (any non-`localhost` host or production environment), **DEV Mode** must be completely hidden from the UI and strictly rejected by the backend so it cannot be invoked directly.

### 7. Multi-User Watchlist Ownership & Legacy Data Migration
Links all watchlist and personalization entities to user ownership and migrates pre-existing records without data loss.

At a high level, every user-owned record—primary and custom lists, tracked series, watched episodes, custom list series/people memberships, and saved preferences—is scoped to a specific user (`user_id` referencing the users table). Existing records present prior to this release are migrated to the initial seeded `ADMIN` user (`FIRST_USER_ADMIN_EMAIL`). Uniqueness constraints (such as custom list names or primary system keys) are scoped per user so different users can independently create lists with the same name and customize their own 3 primary lists.

- **FR24:** All watchlist and user-personalization entities—`user_lists` (primary and custom lists), `watchlist_items` (tracked series), `watched_episodes`, `custom_list_series`, `custom_list_people`, and `user_preferences`—must reference the owning user in the `users` table so data is strictly isolated per user.
- **FR25:** All existing watchlist records, primary and custom lists, custom list memberships, watched episodes, and preferences in the database must be migrated to the first seeded `ADMIN` user (`FIRST_USER_ADMIN_EMAIL`) without losing any tracked series, episode progress, or custom list metadata.
- **FR26:** Two different users must be able to independently track the same TV series with different statuses/episode progress, customize their own 3 primary lists' icons/colors independently, create custom lists with the same name, and save independent language preferences (`en` / `pt-BR`).
- **FR27:** "Next Binge Watch" recommendations and ubiquitous list membership badges across Search, Recommendations, Series Profile, My Lists, and Person Credits must reflect only the currently authenticated user's lists and watch progress (and omit personal badges when unauthenticated).

### 8. Bilingual Localization (`en` and `pt-BR`)
Maintains complete bilingual consistency across all new authentication, account, and admin user-management experiences.

- **FR28:** All new labels, buttons, placeholders, role badges, status badges, DEV Mode notices, confirmation prompts, validation messages, and backend error messages must be fully localized in both `en` and `pt-BR`.

## Acceptance criteria

- **AC-01 (US5, FR1, FR2, FR4, FR24, FR25):** Given an existing database containing tracked series, watched episodes, primary list customizations, custom Series/People lists, and preferences, when the database migration and initial bootstrap run with `FIRST_USER_ADMIN_ROLE`, `FIRST_USER_ADMIN_USERNAME`, `FIRST_USER_ADMIN_EMAIL`, and `FIRST_USER_ADMIN_PASSWORD` configured in `backend/.env`, then the first `ADMIN` user exists with a UUID identifier and matching username/email/role, and 100% of pre-existing lists, tracked series, watched episodes, and preferences belong to that user with zero data loss.
- **AC-02 (US1, FR10, FR11, FR27):** Given an unauthenticated visitor opens the application, when they visit Home, search for series or people, or open a Series Profile or Person Profile, then catalog content loads cleanly without personal list badges; when they attempt to open `/watchlist`, `/watchlist/:listId`, account password change, or trigger a watchlist/tracking mutation, then they are prompted or redirected to the Login screen (and unauthenticated API requests to protected endpoints return `401 Unauthorized`).
- **AC-03 (US2, FR5, FR6, FR7, FR8, FR9):** Given an active registered user, when they sign in on the Login screen using either their username or email in any letter casing together with their valid password, then the frontend processes the password with `bcryptjs` before sending (no plaintext password appears in the request payload), the backend verifies credentials with `bcryptjs`, the session persists across page reloads, and clicking Sign Out clears the session immediately; when invalid credentials or a deactivated account are submitted, then login fails with a clear localized error.
- **AC-04 (US3, FR6, FR13, FR14, FR15):** Given an authenticated user opens Change Password, when they submit an incorrect current password, a new password shorter than 8 or longer than 60 characters, or a mismatched confirmation, then the update is rejected with clear localized errors; when they submit their valid current password plus a valid matching new password, then both frontend and backend process the credentials with `bcryptjs`, the change succeeds with localized confirmation, the old password is rejected on subsequent login, and the new password succeeds.
- **AC-05 (US4, FR1, FR3, FR4, FR12, FR16, FR17):** Given an authenticated `ADMIN` opens User Management, when they view the user list and submit a new user with a valid username (`[A-Za-z0-9-]`, max 39 chars), valid email (max 254 chars), password (8–60 chars), and role (`ADMIN` or `USER`), then the user is created with a UUID and automatically provisioned with their own 3 primary lists; when duplicate username/email (regardless of casing), invalid username characters, length violations, or invalid email format are submitted, then creation is rejected with localized validation errors; and when a `USER`-role account attempts to access User Management UI or APIs, access is denied (`403 Forbidden`).
- **AC-06 (US4, FR18, FR19, FR20):** Given an authenticated `ADMIN` manages another user in User Management, when they change the other user's role (`USER` ↔ `ADMIN`) or deactivate/reactivate that user, then the change takes effect immediately (deactivated users cannot sign in and lose access); when the `ADMIN` confirms deletion of another user, that user and their owned watchlist data are removed; and any attempt by an `ADMIN` to demote, deactivate, or delete themselves (or the last active `ADMIN`) is blocked with a clear localized error.
- **AC-07 (US6, FR4, FR24, FR26, FR27):** Given two distinct active users (`User A` and `User B`), when `User A` tracks a series, marks episodes watched, customizes a primary list's icon/color, creates a custom list named `"Sci-Fi"`, and switches language to `pt-BR`, and then `User B` signs in, then `User B` sees their own clean 3 primary lists, zero items from `User A`, can independently create their own `"Sci-Fi"` list and track the same series at a different status/progress, and keeps their own language preference without affecting `User A`.
- **AC-08 (US7, FR21, FR22, FR23):** Given the application is running in local development on `localhost`, when a user opens the Login screen, then the **DEV Mode** panel lists registered users with one-click Login buttons for active users, and clicking a button immediately signs in as that user with full session and role behavior; when the application runs outside `localhost` / in production mode, then the **DEV Mode** panel is not rendered and any direct attempt to call the DEV login endpoint is rejected.
- **AC-09 (FR28):** Given any new screen or modal (Login, DEV Mode, Change Password, User Management, Create/Delete User dialogs, and header account controls), when viewed in `en` and `pt-BR` across desktop (`1280px+`) and mobile (`375px`) viewports, then 100% of labels and error messages are localized cleanly, keyboard navigation and ARIA labels meet WCAG 2.1 Level AA with zero critical/serious violations, and zero horizontal overflow occurs.

## User experience

### User Profiles and Needs
- **Unauthenticated Visitor:** Wants frictionless browsing of TV series, cast/crew, and search results, with a clear **Sign In** entry point in the header and helpful prompts when trying to save/track shows.
- **Standard Viewer (`USER`):** Wants a fast login experience, clear visibility of who is currently signed in, full ownership of their watchlists/lists/episodes/preferences, easy self-service password updates, and one-click sign-out.
- **Administrator (`ADMIN`):** Needs all standard viewer capabilities plus a clean, focused **Users** management interface to onboard new accounts, adjust roles, and deactivate/delete users safely without risking self-lockout.
- **Local Developer (`localhost`):** Needs a clearly distinguished, non-intrusive **DEV Mode** quick-login card on the Login screen to switch between `ADMIN` and `USER` test accounts in one click.

### Main Flows and Interactions
1. **Header Account Navigation:**
   - When signed out: displays a prominent **Sign In** button alongside Home/Discovery and the language switcher.
   - When signed in: displays **My Lists** (`Minhas Listas`), the current user's username & role badge (or account menu) with quick links to **Change Password**, **Users** (visible only to `ADMIN`), and **Sign Out**.
2. **Login Flow (`/login`):**
   - Clean Cyber-Neon card featuring **Username or Email** input, **Password** input (with accessible show/hide toggle), and **Sign In** button.
   - After signing in, redirects back to the originally requested protected route (or `/` / `/watchlist` by default).
   - **DEV Mode Panel (`localhost` only):** Positioned below or beside the standard login form with a distinct amber/neon `DEV MODE` badge, listing registered users (username, email, role chip, active/inactive state) and a one-click **Login** button per active user.
3. **Change Password Flow (`/account/password` or Account view):**
   - Form with **Current Password**, **New Password** (with inline 8–60 char guidance), and **Confirm New Password**, each with accessible visibility toggles, clear inline validation, and localized success/error alerts.
4. **Admin User Management Flow (`/admin/users`):**
   - Responsive table/card list of users showing username, email, role selector (`ADMIN` / `USER`), status badge (Active / Deactivated), and actions (Deactivate/Reactivate, Delete) with disabled/protected indicators on the current admin's own row.
   - **Create User** modal or drawer with inline validation for username (`[A-Za-z0-9-]`, max 39), email (max 254), password (8–60), and role (`ADMIN` / `USER`).
   - Explicit confirmation dialog before deleting any user account.

### UI/UX and Accessibility Requirements
- Maintain full visual consistency with the **Cyber-Neon Design System** (dark obsidian canvas, high-contrast neon accents, opaque modal backdrops, clean focus rings).
- Meet **WCAG 2.1 Level AA** contrast ratios (≥ 4.5:1 for normal text, ≥ 3:1 for UI components and focus indicators).
- Support complete keyboard navigation across login, DEV Mode list, password visibility toggles, modals, and admin user table/cards, with proper `<label>` associations, `aria-invalid`, `aria-describedby`, `role="alert"` for errors/confirmations, and focus management on modal open/close.
- Responsive layouts at both desktop (`1280px+`) and mobile (`375px`) viewports with zero horizontal overflow (including long emails up to 254 chars and 39-char usernames using safe text wrapping/truncation).

## High-level technical constraints

- **Existing Systems & Architecture Separation:** Must integrate seamlessly with the existing independent `frontend/` (React 19, TypeScript, Vite, Tailwind CSS, React Router) and `backend/` (Node.js, Express 5, TypeScript, PostgreSQL 18.7 with reversible `node-pg-migrate` migrations) applications without introducing a root `package.json`.
- **Mandatory `bcryptjs` Usage (Frontend & Backend):** Must use the `bcryptjs` library (`https://github.com/bcrypt-js/bcrypt.js`) in both `frontend/` and `backend/` for authentication and password-change workflows so plaintext passwords are never transmitted in request payloads and stored credentials remain cryptographically hashed with `bcryptjs` on the server.
- **Environment-Driven Initial Admin Configuration:** Initial `ADMIN` account provisioning must read `FIRST_USER_ADMIN_ROLE`, `FIRST_USER_ADMIN_USERNAME`, `FIRST_USER_ADMIN_EMAIL`, and `FIRST_USER_ADMIN_PASSWORD` from `backend/.env` (and document placeholders in `backend/.env.example`), never hardcoding credentials in source code.
- **Strict DEV Mode Environment Gating:** DEV Mode user listing and one-click login must be strictly constrained to local development (`localhost`) and disabled/unavailable in non-local or production environments on both client and server.
- **Data Privacy & Security:** Password hashes and sensitive auth secrets must never be returned in API responses or written to logs; user-owned data queries and mutations must always be scoped to the authenticated user identity derived from the server-verified session, never trusting a client-supplied user ID.
- **Reversible Schema Migration & Test Isolation:** All PostgreSQL schema additions (`users` table, foreign keys, per-user uniqueness constraints, legacy data migration to the initial `ADMIN`) must be implemented via reversible `node-pg-migrate` migrations and work cleanly across both `DATABASE_URL` and isolated `TEST_DATABASE_URL` test suites (preserving ≥ 80% test coverage and full Playwright E2E coverage).
- **Performance Targets:** Password hashing cost factor must balance security and responsiveness so 95% of login and password-change operations complete within 500 ms locally without freezing the browser UI thread.

## Out of scope

- **Public Self-Registration / Sign-Up:** Visitors cannot create their own accounts; only `ADMIN` users can register accounts.
- **Forgot Password / Email Reset Flows:** Automated password-reset emails, magic links, or outbound SMTP/email delivery integrations.
- **Social Login / External OAuth / SSO / MFA:** Google, GitHub, Apple OAuth, SAML, passkeys, or two-factor authentication (2FA/TOTP).
- **Admin Password Reset for Other Users:** Administrators cannot view or overwrite another user's password directly in this phase (only create accounts with an initial password and manage role/active status/deletion).
- **Shared / Public Collaborative Lists:** Sharing lists across different users, public profile URLs, or social following features.
- **Granular Custom Permissions (RBAC Beyond `ADMIN` and `USER`):** Additional roles, per-feature permission matrices, or audit log dashboards.
