# Seed data

**Decided:** Sprint 0 (Decision 2, S3).

**Choice**

- `supabase/seed.sql` creates fake users (`@example.com`), rigs, sessions, laps and a tournament.
- Catalog tables (game, car categories, car makes, cars, tracks, reference times) are copied exactly from the hosted database.
- Locally, log in through Mailpit (see the README).

**Why**

- The repo is public: no real names or emails may be committed.
- The catalog holds no personal data, and using the real rows means local pages look like prod and ids match.
