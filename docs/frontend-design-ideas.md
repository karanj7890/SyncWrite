# SyncWrite — Frontend Design Ideas

---

## Overall Aesthetic

**Direction:** Clean, distraction-free, productivity-focused.
Think Notion meets Linear — minimal chrome, generous whitespace, fast interactions.

**Personality:** Professional but warm. Not sterile like Google Docs, not playful like Canva.

---

## Color Palette

### Option A — Slate & Indigo (Recommended)
```
Background:    #F8FAFC  (slate-50)
Surface:       #FFFFFF  (white)
Border:        #E2E8F0  (slate-200)
Text primary:  #0F172A  (slate-900)
Text muted:    #64748B  (slate-500)
Accent:        #6366F1  (indigo-500)
Accent hover:  #4F46E5  (indigo-600)
Danger:        #EF4444  (red-500)
```

### Option B — Warm Neutral & Amber
```
Background:    #FAFAF9  (stone-50)
Surface:       #FFFFFF
Border:        #E7E5E4  (stone-200)
Text primary:  #1C1917  (stone-900)
Text muted:    #78716C  (stone-500)
Accent:        #F59E0B  (amber-500)
Accent hover:  #D97706  (amber-600)
```

### Option C — Dark Mode First
```
Background:    #0F0F0F
Surface:       #1A1A1A
Border:        #2A2A2A
Text primary:  #FAFAFA
Text muted:    #71717A  (zinc-500)
Accent:        #A78BFA  (violet-400)
```

---

## Typography

```
Heading font:  Inter or Geist (system-ui fallback)
Body font:     Inter
Editor font:   "iA Writer Quattro", Georgia, serif  ← makes writing feel premium
Code font:     JetBrains Mono

Scale:
  xs:   12px
  sm:   14px
  base: 16px
  lg:   18px
  xl:   20px
  2xl:  24px
  3xl:  30px
```

---

## Page Layouts

### Document List Page

**Current:** Basic header + grid

**Improved — Sidebar Layout**
```
┌─────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌───────────────────────────────────┐│
│  │          │  │  All Documents          [+ New]   ││
│  │ SyncWrite│  │                                   ││
│  │          │  │  ┌─────────┐ ┌─────────┐         ││
│  │──────────│  │  │  Doc 1  │ │  Doc 2  │         ││
│  │ 📄 Docs  │  │  │         │ │         │         ││
│  │ ⭐ Starred│  │  │ Feb 22  │ │ Feb 21  │         ││
│  │ 🗑 Trash  │  │  └─────────┘ └─────────┘         ││
│  │          │  │                                   ││
│  │          │  │  ┌─────────┐ ┌─────────┐         ││
│  │          │  │  │  Doc 3  │ │  Doc 4  │         ││
│  └──────────┘  └───────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Improved — Dashboard Layout**
```
┌─────────────────────────────────────────────────────┐
│  SyncWrite                              [+ New Doc] │
│─────────────────────────────────────────────────────│
│  Recent                                             │
│  ┌───────────────────────────────────────────────┐  │
│  │ 📄 Project Proposal    edited 2 min ago   →   │  │
│  │ 📄 Meeting Notes       edited 1 hr ago    →   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  All Documents                    [Grid] [List]     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │          │  │          │  │          │          │
│  │  Doc 1   │  │  Doc 2   │  │  Doc 3   │          │
│  │ Feb 22   │  │ Feb 21   │  │ Feb 20   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

---

## DocumentCard Designs

### Style A — Paper Card (Current, improved)
```
┌────────────────────────────────┐
│  📄                            │
│                                │
│  Project Proposal              │
│  Meeting Notes Q1 2026...      │
│                                │
│  Feb 22, 2026          →       │
└────────────────────────────────┘
```
- White card, subtle shadow
- Hover: lift shadow + left blue border strip
- Show a preview of the first line of content

### Style B — Minimal List Row
```
┌────────────────────────────────────────────────────┐
│  📄  Project Proposal          Feb 22    Edit  ··· │
├────────────────────────────────────────────────────┤
│  📄  Meeting Notes             Feb 21    Edit  ··· │
├────────────────────────────────────────────────────┤
│  📄  Untitled                  Feb 20    Edit  ··· │
└────────────────────────────────────────────────────┘
```
- Dense, scannable
- Right-click / `···` for rename, delete

### Style C — Notion-style with Cover Color
```
┌────────────────────────────────┐
│  ██████████████████████████    │  ← random pastel color per doc
│  📄                            │
│  Project Proposal              │
│  Feb 22, 2026                  │
└────────────────────────────────┘
```
- Each doc gets a generated pastel header color based on its ID
- Feels alive even with no content preview

---

## NewDocumentModal Improvements

### Current
Plain input + Create button.

### Improved — Inline Creation
Skip the modal entirely. Click `+ New` → an empty card appears inline in the grid in edit mode:
```
┌────────────────────────────────┐
│  📄                            │
│                                │
│  [  Untitled Document      ]   │  ← inline input
│                                │
│  Press Enter to create         │
└────────────────────────────────┘
```

### Improved — Template Picker Modal
```
┌─────────────────────────────────────────────┐
│  New Document                            ✕  │
│─────────────────────────────────────────────│
│  Title: [________________________]          │
│                                             │
│  Start with a template:                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Blank   │  │ Meeting  │  │  Notes   │  │
│  │          │  │  Notes   │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│                        [Cancel]  [Create →] │
└─────────────────────────────────────────────┘
```

---

## Editor Page Design

### Current
Simple textarea.

### Improved — Focused Writing Mode
```
┌─────────────────────────────────────────────────────┐
│  ← Docs    Project Proposal    [Share]  [···]       │
│─────────────────────────────────────────────────────│
│                                                     │
│                                                     │
│           Project Proposal                          │
│           ───────────────                           │
│                                                     │
│           Start writing here...                     │
│                                                     │
│                                                     │
│─────────────────────────────────────────────────────│
│  234 words · Last saved 2s ago                      │
└─────────────────────────────────────────────────────┘
```
- Max-width content column (~720px) centered on the page
- Large title as editable H1, not in the toolbar
- Status bar at bottom: word count + save status
- Hide all UI on scroll down, reappear on scroll up

### Toolbar (future)
```
│  B  I  U  ~~  │  H1  H2  │  —  "  │  ≡  ·  │
```

---

## Empty States

### No Documents
```
          📄

     No documents yet

  Your documents will appear here.
  Start writing something great.

       [+ Create your first doc]
```

### Loading Skeleton
Instead of "Loading...", show ghost cards:
```
┌────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                │
│  ░░░░░░░░░░░░░░░░              │
│  ░░░░░░░░░                     │
└────────────────────────────────┘
```
Pulse animation using Tailwind `animate-pulse`.

---

## Micro-interactions

| Interaction | Effect |
|---|---|
| Hover card | Slight Y-axis lift (`-translate-y-1`) + shadow increase |
| Click card | Brief scale down (`scale-95`) then navigate |
| Create document | Card fades in with slide-up animation |
| Delete document | Card fades out and collapses |
| Save indicator | "Saving..." → "Saved ✓" in status bar |
| Modal open | Backdrop fade in + modal slide up from bottom |
| Modal close | Reverse: slide down + fade out |

---

## Recommended Implementation Priority

1. **Skeleton loading cards** — instant visual improvement, easy to add
2. **Better empty state** — improves first-run experience
3. **Card hover lift effect** — makes UI feel alive
4. **Editor: centered content column + editable title** — biggest UX win
5. **Status bar (word count + save status)** — editor feels professional
6. **Sidebar layout** — when you add more features (starred, recent, trash)
7. **Dark mode** — toggle using Tailwind `dark:` classes + class strategy

---

## Quick Wins (< 30 min each)

```tsx
// 1. Skeleton card
function DocumentCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  )
}

// 2. Pastel card color from doc ID
function getDocColor(id: string) {
  const colors = ['bg-blue-50','bg-purple-50','bg-green-50','bg-amber-50','bg-pink-50']
  const index = id.charCodeAt(0) % colors.length
  return colors[index]
}

// 3. Hover lift
// Add to DocumentCard button className:
// "hover:-translate-y-1 hover:shadow-md transition-all duration-200"
```