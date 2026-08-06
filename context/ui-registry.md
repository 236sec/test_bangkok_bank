# UI Registry

Track every UI component built in the project. Update after each feature that adds or modifies a component.

## Purpose

This file keeps the component inventory visible — what exists, where it lives, and what patterns it uses. Before building a new component, check this registry to avoid duplication. After building one, add it here.

| Component | Path | Purpose | Patterns Used |
| --------- | ---- | ------- | ------------- |
| App (layout shell) | `src/App.tsx` | Authenticated shell: persistent left sidebar (placeholder) + scrollable main content area rendering child routes via `<Outlet />`. | MUI `Box` with flex layout, `borderColor: 'divider'` (token), tokens via themed palette only |

## Pattern Library

### Baseline — Established 2026-08-06

These patterns are extracted from the project scaffold and must be matched by every future component.

#### Color references

| Role | How to reference |
|------|-----------------|
| Primary accent | `color: 'var(--primary)'` in sx, or `theme.palette.primary.main` |
| Text — primary | `theme.palette.text.primary` or `sx={{ color: 'text.primary' }}` |
| Text — secondary | `theme.palette.text.secondary` or `sx={{ color: 'text.secondary' }}` |
| Background — page | `theme.palette.background.default` or `var(--background)` |
| Background — card | `theme.palette.background.paper` or `var(--card)` |
| Border / divider | `theme.palette.divider` or `sx={{ borderColor: 'divider' }}` |
| Destructive | `theme.palette.error.main` or `var(--destructive)` |

**Rule**: Never hardcode hex or oklch values. Always go through the MUI theme palette or CSS custom properties.

#### Border radius

| Context | Value |
|--------|-------|
| Default (shape) | `theme.shape.borderRadius` → 8px (`--radius-md`) |
| Smaller elements | Use `--radius-sm` (6px) or `--radius-xs` (4px) via sx |
| Dialogs/modals | Use `--radius-lg` (12px) |

**Rule**: Start from `theme.shape.borderRadius` (8px). Only deviate when a smaller or larger radius is semantically appropriate.

#### Typography

| Role | Font | Weight |
|------|------|--------|
| All UI text | Inter (`var(--font-sans)`) | Inherited from theme |
| Code/URLs | JetBrains Mono (`var(--font-mono)`) | 400–500 |

**Rule**: `fontFamily` comes from the theme — never hardcode a font stack. Use `fontSize="small"` (20px) for inline/nav icons, `medium` (24px) for button/header icons.

#### Spacing

| Context | Pattern |
|--------|---------|
| Sidebar width | 240px (`width: 240`) |
| Sidebar padding | `p: 2` (16px, MUI spacing unit 2) |
| Main content padding | `p: 3` (24px, MUI spacing unit 3) |
| Sidebar border | `borderRight: 1, borderColor: 'divider'` |

**Rule**: Use MUI spacing units (8px base) via the `sx` prop. Never hardcode pixel padding values when a spacing unit works.

#### Icons

| Context | Size |
|--------|------|
| Inline / nav | `fontSize="small"` (20px) |
| Buttons / headers | `fontSize="medium"` (24px) |

**Rule**: All icons from `@mui/icons-material`. Inherit `currentColor` — never set a fixed color on an icon.

#### Layout shell

| Property | Pattern |
|----------|---------|
| Root wrapper | `display: 'flex', minHeight: '100vh'` |
| Sidebar | `<Box component="nav">`, border on right edge |
| Main content | `<Box component="main">` with `<Outlet />` for route content |

**Rule**: Pages render inside `<Outlet />`. The sidebar and main layout are owned by `App.tsx` — do not recreate them in page components.

---

### App (layout shell)

File: `frontend/src/App.tsx`
Last updated: 2026-08-06

| Property | Value |
|----------|-------|
| Layout | Flex row, full viewport height |
| Sidebar width | 240px |
| Sidebar padding | 16px (spacing unit 2) |
| Sidebar border | 1px `divider` on right edge |
| Main padding | 24px (spacing unit 3) |
| Background | Inherited from theme (`--background`) |

**Pattern notes:**
Sidebar is a placeholder — navigation links will be added in a later phase. The flex layout and border pattern should be preserved when adding nav items.