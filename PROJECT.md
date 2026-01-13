# Impartial News Aggregator - Project Documentation

## Overview
An automated news aggregation system that uses Claude AI to research and generate unbiased news summaries. The system runs on a two-phase architecture to avoid token limits.

**Live Site**: https://impartial-news.vercel.app/
**GitHub**: https://github.com/cerebusfh/impartial-news

## Architecture

### Deployment
- **Frontend**: Vercel (static HTML hosting)
- **Backend**: Railway (Node.js server with Express)
- **Version Control**: GitHub (auto-deploys to Vercel on push)

### Two-Phase Generation System

#### Phase 1: Research (research-prompt.md)
- Uses Claude Sonnet 4 with web_search tool
- Searches for news from last 24-48 hours across 7 categories
- Outputs structured JSON with headlines, blurbs, and sources
- **Critical**: Includes date verification to avoid outdated stories

#### Phase 2: HTML Generation (html-prompt.md)
- Takes JSON from Phase 1
- Generates complete HTML page using template
- Applies consistent styling with Tailwind CSS

### Token Management
The system has TWO modes to manage Claude API token usage:

**FULL MODE** (Comprehensive):
- Used for: Scheduled daily generation at 6 AM PST
- Search depth: 5-10 searches per category
- Wait time: 7 minutes between phases
- Max tokens: 16,000 for research

**QUICK MODE** (Fast):
- Used for: Manual "Refresh Now" button clicks
- Search depth: 2-3 searches per category  
- Wait time: 2.5 minutes between phases
- Max tokens: 12,000 for research

## Critical Implementation Details

### The generateNews() Parameter Bug
**IMPORTANT**: When editing `generate-news.js`, the manual trigger endpoint MUST use QUICK mode:

```javascript
// HTTP endpoint to trigger manual generation
app.get('/generate', async (req, res) => {
  console.log('Manual generation triggered via HTTP');
  res.json({ status: 'started', message: 'News generation started' });
  
  // Run generation asynchronously - MUST BE TRUE FOR QUICK MODE
  generateNews(true).catch(err => console.error('Generation error:', err));
});
```

**Bug**: When regenerating this file, the `true` parameter often gets dropped, causing expensive FULL searches during testing. Always verify this is set to `true`.

### Editorial Guidelines

#### Story Recency Rules
- **Accept**: Stories from last 24-48 hours with confirmed dates
- **Reject**: Previews, "upcoming" events, or stories >48 hours old
- **Sports**: Only completed games/events, NOT previews

#### Bias Reduction Rules
- Remove politician names (replace with titles: "US President", "Senator")
- Keep athlete/entertainer/business leader names
- Strip emotional language and loaded adjectives
- Use neutral, factual headlines (8-15 words)

#### Story Count Requirements
- **Top Headlines**: 4 stories (important for balanced 2-column layout)
- **All other categories**: 3 stories each

## Known Issues & Constraints

### Issue 1: Duplicate Stories Across Sections
**Problem**: Same topic appears in multiple sections (e.g., Greenland story in both Top Headlines and World News)

**Current Status**: Known issue, accepted tradeoff
**Reason**: Fixing would require complex deduplication logic that increases API calls and search time
**Potential Solution**: Add a deduplication step in Phase 2 (HTML generation) that compares headlines for similarity

### Issue 2: Outdated Stories Still Appearing
**Problem**: Stories from 7+ days ago occasionally slip through despite date filters

**Solution**: Enhanced date verification in research prompt:
- Add explicit date checks in blurbs
- Require "happened yesterday/today/this week" language
- Reject any story without clear recency indicators

### Issue 3: Inflammatory Language
**Problem**: Some headlines contain implied threats or sensational language

**Example**:
- ❌ Bad: "Danish PM Warns... any US attack would end 'everything'"
- ✅ Good: "European Officials Prepare Diplomatic Response to Greenland Tensions"

**Solution**: Add stronger neutral language requirements:
- No direct quotes with threatening implications
- Focus on factual diplomatic actions, not warnings
- Prefer "responds to" over "warns against"

## Design Goals

### Current Design
- Clean, minimal layout with Tailwind CSS
- Blue/indigo color scheme
- Card-based story presentation
- Responsive grid (2 columns for headlines, 3 for other sections)

### Requested Improvements
1. **Typography**: More newspaper-like (NY Times style)
   - Consider: Georgia/Times New Roman serif fonts
   - Larger headlines with proper hierarchy
   - Better line spacing and readability

2. **Layout**: More traditional newspaper feel
   - Column-based instead of cards
   - Horizontal rules between stories
   - Date/time prominence

## File Structure

```
impartial-news/
├── index.html              # Generated output (deployed to Vercel)
├── generate-news.js        # Main backend server (Railway)
├── research-prompt.md      # Phase 1 instructions for Claude
├── html-prompt.md          # Phase 2 instructions for Claude
├── package.json           # Node dependencies
├── Dockerfile             # Railway deployment config
├── .railwayignore         # Exclude files from Railway
└── README.md              # Basic project info
```

## Environment Variables

### Railway (Backend)
- `ANTHROPIC_API_KEY`: Claude API key
- `GITHUB_TOKEN`: For pushing generated HTML to repo
- `PORT`: Server port (default 3000)

### GitHub Secrets
- `GITHUB_TOKEN`: Repository access for commits

## Development Workflow

1. Edit prompt files or generate-news.js locally
2. Test with manual generation button (uses QUICK mode)
3. Commit and push to GitHub
4. Railway auto-deploys backend
5. Backend pushes updated index.html to GitHub
6. Vercel auto-deploys frontend

## Testing Checklist

Before any generation:
- [ ] Verify `generateNews(true)` in /generate endpoint
- [ ] Check research-prompt.md has current date placeholders
- [ ] Ensure 4 stories configured for top_headlines
- [ ] Review editorial guidelines for bias reduction
- [ ] Test with QUICK mode first before FULL mode

## Future Enhancement Ideas

### Content Quality
- [ ] Better deduplication logic
- [ ] Source diversity scoring
- [ ] Fact-checking indicators
- [ ] Related stories linking

### UI/UX
- [ ] Dark mode support
- [ ] Category filtering
- [ ] Search functionality
- [ ] Story bookmarking
- [ ] Archive of past days

### Infrastructure
- [ ] Better error handling/retry logic
- [ ] Monitoring and alerting
- [ ] Performance metrics
- [ ] Rate limit tracking dashboard

## Contact & Support

- **Developer**: cerebusfh
- **Claude Model**: claude-sonnet-4-20250514
- **Last Updated**: January 2026

## Cost Management

### The January 9, 2026 Incident

On January 9th, the system consumed approximately **22.5 million tokens** ($60-80) in a single day due to:
- 473 web searches (normal is ~10-30 per run)
- Multiple generation runs (likely ~19 attempts)
- Web search results consuming massive tokens

This incident led to implementing strict cost controls.

### Current Cost Structure

**Estimated Costs Per Run:**
- QUICK mode: ~$0.30 (8-10 searches, Haiku for HTML)
- FULL mode: ~$0.50 (20-30 searches, Haiku for HTML)

**Expected Monthly Costs:**
- Daily cron job (FULL mode): $0.50/day × 30 = **$15/month**
- Manual refreshes (rate limited): $0.30 × 5/month = **$1.50/month**
- **Total: ~$16-20/month**

### Cost Reduction Measures Implemented

#### 1. Rate Limiting
- **Manual /generate endpoint**: Max 1 request per hour
- **Scheduled cron job**: Max 1 request per 24 hours
- Prevents concurrent runs
- Returns clear error messages when rate limited

#### 2. Token Usage Reduction
- Switched HTML generation from Sonnet to **Haiku** (5x cheaper)
- Reduced max_tokens: QUICK=8k, FULL=12k (from 12k/16k)
- QUICK mode: Max 10 total searches (from unlimited)
- QUICK mode: Reduced story counts (3/2/2 vs 4/3/3)

#### 3. Usage Logging System
- All generation attempts logged to `usage-log.txt` and `usage-log.json`
- Tracks: timestamp, mode, success/failure, estimated cost
- Cost summary available via `/costs` endpoint
- Displayed on server startup

#### 4. Model Selection
- **Research phase**: Sonnet 4.5 (needs quality for web search analysis)
- **HTML generation**: Haiku 4.5 (simple template filling, 5x cheaper)

### Monitoring

**Check costs regularly:**
```bash
# Via API endpoint
curl https://impartial-news-production.up.railway.app/costs

# Via Anthropic Console
https://console.anthropic.com/settings/usage
```

**Review logs:**
```bash
# On Railway, check:
cat usage-log.txt
```

### Spending Alerts

**Set up in Anthropic Console:**
1. Go to Settings → Billing
2. Set monthly limit: $20
3. Enable email alerts at 50%, 80%, 100%

### If Costs Spike Again

**Immediate actions:**
1. Check Railway logs for error loops or retries
2. Verify rate limiting is working
3. Check `/health` endpoint for unusual activity
4. Review `usage-log.json` for patterns

**Long-term solutions:**
- Cache generated news for 6-12 hours
- Implement smarter search result reuse
- Consider alternative news APIs instead of web search

### Cost Optimization Roadmap

**Phase 1 (Completed):**
- ✅ Rate limiting
- ✅ Usage logging
- ✅ Haiku for HTML
- ✅ Reduced token limits

**Phase 2 (Future):**
- [ ] Cache news data (reduce regenerations)
- [ ] Smart search result reuse across categories
- [ ] Implement story deduplication
- [ ] Consider RSS feeds or news APIs as supplementary sources

**Phase 3 (Future):**
- [ ] A/B test Haiku for research phase (quality vs cost tradeoff)
- [ ] Implement tiered generation (light/medium/full)
- [ ] Add cost prediction before generation
- [ ] User-facing cost transparency
