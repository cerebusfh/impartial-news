const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Vercel domain
app.use(cors());
app.use(express.json());

// Initialize Claude
console.log('Checking for ANTHROPIC_API_KEY...');
console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'cerebusfh';
const GITHUB_REPO = 'impartial-news';
const FILE_PATH = 'index.html';

// Conversation storage for interactive queries
const conversations = new Map(); // queryId → { query, result, conversationHistory, timestamp, status }
const CONVERSATION_EXPIRY_MS = 3600000; // 1 hour
const MAX_CONVERSATIONS = 1000; // Hard cap to prevent memory leak

// Rate limiting for user queries
const queryLimits = new Map(); // ip → [timestamps]
const MAX_QUERIES_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 600000; // 10 minutes

// Read prompts from files
function getResearchPrompt(quickMode = false) {
  let prompt = fs.readFileSync('./research-prompt.md', 'utf8');
  
  // Replace date placeholders with actual current date
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const monthYear = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long'
  });
  
  prompt = prompt
    .replace(/\[TODAY_DATE\]/g, dateString)
    .replace(/\[MONTH_YEAR\]/g, monthYear);
  
  // Add quick mode instruction if enabled
  if (quickMode) {
    prompt += '\n\n---\n\n**🚨 QUICK MODE ACTIVE 🚨**\n\n**RATE LIMIT STRATEGY:**\n- Perform ONLY 1 search per category (7 searches TOTAL)\n- Use ONLY the "Primary" search query listed for each category\n- Work SEQUENTIALLY: Do one search, analyze results, document findings, THEN move to next category\n- DO NOT batch multiple searches rapidly - space them out by analyzing thoroughly between searches\n- This pacing helps avoid hitting the 30k tokens/minute rate limit\n\n**Process for each category:**\n1. Perform the primary search for the category\n2. Review and analyze the search results carefully\n3. Select the best stories from those results\n4. Document your selections with reasoning\n5. Then move to the next category\n\nWork with the limited data you find from these 7 searches.';
  }
  
  return prompt;
}

function getHtmlPrompt() {
  return fs.readFileSync('./html-prompt.md', 'utf8');
}

// Push file to GitHub using API
async function pushToGitHub(content) {
  try {
    console.log('Pushing to GitHub...');
    
    // Get current file SHA (required for updating)
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'News-Generator-Bot'
        }
      }
    );
    
    let sha = null;
    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json();
      sha = fileData.sha;
    }
    
    // Update file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'News-Generator-Bot'
        },
        body: JSON.stringify({
          message: `Update news - ${new Date().toISOString()}`,
          content: Buffer.from(content).toString('base64'),
          sha: sha,
          branch: 'main'
        })
      }
    );
    
    if (updateResponse.ok) {
      console.log('Successfully pushed to GitHub!');
    } else {
      const error = await updateResponse.text();
      console.error('GitHub API error:', error);
    }
    
  } catch (error) {
    console.error('Error pushing to GitHub:', error.message);
  }
}

// STEP 1: Research and gather news stories
async function researchNews(quickMode = false) {
  console.log(`STEP 1: Researching news stories... (${quickMode ? 'QUICK' : 'FULL'})`);
  
  try {
    const researchPrompt = getResearchPrompt(quickMode);
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: quickMode ? 12000 : 16000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search'
        }
      ],
      messages: [
        {
          role: 'user',
          content: researchPrompt
        }
      ]
    });
    
    console.log('Research complete. Content blocks:', message.content.length);
    
    // Find the JSON in the response
    let newsData = '';
    for (let i = 0; i < message.content.length; i++) {
      if (message.content[i].type === 'text') {
        const text = message.content[i].text;
        
        // Look for JSON (either wrapped in code blocks or raw)
        if (text.includes('{') && text.includes('"categories"')) {
          newsData = text;
          console.log('Found news data in block:', i);
          break;
        }
      }
    }
    
    // Extract JSON from markdown code blocks if present
    if (newsData.includes('```json')) {
      newsData = newsData.split('```json')[1].split('```')[0].trim();
    } else if (newsData.includes('```')) {
      newsData = newsData.split('```')[1].split('```')[0].trim();
    }
    
    const parsedData = JSON.parse(newsData);
    console.log('Parsed news data:', Object.keys(parsedData.categories).length, 'categories');
    
    return parsedData;
    
  } catch (error) {
    console.error('Error in research phase:', error);
    throw error;
  }
}

// STEP 2: Generate HTML from research data (using template - NO API CALL!)
function generateHtml(newsData) {
  console.log('STEP 2: Generating HTML from template (no API call)...');

  try {
    // Read the HTML template
    const template = fs.readFileSync('./template.html', 'utf8');

    // Helper function to create story HTML
    const createStoryHtml = (story, isTopHeadline = false) => {
      const headlineClass = isTopHeadline ? 'headline top-headline' : 'headline';
      return `                <article class="news-story">
                    <h3 class="${headlineClass}">${story.headline}</h3>
                    <p class="blurb">${story.blurb}</p>
                    <p class="source">${story.source}</p>
                </article>`;
    };

    // Generate HTML for each category
    const topHeadlines = newsData.categories.top_headlines
      .map(story => createStoryHtml(story, true))
      .join('\n');

    const usNews = newsData.categories.us_news
      .map(story => createStoryHtml(story))
      .join('\n');

    const worldNews = newsData.categories.world_news
      .map(story => createStoryHtml(story))
      .join('\n');

    const business = newsData.categories.business
      .map(story => createStoryHtml(story))
      .join('\n');

    const sports = newsData.categories.sports
      .map(story => createStoryHtml(story))
      .join('\n');

    const entertainment = newsData.categories.entertainment
      .map(story => createStoryHtml(story))
      .join('\n');

    const gaming = newsData.categories.gaming
      .map(story => createStoryHtml(story))
      .join('\n');

    // Format dates
    const date = newsData.generated_date || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Replace all placeholders in template
    let htmlContent = template
      .replace(/\{\{DATE\}\}/g, date)
      .replace(/\{\{TIMESTAMP\}\}/g, timestamp)
      .replace('{{TOP_HEADLINES}}', topHeadlines)
      .replace('{{US_NEWS}}', usNews)
      .replace('{{WORLD_NEWS}}', worldNews)
      .replace('{{BUSINESS}}', business)
      .replace('{{SPORTS}}', sports)
      .replace('{{ENTERTAINMENT}}', entertainment)
      .replace('{{GAMING}}', gaming);

    console.log('HTML generation complete (template-based). Length:', htmlContent.length);

    return htmlContent;

  } catch (error) {
    console.error('Error in HTML generation phase:', error);
    throw error;
  }
}

// Rate limiting helper
function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = queryLimits.get(ip) || [];
  const recentQueries = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recentQueries.length >= MAX_QUERIES_PER_WINDOW) {
    return false; // Rate limited
  }

  recentQueries.push(now);
  queryLimits.set(ip, recentQueries);
  return true;
}

// Process user query with Claude
async function processUserQuery(queryId, userQuery, conversationHistory = []) {
  console.log(`Processing query ${queryId}: "${userQuery}"`);

  try {
    // Build prompt with editorial guidelines for unbiased reporting
    let prompt = `You are an impartial news researcher. A user has asked: "${userQuery}"

Search the web for factual, recent information (last 24-48 hours preferred, but go back further if needed for context).

CRITICAL EDITORIAL RULES - Follow these strictly:
1. NEUTRAL LANGUAGE: No sensational verbs (warns, slams, threatens, blasts)
2. FACTUAL REPORTING: State what happened, not opinions or speculation
3. REMOVE POLITICIAN NAMES: Use titles only (US President, Senator, Prime Minister)
4. KEEP OTHER NAMES: Athletes, entertainers, business leaders, victims can be named
5. NO INFLAMMATORY QUOTES: Avoid quotes that contain threats or warnings
6. INCLUDE SOURCES: List 2-3 reputable sources (Reuters, AP, BBC, NPR preferred)
7. DATE VERIFICATION: Confirm and mention when events occurred

`;

    // Add conversation context if this is a follow-up
    if (conversationHistory.length > 0) {
      prompt += `\nPrevious conversation context:\n`;
      conversationHistory.slice(-5).forEach((exchange, idx) => {
        prompt += `Q${idx + 1}: ${exchange.query}\nA${idx + 1}: ${exchange.summary}\n\n`;
      });
      prompt += `Now answering the follow-up question: "${userQuery}"\n\n`;
    }

    prompt += `Return your response as JSON in this exact format:
{
  "headline": "Neutral 8-15 word headline describing what happened",
  "summary": "2-3 paragraph factual summary with dates and context. Remove politician names and use neutral language throughout.",
  "sources": ["Source Name 1", "Source Name 2", "Source Name 3"],
  "last_updated": "Description of when the latest information is from (e.g., 'January 9, 2026' or 'Last 24 hours')",
  "related_topics": ["Related Topic 1", "Related Topic 2"]
}

Return ONLY the JSON, no other text.`;

    // Call Claude API with web search
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search'
        }
      ],
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    console.log(`Query ${queryId}: Claude response received, ${message.content.length} content blocks`);

    // Extract JSON from response
    let resultText = '';
    for (const block of message.content) {
      if (block.type === 'text') {
        resultText += block.text;
      }
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonText = resultText;
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    const result = JSON.parse(jsonText);

    // Clean citation markers from Claude's web_search tool (e.g., <cite index="4-2">)
    const cleanCitations = (text) => {
      if (!text) return text;
      return text.replace(/<cite[^>]*>/gi, '').replace(/<\/cite>/gi, '');
    };

    // Clean all text fields
    result.headline = cleanCitations(result.headline);
    result.summary = cleanCitations(result.summary);
    result.last_updated = cleanCitations(result.last_updated);

    if (result.sources && Array.isArray(result.sources)) {
      result.sources = result.sources.map(s => cleanCitations(s));
    }

    if (result.related_topics && Array.isArray(result.related_topics)) {
      result.related_topics = result.related_topics.map(t => cleanCitations(t));
    }

    // Update conversation store
    const conversation = conversations.get(queryId);
    if (conversation) {
      conversation.result = result;
      conversation.status = 'complete';
      conversation.conversationHistory.push({
        query: userQuery,
        ...result
      });
      conversations.set(queryId, conversation);
    }

    console.log(`Query ${queryId}: Complete - "${result.headline}"`);
    return result;

  } catch (error) {
    console.error(`Error processing query ${queryId}:`, error);

    // Update conversation with error status
    const conversation = conversations.get(queryId);
    if (conversation) {
      conversation.status = 'error';
      conversation.error = error.message;
      conversations.set(queryId, conversation);
    }

    throw error;
  }
}

// Main generation function
async function generateNews(quickMode = false) {
  console.log(`Starting two-step news generation... (${quickMode ? 'QUICK MODE' : 'FULL MODE'})`);
  
  try {
    // Step 1: Research
    const newsData = await researchNews(quickMode);
    
    // Save research data for debugging
    fs.writeFileSync('./news-data.json', JSON.stringify(newsData, null, 2));
    console.log('Research data saved to news-data.json');

    // No wait needed! Phase 2 uses JavaScript templating (no API call)
    console.log('Proceeding with HTML generation (template-based, no API call)...');

    // Step 2: Generate HTML (no API call, instant)
    const htmlContent = generateHtml(newsData);
    
    // Clean up encoding issues
    const cleanedHtml = htmlContent
      .replace(/Ã¢â‚¬â„¢/g, "'")
      .replace(/Ã¢â‚¬Å"/g, '"')
      .replace(/Ã¢â‚¬/g, '"')
      .replace(/Ã¢â‚¬"/g, '—')
      .replace(/Ã¢â‚¬"/g, '—');
    
    // Write to index.html locally
    fs.writeFileSync('./index.html', cleanedHtml);
    
    console.log('News generated successfully!');
    console.log(`Generated at: ${new Date().toISOString()}`);
    
    // Push to GitHub
    await pushToGitHub(cleanedHtml);
    
  } catch (error) {
    console.error('Error generating news:', error);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

// =============================================================================
// HTTP ENDPOINT FOR MANUAL GENERATION
// =============================================================================
// ⚠️  CRITICAL: The 'true' parameter MUST remain to use QUICK MODE
// ⚠️  QUICK MODE prevents excessive token usage during testing
// ⚠️  DO NOT CHANGE THIS TO false OR REMOVE THE PARAMETER
// =============================================================================
app.get('/generate', async (req, res) => {
  console.log('Manual generation triggered via HTTP (QUICK MODE)');
  res.json({ status: 'started', message: 'News generation started in quick mode' });
  
  // Run generation asynchronously in QUICK MODE (true = quick, false = full)
  // ⚠️  KEEP THIS AS true - DO NOT REMOVE OR CHANGE ⚠️
  generateNews(true).catch(err => console.error('Generation error:', err));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'News generator is running' });
});

// =============================================================================
// INTERACTIVE QUERY ENDPOINTS
// =============================================================================

// POST /api/query - Submit a new user query
app.post('/api/query', async (req, res) => {
  try {
    const { query, conversationId } = req.body;
    const userIp = req.ip || req.connection.remoteAddress;

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (query.length > 500) {
      return res.status(400).json({ error: 'Query too long (max 500 characters)' });
    }

    // Check rate limit
    if (!checkRateLimit(userIp)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Maximum 5 queries per 10 minutes. Please try again later.'
      });
    }

    // Check conversation limit
    if (conversations.size >= MAX_CONVERSATIONS) {
      return res.status(503).json({
        error: 'Service busy',
        message: 'Too many active conversations. Please try again in a few minutes.'
      });
    }

    // Generate unique query ID
    const queryId = crypto.randomBytes(16).toString('hex');

    // Get conversation history if this is a follow-up
    let conversationHistory = [];
    if (conversationId) {
      const existingConversation = conversations.get(conversationId);
      if (existingConversation && existingConversation.conversationHistory) {
        conversationHistory = existingConversation.conversationHistory;
        console.log(`Follow-up query for conversation ${conversationId}`);
      }
    }

    // Store conversation in memory
    conversations.set(queryId, {
      query: query.trim(),
      result: null,
      conversationHistory: conversationHistory,
      timestamp: Date.now(),
      status: 'processing',
      ip: userIp
    });

    // Send immediate response
    res.json({
      queryId: queryId,
      status: 'processing',
      message: 'Your query is being researched'
    });

    // Process query asynchronously
    processUserQuery(queryId, query.trim(), conversationHistory).catch(err => {
      console.error(`Async processing error for query ${queryId}:`, err);
    });

  } catch (error) {
    console.error('Error in /api/query endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/query-status/:id - Poll for query results
app.get('/api/query-status/:id', (req, res) => {
  try {
    const queryId = req.params.id;
    const conversation = conversations.get(queryId);

    if (!conversation) {
      return res.status(404).json({
        error: 'Query not found',
        message: 'Query may have expired (queries are kept for 1 hour)'
      });
    }

    // Return current status
    if (conversation.status === 'processing') {
      return res.json({
        status: 'processing',
        message: 'Still researching your query...'
      });
    }

    if (conversation.status === 'error') {
      return res.json({
        status: 'error',
        error: conversation.error || 'An error occurred while processing your query'
      });
    }

    if (conversation.status === 'complete') {
      return res.json({
        status: 'complete',
        result: conversation.result,
        conversationId: queryId // Allow follow-up questions
      });
    }

    // Unknown status
    res.status(500).json({ error: 'Unknown query status' });

  } catch (error) {
    console.error('Error in /api/query-status endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Schedule to run daily at 6 AM PST (2 PM UTC) - FULL MODE
cron.schedule('0 14 * * *', () => {
  console.log('Running scheduled news generation (FULL MODE)...');
  generateNews(false); // false = FULL MODE for scheduled runs
});

// Cleanup expired conversations every 10 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, conversation] of conversations.entries()) {
    if (now - conversation.timestamp > CONVERSATION_EXPIRY_MS) {
      conversations.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired conversation(s)`);
  }
}, 600000); // 10 minutes

// Cleanup old rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [ip, timestamps] of queryLimits.entries()) {
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (recentTimestamps.length === 0) {
      queryLimits.delete(ip);
      cleaned++;
    } else if (recentTimestamps.length < timestamps.length) {
      queryLimits.set(ip, recentTimestamps);
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up rate limit data for ${cleaned} IP(s)`);
  }
}, 600000); // 10 minutes

// Keep the process alive
console.log('News generator started. Will run daily at 6 AM PST (2 PM UTC).');
console.log('Next run will be at 6 AM PST.');
console.log('Manual generation available at /generate endpoint (QUICK MODE)');
console.log('Interactive query API available at /api/query endpoint');
