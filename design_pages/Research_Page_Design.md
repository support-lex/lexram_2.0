# LexRam - Research Page Design

## Page: Research
**Dimensions:** 1440×900px  
**Layout:** Same sidebar + main content structure as Dashboard

---

## Header Section
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Research                                                    [Search] [New Query +]│
│  AI-powered legal research assistant                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Elements:
- **Title**: "Research" (Newsreader, 32px, weight 500, #1a1a1a)
- **Subtitle**: "AI-powered legal research assistant" (Inter, 14px, #666666)
- **Search Bar**: "Search case law, statutes, precedents..." (right aligned)
- **Primary Button**: "New Query" with plus icon (dark navy #1e293b, white text)

---

## Main Content Layout

### Left Column (65%) - Recent Research Queries

```
┌──────────────────────────────────────────────────────────┐
│  Recent Queries                                    View all│
├──────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔍 Bail conditions under BNSS S.482                 │  │
│  │    Criminal Law • 14 authorities found • Yesterday │  │
│  │    [View Results] [Save to Case]                   │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔍 Precedents on Section 138 NI Act dishonour     │  │
│  │    Civil Law • 23 authorities found • 2 days ago   │  │
│  │    [View Results] [Save to Case]                   │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔍 Arbitration clause validity in commercial      │  │
│  │    Commercial Law • 8 authorities found • 3 days   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Card Design:**
- Background: #ffffff
- Border: 1px solid #e5e7eb
- Border radius: 12px
- Padding: 20px
- Shadow: 0 1px 3px rgba(0,0,0,0.05)

### Right Column (35%) - Quick Actions & Saved

```
┌─────────────────────────────────────────┐
│  Quick Research                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │  📚 Case Law Search               │  │
│  │  Search judgments & precedents   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  📖 Statute Lookup                │  │
│  │  Browse laws & amendments        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  ⚖️  Compare Provisions           │  │
│  │  Side-by-side law comparison     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Saved Research                         │
├─────────────────────────────────────────┤
│  • Bail Jurisprudence 2024             │
│  • TN Rent Control Act Analysis        │
│  • NI Act Section 138 Compilation      │
│  • BNSS Transition Guide               │
└─────────────────────────────────────────┘
```

---

## Research Query Interface (Modal/Expanded View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  New Research Query                                        [×] Close   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Query Type:  [● Natural Language]  [○ Keyword]  [○ Citation]          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ What are the bail conditions for economic offenses under       │   │
│  │ the new BNSS? Also include precedents from the last 2 years.   │   │
│  │                                                                  │   │
│  │ [AI Assist] ✨                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Filters:                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Court ▼     │  │ Year ▼      │  │ Act ▼       │  │ Bench ▼     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
│              [Cancel]        [Generate Research Report →]              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Color Palette (Inherited from Dashboard)
- **Primary Navy**: #1e293b (sidebar, primary buttons)
- **Background**: #f8fafc (page background)
- **Card White**: #ffffff
- **Text Primary**: #1a1a1a
- **Text Secondary**: #666666
- **Text Muted**: #9ca3af
- **Accent Green**: #10b981 (positive indicators)
- **Accent Amber**: #f59e0b (warnings)
- **Accent Red**: #ef4444 (urgent/overdue)
- **Border**: #e5e7eb

---

## Typography
- **Headings**: Newsreader, weight 500-600
- **Body**: Inter, weight 400-500
- **Labels/Captions**: Inter, 12px, weight 400

---

## Icons (from Lucide)
- Search: `search`
- Plus: `plus`
- Case Law: `book-open`
- Statute: `scale`
- Compare: `git-compare`
- Bookmark: `bookmark`
- Filter: `filter`
- Close: `x`
