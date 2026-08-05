# UI Tokens

## Theme

Light mode only for v1. Minimalist, content-first aesthetic — calm and focused, easy on the eyes for an app people use daily. Generous whitespace, subtle borders, focus on the links themselves. Think the restrained polish of a modern read-later tool. No hardcoded hex or oklch values in component code — use the CSS variables below.

## Colors

All MUI theme overrides reference these CSS custom property tokens. No hardcoded hex or oklch values in component code.

### Base Tokens

| Role              | CSS Variable              | Value (oklch)                 | Usage                          |
| ----------------- | ------------------------- | ----------------------------- | ------------------------------ |
| Page background   | `--background`            | `oklch(0.98 0.005 95)`        | Root page background (warm near-white) |
| Text primary      | `--foreground`            | `oklch(0.21 0.02 95)`         | Primary content text           |
| Card background   | `--card`                  | `oklch(1 0 0)`                | Card and panel surfaces        |
| Card text         | `--card-foreground`       | `oklch(0.21 0.02 95)`         | Text on cards                  |
| Popover bg        | `--popover`               | `oklch(1 0 0)`                | Dropdowns, tooltips            |
| Popover text      | `--popover-foreground`    | `oklch(0.21 0.02 95)`         | Text in popovers               |
| Primary accent    | `--primary`              | `oklch(0.55 0.13 240)`        | Primary buttons, active states (muted blue) |
| Primary text      | `--primary-foreground`    | `oklch(1 0 0)`                | Text on primary backgrounds    |
| Secondary surface | `--secondary`            | `oklch(0.96 0.006 95)`        | Secondary buttons, muted surfaces |
| Secondary text    | `--secondary-foreground`  | `oklch(0.30 0.02 95)`         | Text on secondary backgrounds  |
| Muted surface     | `--muted`                | `oklch(0.96 0.006 95)`        | Muted backgrounds              |
| Muted text        | `--muted-foreground`     | `oklch(0.50 0.02 95)`         | Secondary text, captions        |
| Accent surface    | `--accent`              | `oklch(0.93 0.01 240)`        | Hover states                   |
| Accent text       | `--accent-foreground`    | `oklch(0.21 0.02 95)`         | Text on accent backgrounds     |
| Borders           | `--border`             | `oklch(0.90 0.01 95)`         | Card borders, dividers         |
| Input border      | `--input`             | `oklch(0.85 0.01 95)`         | Form input borders             |
| Focus ring         | `--ring`              | `oklch(0.55 0.13 240)`        | Focus indicators               |
| Destructive       | `--destructive`          | `oklch(0.58 0.20 25)`         | Delete buttons, error states   |

## Typography

| Role       | Font            | CSS Variable      | Notes                          |
| ---------- | --------------- | ----------------- | ------------------------------ |
| Headings   | Inter           | `--font-heading`  | Section titles, page headers    |
| UI / body  | Inter           | `--font-sans`     | Primary sans-serif for all UI   |
| Fallback   | system-ui       | `--font-sans`     | System fallback                 |
| Code/mono  | JetBrains Mono  | `--font-mono`     | Code blocks, URLs, data values  |

## Border Radius

| Context              | Token / Class  | Value   |
| -------------------- | --------------- | ------- |
| Inline / small UI    | `--radius-xs`   | 4px     |
| Buttons, inputs      | `--radius-sm`   | 6px     |
| Cards, panels        | `--radius-md`   | 8px     |
| Modals, dialogs      | `--radius-lg`   | 12px    |
| Large containers     | `--radius-xl`   | 16px    |
|                      | `--radius-2xl`  | 20px    |
|                      | `--radius-3xl`  | 24px    |
|                      | `--radius-4xl`  | 28px    |