# LexRam - Documents Page Design

## Page: Documents
**Dimensions:** 1440×900px  
**Layout:** Sidebar + Main content with grid view and list view toggle

---

## Header Section
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Documents                      [Grid ▼]  [Search] [Filter] [+ Upload Doc]  │
│  Centralized document repository                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Elements:
- **Title**: "Documents" (Newsreader, 32px)
- **Subtitle**: "Centralized document repository" (Inter, 14px, #666666)
- **View Toggle**: Grid/List selector (left side)
- **Actions**: Search bar, Filter button, "+ Upload Document" primary button

---

## Storage Stats Bar
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Storage Used: 2.4 GB of 10 GB                                    │   │
│  │  [████████████████░░░░░░░░░░░░░░░░░░░░░░░░] 24%                   │   │
│  │                                                                     │   │
│  │  156 Documents  |  42 PDFs  |  23 Word  |  12 Images  |  79 Others │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Folder Navigation (Breadcrumb + Quick Folders)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  All Documents > Criminal Cases > Ravi Kumar v. State                    │   │
│                                                                             │
│  Quick Access:  [📁 All] [⭐ Starred] [📤 Recent] [🗑️ Trash]              │
│                                                                             │
│  Folders:  [📁 Criminal Cases] [📁 Civil Matters] [📁 Contracts]          │
│            [📁 Research] [📁 Client Correspondence] [+ New Folder]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Grid View (Default)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    📄        │  │    📄        │  │    📝        │  │    📊        │    │
│  │   (preview)  │  │   (preview)  │  │   (icon)     │  │   (icon)     │    │
│  │              │  │              │  │              │  │              │    │
│  │ Bail App...  │  │ FIR_Copy...  │  │ Witness_...  │  │ Evidence_... │    │
│  │ PDF • 2.3 MB │  │ PDF • 1.8 MB │  │ DOC • 450 KB │  │ XLS • 890 KB │    │
│  │ Modified:    │  │ Modified:    │  │ Modified:    │  │ Modified:    │    │
│  │ 2 days ago   │  │ 1 week ago   │  │ 3 days ago   │  │ Yesterday    │    │
│  │              │  │              │  │              │  │              │    │
│  │ ⭐    [⋯]    │  │      [⋯]     │  │      [⋯]     │  │      [⋯]     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    📄        │  │    🖼️        │  │    📄        │  │    📁        │    │
│  │   (preview)  │  │   (thumb)    │  │   (preview)  │  │   (folder)   │    │
│  │              │  │              │  │              │  │              │    │
│  │ Charge_S...  │  │ Photo_E...   │  │ Counter_A... │  │ Case_Files   │    │
│  │ PDF • 3.1 MB │  │ JPG • 2.5 MB │  │ PDF • 1.2 MB │  │ 12 items     │    │
│  │ Modified:    │  │ Modified:    │  │ Modified:    │  │ Modified:    │    │
│  │ 2 weeks ago  │  │ 5 days ago   │  │ Today        │  │ 1 week ago   │    │
│  │              │  │              │  │              │  │              │    │
│  │      [⋯]     │  │      [⋯]     │  │ ⭐    [⋯]    │  │      [⋯]     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Card Specifications:
- **Size**: 220px × 240px
- **Background**: #ffffff
- **Border**: 1px solid #e5e7eb
- **Border radius**: 12px
- **Preview area**: 220px × 140px (light gray #f3f4f6 background)
- **Icon size**: 48px for file type icons
- **Title**: 14px, single line, ellipsis overflow
- **Meta**: 12px, #6b7280

---

## List View (Alternative)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Name                    Type    Size      Modified         Case      Action│
│  ─────────────────────────────────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Bail Application.pdf  PDF    2.3 MB   2 days ago    Ravi Kumar ⋮  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 📄 FIR Copy.pdf          PDF    1.8 MB   1 week ago    Ravi Kumar ⋮  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 📝 Witness Questions.docx DOC   450 KB   3 days ago    Ravi Kumar ⋮  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 Evidence List.xlsx    XLS    890 KB   Yesterday     Ravi Kumar ⋮  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Upload Document Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Upload Document                                           [×] Close   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │                    📤 Drag & Drop Files Here                   │   │
│  │                        or click to browse                      │   │
│  │                                                                 │   │
│  │         Supports: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG          │   │
│  │                     Max file size: 50MB                        │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  OR                                                                     │
│                                                                         │
│  📎 Paste a link to import from cloud storage (Google Drive, Dropbox)  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ https://...                                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  DOCUMENT DETAILS                                                       │
│  Document Name*                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Bail Application                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Associate with Case (Optional)                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Select case...                                             [▼]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Tags                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Add tags...                                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  [Bail] [Criminal] [Urgent] [x]                                        │
│                                                                         │
│  Description                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│              [Cancel]              [Upload Document →]                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Type Icons/Colors
| Type | Icon | Color |
|------|------|-------|
| PDF | `file-text` | #ef4444 (red) |
| Word | `file-text` | #3b82f6 (blue) |
| Excel | `file-spreadsheet` | #10b981 (green) |
| Image | `image` | #f59e0b (amber) |
| Folder | `folder` | #6366f1 (indigo) |

---

## Document Preview Panel (Side View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Bail Application.pdf                      [×] [⬇️] [✏️] [🗑️]           │
│  PDF • 2.3 MB • Uploaded 2 days ago                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │                    📄 PDF PREVIEW                              │   │
│  │                                                                 │   │
│  │                    Page 1 of 12                                │   │
│  │                                                                 │   │
│  │              [◀ Previous]    [1] [2] [3] ... [12]   [Next ▶]   │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  DOCUMENT DETAILS                                                       │
│  ─────────────────────────────────────────────────────────────────────  │
│  Associated Case: Ravi Kumar v. State of TN                            │
│  Tags: Bail, Criminal, Urgent                                          │
│  Description: Bail application filed under Section 439 Cr.P.C.         │
│  Last Modified: 10 Mar 2025, 2:30 PM                                   │
│  Uploaded by: Adv. Sharma                                              │
│                                                                         │
│  AI ANALYSIS                                      [✨ Generate Summary] │
│  ─────────────────────────────────────────────────────────────────────  │
│  This document is a bail application for an economic offense          │
│  under the BNSS. Key points: Grounds for bail, Surety details,       │
│  Previous case history...                                              │
│  [View Full Analysis →]                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Icons
- Upload: `upload-cloud`
- Folder: `folder`
- File: `file`
- PDF: `file-text`
- Image: `image`
- Spreadsheet: `table`
- Word: `file-type-2`
- Star: `star`
- More: `more-vertical`
- Download: `download`
- Edit: `edit-2`
- Trash: `trash-2`
- Search: `search`
- Filter: `filter`
- Grid: `layout-grid`
- List: `list`
