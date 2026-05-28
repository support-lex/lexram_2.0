# LexRam Typography System

## Font Families

### Primary Fonts

| Font | Variable | Usage | Fallback |
|------|----------|-------|----------|
| **Geist** | `--font-sans` | UI components, body text, dashboards | `ui-sans-serif, system-ui, sans-serif` |
| **Geist Mono** | `--font-mono` | Code, timestamps, data | `ui-monospace, monospace` |
| **Libre Baskerville** | `--font-serif` | Marketing headings, legal documents | `ui-serif, Georgia, serif` |

### Font Registration

```css
/* app/globals.css - @theme inline */
--font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
--font-serif: var(--font-serif), ui-serif, Georgia, serif;
--font-mono: var(--font-mono), ui-monospace, monospace;
```

## Typography Hierarchy

### Marketing Pages (Landing, About, etc.)

| Element | Font | Weight | Size | Usage |
|---------|------|--------|------|-------|
| H1 (Hero) | `font-serif` | `font-light` (300) | `text-5xl` to `text-9xl` | Main hero headlines |
| H2 (Section) | `font-serif` | `font-normal` (400) | `text-3xl` to `text-7xl` | Section headings |
| H3 (Subsection) | `font-serif` | `font-bold` (700) | `text-xl` to `text-4xl` | Subsection titles |
| Body | `font-sans` | `font-normal` (400) | `text-base` | Paragraphs |
| Brand/Logo | `font-serif` | `font-bold` (700) | `text-xl` | Logo text |

### Dashboard & Application UI

| Element | Font | Weight | Size | Usage |
|---------|------|--------|------|-------|
| Page Title | `font-sans` | `font-semibold` (600) | `text-2xl` to `text-3xl` | Dashboard titles |
| Card Title | `font-sans` | `font-semibold` (600) | `text-lg` to `text-xl` | Card headers |
| Section Label | `font-sans` | `font-medium` (500) | `text-sm` | Section labels |
| Body | `font-sans` | `font-normal` (400) | `text-sm` to `text-base` | Content |
| Button | `font-sans` | `font-medium` (500) | `text-sm` | Button text |
| Input | `font-sans` | `font-normal` (400) | `text-sm` to `text-base` | Form inputs |
| Tab | `font-sans` | `font-medium` (500) | `text-sm` | Tab labels |

### Data & Code

| Element | Font | Weight | Size | Usage |
|---------|------|--------|------|-------|
| Code | `font-mono` | `font-normal` (400) | `text-xs` to `text-sm` | Code blocks |
| Timestamp | `font-mono` | `font-normal` (400) | `text-xs` | Dates/times |
| Case Numbers | `font-mono` | `font-medium` (500) | `text-sm` | Legal references |
| Data Values | `font-mono` | `font-normal` (400) | `text-xs` | Tabular data |

### Legal Documents

| Element | Font | Weight | Size | Usage |
|---------|------|--------|------|-------|
| Document Body | `font-serif` | `font-normal` (400) | `text-base` | Contract text |
| Diff View | `font-serif` | `font-normal` (400) | `text-[15px]` | Document diffs |
| Citations | `font-serif` | `font-italic` | `text-base` | Legal citations |

## Component Font Standards

### shadcn/ui Components

All UI components should explicitly declare `font-sans`:

```tsx
// Button
"font-sans text-sm font-medium..."

// Input
"font-sans text-base md:text-sm..."

// Card
"font-sans text-sm..."
// CardTitle: "font-sans text-base font-semibold..."

// Dialog
"font-sans text-sm..."
// DialogTitle: "font-sans text-lg font-semibold..."

// Alert
"font-sans text-sm..."
// AlertTitle: "font-sans font-semibold..."

// Table
"font-sans text-sm..."
// TableHead: "font-sans font-semibold..."

// Select, Dropdown, Tabs, etc.
"font-sans text-sm..."
```

## Font Weight Guidelines

| Weight | Value | Usage |
|--------|-------|-------|
| `font-light` | 300 | Large marketing headlines (hero sections) |
| `font-normal` | 400 | Body text, descriptions |
| `font-medium` | 500 | UI elements, buttons, labels |
| `font-semibold` | 600 | Card titles, dialog titles, table headers |
| `font-bold` | 700 | Marketing H3+, strong emphasis |

## Line Height & Spacing

| Element | Line Height | Letter Spacing |
|---------|-------------|----------------|
| Headlines | `leading-tight` (1.25) | `tracking-tight` (-0.025em) |
| Body | `leading-relaxed` (1.625) | Default |
| UI Text | `leading-none` (1) to `leading-normal` (1.5) | Default |
| Code | `leading-normal` (1.5) | Default |

## Accessibility

- **Minimum size**: 16px for body text on mobile
- **Contrast ratio**: 4.5:1 minimum for normal text
- **Line length**: Max 75 characters per line for readability

## Migration Notes

### Before (Inconsistent)
```tsx
// Hardcoded colors, no font strategy
<h1 className="text-4xl font-serif font-bold text-[#0A1628]">
<p className="text-sm text-zinc-500">
```

### After (Standardized)
```tsx
// Using CSS variables and explicit fonts
<h1 className="font-serif text-4xl font-bold text-[var(--text-primary)]">
<p className="font-sans text-sm text-[var(--text-secondary)]">
```

## Implementation Checklist

- [x] Font variables registered in Tailwind theme
- [x] `font-sans` added to all UI components
- [x] `font-serif` used for marketing headings
- [x] `font-mono` used for code/data
- [x] Font weights standardized (300, 400, 500, 600, 700)
- [x] CSS color variables used instead of hardcoded values

## Files Modified

| File | Changes |
|------|---------|
| `app/layout.tsx` | Updated font imports, removed unused `Inter` |
| `app/globals.css` | Added `--font-serif` and `--font-mono` to theme |
| `components/ui/*.tsx` | Added explicit `font-sans` to all components |
| `components/ui/EmptyState.tsx` | Fixed colors to use CSS variables |
| `components/ui/toast-legacy.tsx` | Added `font-sans`, fixed colors |
| `components/ui/collapsible.tsx` | Added `font-sans` with `cn()` utility |
