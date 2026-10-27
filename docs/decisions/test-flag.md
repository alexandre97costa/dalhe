# Test flag

**Decided:** Sprint 0 (Decision 3).

**Choice:** keep the `lap_time.for_testing` column and the `GET_TEST_RECORDS` env var. Local `.env` sets `GET_TEST_RECORDS=false`.

**Why**

- With a local database the flag is mostly obsolete, but it's harmless.
- Dropping the column in a migration is riskier than keeping it.
- It may still help when testing the rig endpoints in Sprint 1.
