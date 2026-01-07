const OpenAI = require('openai');
const fs = require('fs');
const cron = require('node-cron');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

// Generate news using ChatGPT
async function generateNews() {
  console.log('Starting news generation...');
  
  try {
    const prompt = getPrompt();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an impartial news editor that searches the web for current news and generates factual, neutral headlines."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const htmlContent = completion.choices[0].message.content;
    
    // Clean up encoding issues
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
  }
}

// Run immediately on start
generateNews();

// Schedule to run daily at 6 AM UTC
cron.schedule('0 6 * * *', () => {
  console.log('Running scheduled news generation...');
  generateNews();
});

// Keep the process alive
console.log('News generator started. Will run daily at 6 AM UTC.');
console.log('Press Ctrl+C to stop.');
