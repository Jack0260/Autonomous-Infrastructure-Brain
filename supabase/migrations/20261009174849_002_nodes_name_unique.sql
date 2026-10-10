/*
# Add unique constraint on nodes.name

1. Modified Tables
- `nodes`: added UNIQUE constraint on `name` column to support ON CONFLICT upserts.
2. Security: No changes.
*/

ALTER TABLE nodes ADD CONSTRAINT nodes_name_unique UNIQUE (name);
