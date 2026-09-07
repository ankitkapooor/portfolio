# Benchmark report: tagged-transcript-baseline--development--2026-09-07.1

Generated 2026-09-07T09:02:40.485Z.

## Scope

- Method: **Tagged transcript baseline** 1.0.0. Extracts only transcript lines that carry an explicit ACTION: or DECISION: tag, records the line id, and leaves owner and date null.
- Not a measure of human performance, not a commercial product, and not named after any vendor.
- Data mode: recorded-experiment
- Corpus: 2026-09-07.1, 12 cases from the development split. **Every transcript is synthetic.**
- Gold annotations human-reviewed: **no**
- Comparable to the current working tree: yes

## Metrics

There is no overall score. Each measure has its own denominator and they are not commensurable.

| Measure | Value | Denominator |
| --- | --- | --- |
| Action precision | 1.00 | 8 of 8 predicted actions |
| Action recall | 0.24 | 8 of 34 gold actions |
| Action F1 | 0.38 | harmonic mean of the two above |
| Owner accuracy | 0.00 | 0 of 6 matched actions with an explicit gold owner |
| Due-date accuracy | 0.00 | 0 of 1 matched actions with an explicit gold date |
| Invented owners | 0.00 | 0 of 2 matched actions where the gold owner is unknown |
| Dates resolved where gold is unknown | 0.00 | 0 of 7 matched actions where the gold date is unknown |
| Decision status correctness | 0.08 | 1 of 13 matched decisions |
| Citation coverage | 1.00 | 21 of 21 extracted items cite at least one line |
| Citation validity | 1.00 | 21 of 21 referenced line ids exist |
| Citation support | Pending human review | 21 items await a reviewer's judgment |

## Counts

- Cases attempted: 12
- Cases with no gold actions: 1 (reported separately; recall is N/A for these)
- Decisions missed: 4
- Decisions invented: 0
- Decisions incorrectly finalised: 0
- Critical defects: 0
- Matches needing human adjudication: 0

## Cost

- Prototype inference cost per accepted case: **$0.00** (1 accepted of 12 attempted)
- Review-inclusive cost: N/A — no review minutes have been recorded
- Prototype inference cost is not total cost of ownership. It excludes capture, storage, reliability, support, distribution, and integration.

## Latency

- p50 0.03 ms, p95 0.92 ms, observed range 0.02–0.92 ms, n=12
- Nearest-rank percentiles over 12 samples. With a sample this small the p95 is close to the maximum; read the observed range instead of treating p95 as a tail estimate.

## Limitations

- The corpus is synthetic. It was authored for this benchmark and depicts no real meeting.
- Gold annotations are drafts written by a coding agent. No human has reviewed them.
- Citation support is not measured. It requires a reviewer to read each cited passage.
- Twelve cases per split is a small sample. Read the observed range, not the tail estimate.
- No commercial product was tested, and no result here describes any vendor's performance.

## Human review queue

35 items are pending. They are listed in review-queue.json.

| Kind | Count |
| --- | --- |
| gold-annotation | 12 |
| citation-support | 11 |
| match-adjudication | 12 |
