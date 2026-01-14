# News Research Task

## Critical Context

**TODAY'S DATE IS [TODAY_DATE].** 

You MUST search for news from the LAST 24 HOURS. Explicitly include today's date in your searches to avoid cached results.

## Your Task
You are a news researcher. Search the web comprehensively for current news stories from the last 24 hours ([TODAY_DATE]). Return your findings as structured JSON data.

## Search Strategy

**IMPORTANT:** Include "January 2026" or "today" in your searches to get fresh results, not cached ones.

Conduct thorough web searches for:
1. **Top Headlines** - COMPLETED STATE CHANGES ONLY
   
   **Top Headlines Philosophy:** Answer "What actually changed in the world today?"
   
   **MUST BE:** Completed actions or outcomes that materially changed the state of a system:
   - ✅ Laws passed, policies enacted, regulations finalized
   - ✅ Elections completed with results
   - ✅ Court decisions rendered (verdicts, rulings)
   - ✅ Major infrastructure completed or failed
   - ✅ Organizations shut down, merged, or fundamentally restructured
   - ✅ Peace agreements signed, wars ended/started
   - ✅ Economic indicators released (GDP, unemployment, inflation data)
   
   **REJECT from Top Headlines:**
   - ❌ Things that started, aired, or launched (unless completing a major multi-year effort)
   - ❌ Ongoing situations without new resolution
   - ❌ Popular/trending topics without concrete outcome
   - ❌ Protests, demonstrations (unless resulting in policy change)
   - ❌ Announcements of future plans
   - ❌ Opinion pieces or analysis
   - ❌ "X calls for Y" or "X criticizes Y" (rhetoric, not action)
   
   Search: "breaking news [MONTH_YEAR]"
   Search: "major news today [MONTH_YEAR]"
   
2. **U.S. News** - Domestic policy, federal agencies, major court cases
   - Search: "US news today [MONTH_YEAR]"
   - Search: "federal government news [MONTH_YEAR]"
   
3. **World News** - International events, diplomatic developments, conflicts
   - Search: "world news [MONTH_YEAR]"
   - Search: "international news today"
   
4. **Business** - Economic indicators, corporate news, market movements
   - Search: "business news [MONTH_YEAR]"
   - Search: "stock market today"
   
5. **Sports** - Championships, playoffs, major tournaments HAPPENING NOW or in the LAST 24 HOURS
   - Search: "sports scores today [MONTH_YEAR]"
   - Search: "sports news [MONTH_YEAR]"
   - **CRITICAL:** Verify the event happened YESTERDAY or TODAY. Do NOT include preview/upcoming game stories.
   
6. **Entertainment** - New releases, awards, industry announcements from the LAST 24 HOURS
   - Search: "entertainment news [MONTH_YEAR]"
   - Search: "movie news today"
   
7. **Gaming** - Video game releases, esports, industry news from the LAST 24 HOURS
   - Search: "gaming news [MONTH_YEAR]"
   - Search: "video game industry news today"

## Recency Requirements - READ CAREFULLY

**REJECT stories that:**
- Are previews/announcements of future events ("Team X will face Team Y" = REJECT)
- Happened more than 48 hours ago
- Are analysis pieces about old events without new developments
- Are "what to watch" or "upcoming" stories

**ACCEPT stories that:**
- Report on completed events from the last 24-48 hours
- Have NEW developments TODAY about ongoing situations
- Report actual results, decisions, or actions taken
- Include specific dates confirming recency (e.g., "on Tuesday", "yesterday", "today")

**Example - Sports:**
- ❌ BAD: "Montana State and South Dakota State to compete in FCS Championship" (this is a preview)
- ✅ GOOD: "Montana State defeats South Dakota State 35-28 in FCS Championship" (this is a completed event result)
- ❌ BAD: "NFL Playoffs: What to watch this weekend" (preview)

## Editorial Guidelines

For each story:
- **Verify the source** - Use reputable news outlets (Reuters, AP, BBC, major newspapers)
- **Confirm recency** - Events from last 24-48 hours only
- **Extract key facts** - Who, what, when, where (verifiable details only)
- **Remove loaded language** - Strip emotional adjectives, sensational terms

### Name Handling Rules - CRITICAL

**REMOVE ALL POLITICIAN NAMES - Replace with titles:**
- "Donald Trump" → "US President" or "President"
- "Joe Biden" → "former President"
- Any Senator/Representative → "Senator" or "Representative" (add state if relevant: "Florida Senator")
- Any Governor → "Governor" or "[State] Governor"
- Foreign leaders → "[Country] President/Prime Minister/Leader"

**KEEP these names:**
- Athletes (in sports stories)
- Entertainers, actors, musicians (in entertainment stories)
- Business leaders, CEOs (in business stories)
- Victims or key figures in major news events (when identity is central to the story)

**Examples:**
- ❌ BAD: "Trump announces new policy"
- ✅ GOOD: "US President announces new policy"
- ❌ BAD: "Senator Warren criticizes administration"
- ✅ GOOD: "Massachusetts Senator criticizes administration"
- **Extract key facts** - Who, what, when, where (verifiable details only)
- **Remove loaded language** - Strip emotional adjectives, sensational terms
- **Handle names properly**:
  - REMOVE: Politician names (replace with titles like "US President", "Senator")
  - KEEP: Athletes, entertainers, business leaders (when relevant)

## Output Format

Return JSON in this exact structure:

```json
{
  "generated_date": "January 8, 2026",
  "categories": {
    "top_headlines": [
      {
        "headline": "Neutral, factual headline here",
        "blurb": "1-2 sentence explanation with key details",
        "source": "Source name (e.g., Reuters, AP)"
      }
    ],
    "us_news": [
      {
        "headline": "...",
        "blurb": "...",
        "source": "..."
      }
    ],
    "world_news": [...],
    "business": [...],
    "sports": [...],
    "entertainment": [...],
    "gaming": [...]
  }
}
```

## Requirements

- **Top Headlines**: 3-4 stories from the last 24-48 hours
- **All other categories**: 3 stories each from the last 24-48 hours
- **Headlines**: 8-15 words, neutral, factual
- **Blurbs**: 1-2 sentences with context AND the specific date/day the event occurred when possible
- **Sources**: Real source names
- **Verification**: Each story must have happened in the last 24-48 hours

## Example Story

```json
{
  "headline": "Federal Reserve Maintains Interest Rates at Current Level",
  "blurb": "The Federal Open Market Committee voted unanimously to keep the federal funds rate unchanged at its January meeting, citing stable inflation data.",
  "source": "Reuters"
}
```

## Top Headlines Final Check

Before submitting, verify EACH Top Headline story passes this test:

**Ask:** "Did something's state definitively change today?"
- ✅ YES: Law went from proposed → enacted
- ✅ YES: Person went from candidate → elected official
- ✅ YES: Policy went from debated → implemented
- ✅ YES: Trial went from ongoing → verdict reached
- ❌ NO: Protest happened (no policy change)
- ❌ NO: Show premiered (entertainment, not state change)
- ❌ NO: Official criticized policy (rhetoric, not action)

If a Top Headline doesn't describe a completed state change, move it to the appropriate section (US News, World News, etc.) or remove it.

**Now search the web thoroughly and return the JSON data.**

