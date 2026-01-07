const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const cron = require('node-cron');
const express = require('express');
const cors = require('cors');

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

// Read the prompt from file
function getPrompt() {
  return fs.readFileSync('./prompt.md', 'utf8');
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

// Generate news using Claude
async function generateNews() {
  console.log('Starting news generation with Claude...');
  
  try {
    const prompt = getPrompt();
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
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

    // Log the full response for debugging
    console.log('Response type:', message.stop_reason);
    console.log('Content blocks:', message.content.length);
    
    // Extract HTML from Claude's response
    // When Claude uses tools, the HTML is in the last text block
    let htmlContent = '';
    
    // Find the last text block (which should contain the HTML)
    for (let i = message.content.length - 1; i >= 0; i--) {
      if (message.content[i].type === 'text') {
        htmlContent = message.content[i].text;
        console.log('Found text block at index:', i);
        console.log('First 500 chars:', htmlContent.substring(0, 500));
        break;
      }
    }
    
    // If Claude wrapped it in markdown code blocks, extract it
    if (htmlContent.includes('```html')) {
      htmlContent = htmlContent.split('```html')[1].split('```')[0].trim();
    } else if (htmlContent.includes('```')) {
      htmlContent = htmlContent.split('```')[1].split('```')[0].trim();
    }
    
    console.log('Extracted HTML length:', htmlContent.length);
    
    // Clean up encoding issues (just in case)
    const cleanedHtml = htmlContent
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€"/g, '—')
      .replace(/â€"/g, '–');
    
    // Write to index.html locally (for debugging)
    fs.writeFileSync('./index.html', cleanedHtml);
    
    console.log('News generated successfully!');
    console.log(`Generated at: ${new Date().toISOString()}`);
    
    // Push to GitHub using API
    await pushToGitHub(cleanedHtml);
    
  } catch (error) {
    console.error('Error generating news:', error);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

// HTTP endpoint to trigger manual generation
app.get('/generate', async (req, res) => {
  console.log('Manual generation triggered via HTTP');
  res.json({ status: 'started', message: 'News generation started' });
  
  // Run generation asynchronously (don't block response)
  generateNews().catch(err => console.error('Generation error:', err));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'News generator is running' });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Only run on schedule, not on startup (to avoid infinite loop)
// Schedule to run daily at 6 AM UTC
cron.schedule('0 6 * * *', () => {
  console.log('Running scheduled news generation...');
  generateNews();
});

// Keep the process alive
console.log('News generator started. Will run daily at 6 AM UTC.');
console.log('Next run will be at 6 AM UTC.');
console.log('Manual generation available at /generate endpoint');
