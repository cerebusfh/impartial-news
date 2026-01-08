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

// Read prompts from files
function getResearchPrompt() {
  return fs.readFileSync('./research-prompt.md', 'utf8');
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
async function researchNews() {
  console.log('STEP 1: Researching news stories...');
  
  try {
    const researchPrompt = getResearchPrompt();
    
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
      model: 'claude-sonnet-4-20250514',
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
    
    return htmlContent;
    
  } catch (error) {
    console.error('Error in HTML generation phase:', error);
    throw error;
  }
}

// Main generation function
async function generateNews() {
  console.log('Starting two-step news generation...');
  
  try {
    // Step 1: Research
    const newsData = await researchNews();
    
    // Save research data for debugging
    fs.writeFileSync('./news-data.json', JSON.stringify(newsData, null, 2));
    console.log('Research data saved to news-data.json');
    
    // Step 2: Generate HTML
    const htmlContent = await generateHtml(newsData);
    
    // Clean up encoding issues
    const cleanedHtml = htmlContent
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€"/g, '—')
      .replace(/â€"/g, '–');
    
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

// HTTP endpoint to trigger manual generation
app.get('/generate', async (req, res) => {
  console.log('Manual generation triggered via HTTP');
  res.json({ status: 'started', message: 'News generation started' });
  
  // Run generation asynchronously
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

// Schedule to run daily at 6 AM UTC
cron.schedule('0 6 * * *', () => {
  console.log('Running scheduled news generation...');
  generateNews();
});

// Keep the process alive
console.log('News generator started. Will run daily at 6 AM UTC.');
console.log('Next run will be at 6 AM UTC.');
console.log('Manual generation available at /generate endpoint');
