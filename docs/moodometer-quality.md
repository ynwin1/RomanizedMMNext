# Moodometer quality evaluation (M6)

M6 provides **offline, editor-reviewed evaluation**. Scores are interpretations of Burmese lyrics, **not** objective measurements of emotion or musical audio features.

## Prepare benchmark data
For at least 20 diverse songs, preferably 30–50, generate scores using the admin Moodometer editor. Independently review each song's original Burmese lyrics and English meaning and record one to three acceptable emotional labels. Avoid judging solely from the AI summary.

Create a private JSON file (no production credentials or personal data) with records in this form:

```json
[
  {
    "id": "song-205",
    "expectedMoods": ["romantic", "longing"],
    "predictedMoods": [
      {"moodId":"romantic","score":9.1},
      {"moodId":"longing","score":7.7},
      {"moodId":"hopeful","score":5.0}
    ]
  }
]
```

Run `npm run evaluate:moodometer -- /path/to/cases.json`. This **never calls OpenAI or writes to MongoDB**.

## Metrics and interpretation
- **Expected-mood recall**: fraction of editor-chosen moods present in the AI's top three.
- **Top-mood agreement**: share of songs where the AI's strongest mood is one of the editor-chosen moods.
- **High-score share**: fraction of scores at least 9.0; a share above 60% warns about saturation.
- **Distinct moods and dominant mood share**: spot repetitive category selection; over 75% usage of a single mood warns about overuse.
- **Score standard deviation**: low variation can be a sign of poor calibration, but is not itself evidence of failure.

These thresholds are **review prompts, not acceptance criteria**. Evaluate across different lyrical themes and ensure the benchmark itself has variety. Don't feed editor labels into the same run that produces predictions. Preserve model identifiers and test datasets when comparing prompt or model changes.
