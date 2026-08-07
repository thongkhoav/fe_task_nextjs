# Task System UI Redesign Specification

Status: Implemented

## Objective

Redesign the existing Task System frontend into a cohesive, readable, and responsive workspace application while preserving the current APIs, authorization rules, socket behavior, forms, and business workflows.

## Visual Direction

The interface will use a calm workspace aesthetic:

- Warm neutral page background with white content surfaces.
- Indigo as the primary action and navigation color.
- Emerald, amber, and rose reserved for success, warning, and destructive states.
- Strong information hierarchy, generous spacing, subtle borders, and restrained shadows.
- Consistent 12-16 px corner radii and 44 px minimum interactive targets.
- Inter typography throughout, with compact labels and readable body text.
- No decorative full-page gradient behind operational content.

## Information Architecture

### Public authentication shell

- Shared branded layout for login, sign-up, forgot-password, and reset-password.
- A concise product introduction plus a focused form card on desktop.
- A single-column, edge-safe form on mobile with no fixed minimum width.
- Clear password, validation, loading, success, and navigation states.

### Authenticated application shell

- Persistent top bar containing the product identity, current user, profile action, and sign-out action.
- Constrained content width with predictable responsive padding.
- Room workspace header containing room context and navigation between Tasks, Members, and Chat.
- Consistent page titles, descriptions, primary actions, and secondary actions.

### Rooms dashboard

- Welcome header with Create room and Join room actions.
- Responsive room card grid instead of a plain vertical list.
- Each card shows room name, description, owner, and a clear entry action.
- Friendly empty and loading states.

### Task board

- Room context and workspace navigation remain visible above the board.
- Filtering and creation actions are grouped in a compact toolbar.
- Three visually distinct Kanban columns with task counts and useful empty states.
- Task cards prioritize title, assignee, due date, and remaining time.
- Edit and drag affordances remain permission-aware.
- Small screens retain the Kanban model through horizontally scrollable, snap-aligned columns.

### Members

- Room summary and invite code are grouped into a clear overview card.
- Member rows include initials, name, email, owner badge, and contextual removal action.
- Destructive room, leave-room, and member-removal actions use explicit confirmation language.

### Chat

- A focused conversation panel with a stable header and composer.
- Message bubbles use readable maximum widths and clear sender grouping.
- Date separators, timestamps, empty state, and mobile layout are visually consistent.
- Composer remains accessible at the bottom without obscuring messages.

## Scope

### Included

- Global design tokens and base styles.
- Shared authentication and authenticated-app layout components.
- Login, sign-up, forgot-password, and reset-password pages.
- Rooms list, task board, members, and chat pages.
- Existing dialogs, inputs, buttons, loading states, empty states, and confirmations used by these flows.
- Responsive and accessibility improvements.

### Excluded

- Backend, API contract, database, socket protocol, and authorization changes.
- New product features or new third-party dependencies.
- Notification workflow redesign beyond matching the shared visual system.
- Dark mode.

## Functional Constraints

- Existing endpoints and request payloads must remain unchanged.
- Socket identity and room authorization behavior must remain unchanged.
- Owner/member permissions must continue to control available actions.
- Task creation, editing, assignment, filtering, drag-and-drop status updates, room management, chat, profile editing, and sign-out must remain functional.
- Existing security-related uncommitted changes must be preserved.

## Acceptance Criteria

1. All primary pages use the same visual tokens, navigation patterns, spacing scale, and action hierarchy.
2. Authentication pages fit a 360 px viewport without horizontal overflow.
3. Authenticated pages provide a recognizable global header and consistent room navigation.
4. Rooms, tasks, members, and chat have intentional loading, empty, error, and populated states.
5. The task board is usable at 360 px, 768 px, and desktop widths without clipping important controls.
6. Text and interactive controls meet practical contrast and sizing requirements; icon-only controls have accessible names.
7. Keyboard focus remains visible, form labels remain associated, and destructive actions remain distinguishable from primary actions.
8. Existing API calls, event payloads, authorization checks, and successful user flows do not regress.
9. TypeScript checking and the production build pass.
10. Browser smoke tests cover authentication, rooms, tasks, members, chat, modal interactions, and responsive layouts.

## Implementation Plan

1. Establish global tokens, page background, typography, reusable layout primitives, buttons, inputs, badges, and state components.
2. Build the shared authentication shell and redesign all authentication pages.
3. Build the authenticated top bar and room workspace navigation.
4. Redesign the rooms dashboard and its create/join dialogs.
5. Redesign the task toolbar, columns, cards, filters, and task dialogs.
6. Redesign the members overview, list, invite affordance, and confirmations.
7. Redesign the chat header, message list, bubbles, empty state, and composer.
8. Verify desktop and mobile behavior, then run typecheck, build, browser smoke tests, and final code review.

## File-Level Tasks

- Update `src/app/globals.css`, `src/app/layout.tsx`, and shared UI primitives.
- Add reusable layout and presentation components under `src/components/`.
- Update the four authentication page components.
- Update `src/app/providers/app-provider.tsx` for the global authenticated header without changing auth behavior.
- Update rooms, tasks, task-column, task-card, members, and chat presentation.
- Keep data fetching and mutations localized unless extraction is required to prevent visual components from duplicating behavior.

## Approval Gate

Implementation begins after the objective, visual direction, scope, acceptance criteria, and plan above are approved.
