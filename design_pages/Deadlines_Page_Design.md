# LexRam - Deadlines Page Design

## Page: Deadlines
**Dimensions:** 1440×900px  
**Layout:** Sidebar + Calendar view with list sidebar

---

## Header Section
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Deadlines                      [←] Mar 2025 [→]  [Today] [+ Add Deadline]  │
│  Never miss a critical date                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Elements:
- **Title**: "Deadlines" (Newsreader, 32px)
- **Subtitle**: "Never miss a critical date" (Inter, 14px, #666666)
- **Calendar Navigation**: Previous/Next month arrows, month/year display
- **Actions**: "Today" button, "+ Add Deadline" primary button

---

## Summary Stats Bar
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │  3        │ │  8        │ │  12       │ │  5        │ │  2        │     │
│  │  Overdue  │ │  This Week│ │  This Month│ │  Next Month│ │  Completed │    │
│  │  🔴       │ │  🟡       │ │  🔵       │ │  ⚪       │ │  ✅       │     │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Main Layout: Calendar + Side Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────┐ ┌──────────────────┐  │
│  │                                                 │ │  UPCOMING        │  │
│  │         MARCH 2025                              │ │                  │  │
│  │                                                 │ │  ┌──────────────┐│  │
│  │  Su  Mo  Tu  We  Th  Fr  Sa                    │ │  │🔴 TODAY      ││  │
│  │       1   2   3   4   5   6                    │ │  │File Written  ││  │
│  │   7   8   9  10   ●  12  13   ← Today (11th)   │ │  │Statement     ││  │
│  │  14  🟡 16  17  18  19  20   🟡 = Deadline      │ │  │Priya Devi... ││  │
│  │  21  22  23  24  25  26  27   🔴 = Overdue      │ │  │High Court    ││  │
│  │  28  29  30  31                                │ │  │Due: Today    ││  │
│  │                                                 │ │  └──────────────┘│  │
│  │                                                 │ │                  │  │
│  │  ●  3 deadlines    🟡  2 upcoming              │ │  ┌──────────────┐│  │
│  │                                                 │ │  │🟡 TOMORROW   ││  │
│  │  Click a date to view deadlines                │ │  │Submit Evid...││  │
│  │                                                 │ │  │State v. M... ││  │
│  └─────────────────────────────────────────────────┘ │  │Due: Tomorrow ││  │
│                                                      │  └──────────────┘│  │
│                                                      │                  │  │
│                                                      │  ┌──────────────┐│  │
│                                                      │  │ Mar 20       ││  │
│                                                      │  │Appeal Filing ││  │
│                                                      │  │Lakshmi Tex...││  │
│                                                      │  │Due: Mar 20   ││  │
│                                                      │  └──────────────┘│  │
│                                                      │                  │  │
│                                                      │  VIEW BY CASE    │  │
│                                                      │  ┌──────────────┐│  │
│                                                      │  │● Ravi Kumar  ││  │
│                                                      │  │  2 deadlines ││  │
│                                                      │  ├──────────────┤│  │
│                                                      │  │● Lakshmi Te..││  │
│                                                      │  │  3 deadlines ││  │
│                                                      │  ├──────────────┤│  │
│                                                      │  │● Priya Devi  ││  │
│                                                      │  │  1 deadline  ││  │
│                                                      │  └──────────────┘│  │
│                                                      └──────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Calendar Specifications

### Calendar Cell:
- **Size**: ~80px × 80px
- **Background**: white
- **Border**: 1px solid #e5e7eb
- **Today highlight**: Blue border #3b82f6, light blue bg #eff6ff
- **Weekend**: Slight gray bg #f9fafb

### Deadline Indicators on Calendar:
```
┌─────────┐
│    15   │  ← Date number
│         │
│ 🔴🟡🔵  │  ← Colored dots for deadlines
│         │
└─────────┘
```

- **Red dot (#ef4444)**: Overdue
- **Amber dot (#f59e0b)**: Due today/tomorrow
- **Blue dot (#3b82f6)**: Upcoming

---

## Deadline Detail Card (in side panel)

```
┌───────────────────────────────────┐
│ 🔴 OVERDUE / 🟡 DUE SOON / 🔵 UPCOMING  │
├───────────────────────────────────┤
│                                   │
│  File Written Statement           │
│  Priya Devi v. Sundar Corp        │
│  Madras High Court                │
│                                   │
│  Due: Today, 11 Mar 2025          │
│  Priority: HIGH                   │
│                                   │
│  [View Case]  [Mark Complete ✓]   │
│                                   │
└───────────────────────────────────┘
```

---

## Add Deadline Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Add New Deadline                                          [×] Close   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  DEADLINE TITLE*                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ e.g., File Written Statement                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ASSOCIATED CASE*                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Select case...                                             [▼]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  DEADLINE TYPE*          DUE DATE*           DUE TIME (Optional)       │
│  ┌────────────────┐     ┌──────────────┐    ┌────────────────┐        │
│  │ Filing        ▼│     │ 11/03/2025 📅│    │ 11:59 PM     🕐│        │
│  └────────────────┘     └──────────────┘    └────────────────┘        │
│  Types: Filing, Hearing, Submission, Response, Appeal, Other          │
│                                                                         │
│  PRIORITY                                                               │
│  [● High]  [○ Medium]  [○ Low]                                         │
│                                                                         │
│  REMINDER                                                               │
│  [✓] Remind me 1 day before                                            │
│  [✓] Remind me 3 days before                                           │
│  [ ] Remind me 1 week before                                           │
│                                                                         │
│  DESCRIPTION / NOTES                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│              [Cancel]              [Add Deadline →]                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## List View (Alternative to Calendar)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Title                    Case              Type      Due Date    Status    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ File Written Statement  Priya Devi...  Filing    Today      🔴 Overdue│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Submit Evidence List    State v. M...  Filing    Tomorrow   🟡 Urgent │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Appeal Filing Deadline  Lakshmi Te...  Appeal    Mar 20     🔵 Soon   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Reply to Counter        Ravi Kumar..   Response  Mar 22     🔵 Soon   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Cross-Examination Prep  State v. M...  Hearing   Mar 25     ⚪ Later  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Notification Toast (for upcoming deadlines)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔 Reminder: "File Written Statement" is due today              │
│    Priya Devi v. Sundar Corp • Madras High Court               │
│                                              [View] [Dismiss]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Icons
- Calendar: `calendar`
- Clock: `clock`
- Plus: `plus`
- Chevron Left: `chevron-left`
- Chevron Right: `chevron-right`
- Check: `check`
- Alert: `alert-circle`
- Bell: `bell`
- Filter: `filter`
- List: `list`
- Grid: `grid`
- Case: `briefcase`
- Flag: `flag`
