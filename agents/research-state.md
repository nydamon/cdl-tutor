# CDL State Research Agent

## Mission
Research the CDL written test requirements for a specific US state.

## Input
- State: [STATE_CODE] (e.g., "NJ", "CA", "TX")
- State Name: [STATE_NAME] (e.g., "New Jersey")

## Research Tasks

### 1. Find Official DMV/State CDL Handbook
- Locate the official state CDL handbook (usually PDF on state DMV website)
- Note the URL and last updated date

### 2. Test Topics Coverage
For each topic, identify:
- Number of practice questions in official materials
- Key subtopics emphasized
- Any unique state-specific rules

**Required Topics:**
- General Knowledge (Class A/B/C basics)
- Air Brakes (if applicable)
- Combination Vehicles
- Hazardous Materials
- Passenger Transport (if Class C with P endorsement)
- School Bus (if S endorsement)
- Tanker Vehicles

### 3. Extract Sample Questions (5-10 per topic)
- Copy actual test questions
- Note the correct answer
- Explain WHY that answer is correct

### 4. State-Specific Rules
- Any unique road rules for CDL drivers in this state?
- Specific testing requirements?
- Any exceptions or special permits?

### 5. Memorization Requirements
- What numbers MUST be memorized?
- PSI thresholds
- Distance requirements
- Weight limits
- Age requirements

## Output Format (JSON)
```json
{
  "state": "[CODE]",
  "state_name": "[NAME]",
  "handbook_url": "[URL]",
  "last_updated": "[DATE]",
  "topics": [
    {
      "topic": "general_knowledge",
      "question_count": 50,
      "sample_questions": [
        {
          "question": "...",
          "options": ["A...", "B...", "C...", "D..."],
          "correct_answer": "B",
          "explanation": "..."
        }
      ],
      "must_memorize": ["60 PSI", "4 seconds"]
    }
  ],
  "state_specific_rules": ["..."],
  "test_tips": ["..."]
}
```

## Output Location
Save to: `data/states/[STATE].json`

Example: `data/states/NJ.json`
