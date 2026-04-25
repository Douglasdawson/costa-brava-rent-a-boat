# CRM Navigation Restructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Flatten 17 grouped tabs into 7 primary flat tabs + "Mas" overflow popover.

**Architecture:** Modify AdminLayout.tsx tab configuration (TAB_CONFIG, ADMIN_TABS, secondaryGroups) to define 7 primary tabs and move 7 rarely-used tabs + owner tabs into a single "Mas" popover. Remove group labels entirely. Update CRMDashboard.tsx tab rendering to redirect removed tabs (reports→dashboard, competition→analytics). No content changes to any tab component.

**Tech Stack:** React, TypeScript, Tailwind, shadcn/ui Popover, lucide-react icons

**Design doc:** `docs/plans/2026-04-25-crm-restructure-design.md`

---

## Task 1: Restructure tab configuration in AdminLayout.tsx

**Files:**
- Modify: `client/src/components/crm/AdminLayout.tsx`

**Step 1: Replace TAB_CONFIG, ADMIN_TABS, OWNER_TABS with new structure**

Replace lines 48-74 (the three tab config arrays) with:

```typescript
// Primary tabs — always visible in the main tab bar
const PRIMARY_TABS = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "bookings", label: "Reservas", icon: Calendar },
  { id: "inquiries", label: "Peticiones", icon: MessageSquare },
  { id: "fleet", label: "Flota", icon: Anchor },
  { id: "analytics", label: "SEO", icon: Search },
  { id: "autopilot", label: "Autopilot", icon: Zap },
];

// Overflow tabs — accessible via "Mas" popover
const OVERFLOW_TABS = [
  { id: "customers", label: "Clientes", icon: Users },
  { id: "maintenance", label: "Mantenimiento", icon: Wrench },
  { id: "inventory", label: "Inventario", icon: Package },
  { id: "gallery", label: "Galeria", icon: Camera },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "giftcards", label: "Regalos", icon: Gift },
  { id: "discounts", label: "Descuentos", icon: Percent },
];

// Owner-only tabs — shown in "Mas" popover for owners
const OWNER_TABS = [
  { id: "employees", label: "Usuarios", icon: Users },
  { id: "config", label: "Config", icon: Settings },
];
```

Note: `reports` is removed (absorbed into dashboard). `seo` (SEO Engine) is removed (absorbed into `analytics` / SEO tab). `competition` is removed (absorbed into SEO). The tab ID `analytics` keeps its current ID to avoid breaking the SEO tab routing.

**Step 2: Replace the tab filtering and grouping logic**

Replace lines 115-159 (everything from `const visiblePrimaryTabs` through the `secondaryGroups` builder) with:

```typescript
  // Filter primary tabs by permissions
  const visiblePrimaryTabs = PRIMARY_TABS.filter(t => canSeeTab(t.id));

  // Overflow: rarely-used tabs + owner tabs
  const overflowTabs = [
    ...OVERFLOW_TABS.filter(t => canSeeTab(t.id)),
    ...(isOwner ? OWNER_TABS : []),
  ];

  // All secondary tab IDs (for "Mas" button active state detection)
  const primaryTabIds = new Set(PRIMARY_TABS.map(t => t.id));
```

**Step 3: Replace the desktop secondary tabs section**

Replace lines 320-348 (the entire `{/* Secondary tabs — desktop grouped layout */}` section) with:

```tsx
        {/* Desktop: "Mas" popover for overflow tabs */}
        {overflowTabs.length > 0 && (
          <div className="hidden md:flex mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap min-w-[44px] ${
                    !primaryTabIds.has(selectedTab)
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="text-sm">
                    {!primaryTabIds.has(selectedTab)
                      ? overflowTabs.find(t => t.id === selectedTab)?.label || "Mas"
                      : "Mas"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="flex flex-col gap-0.5">
                  {overflowTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors w-full text-left min-h-[44px] ${
                        selectedTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      <tab.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
```

**Step 4: Update mobile "Mas" popover**

Replace lines 265-317 (the mobile "Mas" popover section). Change it to use `overflowTabs` instead of `secondaryGroups`, and remove the group labels:

```tsx
          {/* Mobile: "Mas" popover for overflow tabs */}
          {overflowTabs.length > 0 && (
            <div className="flex md:hidden flex-shrink-0">
              <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`flex items-center justify-center gap-1 px-3 py-2 font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-w-[44px] min-h-[44px] ${
                      !primaryTabIds.has(selectedTab)
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    data-testid="tab-more"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="text-xs">
                      {!primaryTabIds.has(selectedTab)
                        ? overflowTabs.find(t => t.id === selectedTab)?.label || "Mas"
                        : "Mas"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(256px,calc(100vw-2rem))] p-2" align="end">
                  <div className="flex flex-col gap-0.5">
                    {overflowTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange(tab.id);
                          setMoreOpen(false);
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors w-full text-left min-h-[44px] ${
                          selectedTab === tab.id
                            ? 'bg-primary text-white'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        data-testid={`tab-${tab.id}`}
                      >
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
```

**Step 5: Clean up unused imports**

Remove `Swords` from lucide-react imports (was only used for Competition tab icon). Keep all other icons as they're used by overflow tabs.

Also remove the old `secondaryTabs` variable reference if any remains.

**Step 6: Commit**

```bash
git add client/src/components/crm/AdminLayout.tsx
git commit -m "refactor(crm): flatten 17 grouped tabs to 7 primary + Mas overflow"
```

---

## Task 2: Update CRMDashboard.tsx tab routing

**Files:**
- Modify: `client/src/components/CRMDashboard.tsx`

**Step 1: Update VALID_TABS**

Remove `reports`, `seo`, and `competition` from VALID_TABS since they're absorbed. Keep their IDs as redirect targets:

```typescript
const VALID_TABS = [
  "dashboard", "calendar", "bookings", "customers", "inquiries",
  "fleet", "maintenance", "inventory", "analytics", "gallery",
  "giftcards", "discounts", "blog", "employees", "config",
  "autopilot",
];

// Redirect absorbed tabs to their new homes
const TAB_REDIRECTS: Record<string, string> = {
  reports: "dashboard",
  seo: "analytics",
  competition: "analytics",
};
```

**Step 2: Apply redirects in tab resolution**

After the line `const rawTab = ...` (line 67), add redirect logic:

```typescript
const resolvedTab = TAB_REDIRECTS[rawTab] || rawTab;
```

Then change all references from `rawTab` to `resolvedTab` in `canAccessTab` and `selectedTab` computation:

```typescript
const selectedTab = canAccessTab(resolvedTab) ? resolvedTab : firstAllowedTab;
```

**Step 3: Remove obsolete tab renders**

Remove these three blocks from the JSX:
- `{selectedTab === "reports" && ( ... )}`
- `{selectedTab === "seo" && ( ... )}`
- `{selectedTab === "competition" && ( ... )}`

**Step 4: Update document.title map**

Remove `reports`, `seo`, `competition` from the titles record. Add/update:
```typescript
analytics: "SEO",
autopilot: "Autopilot",
```

**Step 5: Remove unused imports**

Remove `ReportsTab`, `SeoTab` (the old SEO Engine), and `CompetitionTab` from the imports if they're no longer referenced.

Wait — `SeoTab` is still used (it's the `analytics` tab that contains our SeoDashboard). Keep it. Only remove `ReportsTab` and `CompetitionTab` imports.

**Step 6: Commit**

```bash
git add client/src/components/CRMDashboard.tsx
git commit -m "refactor(crm): update tab routing — redirect absorbed tabs, remove obsolete renders"
```

---

## Task 3: Type check and verify

**Step 1: Run type checker**

```bash
npx tsc --noEmit
```
Expected: 0 errors

**Step 2: Run linter**

```bash
npm run lint
```
Expected: no new errors

**Step 3: Start dev server and verify in browser**

```bash
PORT=4000 npm run dev
```

Open `http://localhost:4000/crm` and verify:
1. 7 flat tabs visible (Dashboard, Calendario, Reservas, Peticiones, Flota, SEO, Autopilot)
2. No group labels (CRM, Flota, Negocio gone)
3. "Mas" popover shows: Clientes, Mantenimiento, Inventario, Galeria, Blog, Regalos, Descuentos, (+ Usuarios, Config for owner)
4. Clicking each tab works
5. URL `/crm/reports` redirects to `/crm/dashboard`
6. URL `/crm/seo` redirects to `/crm/analytics`
7. URL `/crm/competition` redirects to `/crm/analytics`

**Step 4: Commit if any fixes needed**

```bash
git commit -m "fix(crm): address type/lint issues from nav restructure"
```
