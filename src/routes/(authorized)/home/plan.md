# Initial interface

```
interface RecentLaptimeItem {
  // Lap time record identifier
  id: string;
  createdAt: Date;

  // Racer info
  racer: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };

  // Laptime data
  laptime: string; // Formatted as MM:SS.mmm
  differenceToFirstMs: number; // Milliseconds difference to 1st place on this track
  
  // Vehicle info
  car: {
    id: string;
    make: string;
    model: string;
    year?: number;
  };

  // Track info
  track: {
    id: string;
    name: string;
  };

  // Track conditions
  conditions: TrackCondition[];
}

type TrackCondition = 'wet' | 'dry' | 'night' | 'snow' | 'fog' | 'rain';
```



src/lib/
├── schemas/              # Zod validation schemas (already exists)
│   ├── laptimeSchema.ts
│   └── ...
├── types/               # TypeScript interfaces (NEW)
│   ├── listings.ts      # All listing item types
│   ├── db.ts            # Database table types
│   └── ...
├── queries/             # Database queries (NEW)
│   ├── laptimes.ts      # Laptime-related queries
│   ├── leaderboard.ts   # Leaderboard queries
│   └── ...
└── ...

src/routes/(authorized)/
├── home/
│   ├── +page.svelte
│   ├── +page.server.ts  # Server load/actions (imports from lib/queries)
│   └── plan.md
├── leaders/
│   ├── +page.svelte
│   └── +page.server.ts
└── ...

Pattern:

src/lib/types/ — Shared TypeScript interfaces (your RecentLaptimeItem goes here)
src/lib/queries/ — Supabase queries as exported functions (e.g., getRecentLaptimes(), getLeaderboard())
src/routes/[page]/+page.server.ts — Calls queries via load() or actions, passes data to page
Page-specific logic — Only stays in the page folder if it's not reused elsewhere