const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const { logGeneration, displayCostSummary } = require('./usage-logger');

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

// =============================================================================
// RATE LIMITING CONFIGURATION
// =============================================================================
const RATE_LIMITS = {
  MANUAL_MIN_INTERVAL: 3600000,    // 1 hour between manual refreshes
  CRON_MIN_INTERVAL: 86400000,     // 24 hours between scheduled runs
};

let lastManualRun = 0;
let lastCronRun = 0;
let isGenerating = false;  // Prevent concurrent runs

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
    prompt += '\n\n**QUICK MODE**: Maximum 10 total searches across ALL categories. Prioritize speed and cost efficiency.';
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
      console.log('✅ Successfully pushed to GitHub!');
    } else {
      const error = await updateResponse.text();
      console.error('❌ GitHub API error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error pushing to GitHub:', error.message);
  }
}

// STEP 1: Research and gather news stories
async function researchNews(quickMode = false) {
  console.log(`STEP 1: Researching news stories... (${quickMode ? 'QUICK' : 'FULL'})`);
  
  try {
    const researchPrompt = getResearchPrompt(quickMode);
    
    const message = await anthropic.messages.create({
      model: quickMode ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-20250514',  // Haiku for QUICK, Sonnet for FULL
      max_tokens: quickMode ? 6000 : 12000,  // Reduced for QUICK mode
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

// STEP 2: Generate HTML from research data
async function generateHtml(newsData) {
  console.log('STEP 2: Generating HTML from research...');
  
  try {
    const htmlPrompt = getHtmlPrompt();
    const fullPrompt = `${htmlPrompt}\n\nHere is the news data to convert to HTML:\n\n${JSON.stringify(newsData, null, 2)}`;
    
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',  // 🎉 SWITCHED TO HAIKU - Much cheaper!
      max_tokens: 32000,
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ]
    });
    
    console.log('HTML generation complete. Content blocks:', message.content.length);
    
    // Extract HTML from response
    let htmlContent = '';
    for (let i = 0; i < message.content.length; i++) {
      if (message.content[i].type === 'text') {
        const text = message.content[i].text;
        
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          htmlContent = text;
          console.log('Found HTML in block:', i);
          break;
        }
      }
    }
    
    if (!htmlContent) {
      throw new Error('No HTML found in response');
    }
    
    // Extract from markdown if needed
    if (htmlContent.includes('```html')) {
      htmlContent = htmlContent.split('```html')[1].split('```')[0].trim();
    } else if (htmlContent.includes('```')) {
      htmlContent = htmlContent.split('```')[1].split('```')[0].trim();
    }
    
    console.log('Final HTML length:', htmlContent.length);
    
    // Add timestamp to HTML
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    htmlContent = htmlContent.replace('[TIMESTAMP]', timestamp);
    
    return htmlContent;
    
  } catch (error) {
    console.error('Error in HTML generation phase:', error);
    throw error;
  }
}

// Main generation function
async function generateNews(quickMode = false, triggerType = 'manual') {
  const mode = quickMode ? 'QUICK' : 'FULL';
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Starting two-step news generation... (${mode} MODE - ${triggerType})`);
  console.log(`${'='.repeat(80)}\n`);
  
  // Check if already generating
  if (isGenerating) {
    const error = 'Generation already in progress. Please wait.';
    console.error('❌', error);
    logGeneration(mode, false, error);
    throw new Error(error);
  }
  
  isGenerating = true;
  const startTime = Date.now();
  
  try {
    // Step 1: Research
    const newsData = await researchNews(quickMode);
    
    // Save research data for debugging
    fs.writeFileSync('./news-data.json', JSON.stringify(newsData, null, 2));
    console.log('Research data saved to news-data.json');
    
    // Wait time depends on mode
    const waitTime = quickMode ? 150000 : 420000; // 2.5min for quick, 7min for full
    console.log(`Waiting ${waitTime/1000} seconds for rate limit reset...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    console.log('Proceeding with HTML generation...');
    
    // Step 2: Generate HTML
    const htmlContent = await generateHtml(newsData);
    
    // Clean up encoding issues
    const cleanedHtml = htmlContent
      .replace(/Ã¢â‚¬â„¢/g, "'")
      .replace(/Ã¢â‚¬Å"/g, '"')
      .replace(/Ã¢â‚¬/g, '"')
      .replace(/Ã¢â‚¬"/g, '—')
      .replace(/Ã¢â‚¬"/g, '—');
    
    // Write to index.html locally
    fs.writeFileSync('./index.html', cleanedHtml);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ News generated successfully in ${duration}s!`);
    console.log(`Generated at: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Push to GitHub
    await pushToGitHub(cleanedHtml);
    
    // Log successful generation
    logGeneration(mode, true, null, { duration, triggerType });
    
    // Display cost summary
    displayCostSummary();
    
  } catch (error) {
    console.error('❌ Error generating news:', error);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
    
    // Log failed generation
    logGeneration(mode, false, error.message, { triggerType });
    
    throw error;
  } finally {
    isGenerating = false;
  }
}

// =============================================================================
// HTTP ENDPOINT FOR MANUAL GENERATION - WITH RATE LIMITING
// =============================================================================
app.get('/generate', async (req, res) => {
  const now = Date.now();
  const timeSinceLastRun = now - lastManualRun;
  
  // Check rate limit
  if (timeSinceLastRun < RATE_LIMITS.MANUAL_MIN_INTERVAL) {
    const minutesLeft = Math.ceil((RATE_LIMITS.MANUAL_MIN_INTERVAL - timeSinceLastRun) / 60000);
    const error = `Rate limit: Please wait ${minutesLeft} minutes before refreshing again.`;
    
    console.log('⏱️ ', error);
    logGeneration('QUICK', false, error);
    
    return res.status(429).json({ 
      status: 'rate_limited', 
      error,
      minutesUntilNextRun: minutesLeft
    });
  }
  
  // Check if already generating
  if (isGenerating) {
    return res.status(409).json({
      status: 'conflict',
      error: 'Generation already in progress. Please wait.'
    });
  }
  
  console.log('🔄 Manual generation triggered via HTTP (QUICK MODE)');
  lastManualRun = now;
  
  res.json({ 
    status: 'started', 
    message: 'News generation started in quick mode',
    estimatedCost: '$0.30'
  });
  
  // Run generation asynchronously in QUICK MODE (true = quick, false = full)
  // ⚠️  KEEP THIS AS true - DO NOT REMOVE OR CHANGE ⚠️
  generateNews(true, 'manual').catch(err => {
    console.error('Generation error:', err);
    logGeneration('QUICK', false, err.message, { triggerType: 'manual' });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'News generator is running',
    isGenerating,
    lastManualRun: lastManualRun ? new Date(lastManualRun).toISOString() : 'never',
    lastCronRun: lastCronRun ? new Date(lastCronRun).toISOString() : 'never'
  });
});

// Cost summary endpoint
app.get('/costs', (req, res) => {
  const { getCostSummary } = require('./usage-logger');
  const summary7d = getCostSummary(7);
  const summary30d = getCostSummary(30);
  
  res.json({
    last7Days: summary7d,
    last30Days: summary30d
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Endpoints:`);
  console.log(`  - GET /health     - Health check`);
  console.log(`  - GET /generate   - Manual news generation (rate limited)`);
  console.log(`  - GET /costs      - View cost summary`);
  console.log(`${'='.repeat(80)}\n`);
  
  displayCostSummary();
});

// Schedule to run daily at 6 AM PST (2 PM UTC) - FULL MODE
cron.schedule('0 14 * * *', () => {
  const now = Date.now();
  const timeSinceLastRun = now - lastCronRun;
  
  // Safety check: prevent duplicate cron runs
  if (timeSinceLastRun < RATE_LIMITS.CRON_MIN_INTERVAL) {
    console.log('⏱️  Skipping cron run - too soon since last run');
    return;
  }
  
  console.log('⏰ Running scheduled news generation (FULL MODE)...');
  lastCronRun = now;
  generateNews(false, 'cron').catch(err => {
    console.error('Scheduled generation error:', err);
  });
});

// Keep the process alive
console.log('News generator started. Will run daily at 6 AM PST (2 PM UTC).');
console.log('Next scheduled run at 6 AM PST.');
console.log('Manual generation available at /generate endpoint (QUICK MODE, rate limited)\n');
