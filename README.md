# campus-job-collection

Collected campus recruiting job postings and source exports.

## Current data

- `exports/2026-03-19-qq-docs-campus-jobs.md`: Exported from a public QQ Docs sheet that tracks 2026 spring recruiting updates.
- `collections/2026-03-19-open-campus-jobs.md`: 40 open campus jobs collected from official public job pages on 2026-03-19.
- `collections/2026-03-19-open-campus-jobs.json`: Same dataset in JSON format.

## Notes

- This repository currently stores text-first exports for easier search, diffing, and later processing.
- Source formatting, images, comments, and some rich text details may not be preserved in the Markdown export.

## Scripts

- `scripts/fetch_open_jobs.mjs`: Collects a snapshot of open campus jobs from official public pages and writes Markdown + JSON outputs into `collections/`.
