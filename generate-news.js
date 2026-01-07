const OpenAI = require('openai');
const fs = require('fs');
const { execSync } = require('child_process');
const cron = require('node-cron');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure git with GitHub token
function configureGit() {
  const token = process.env.GITHUB_TOKEN;
  const repoUrl = `https://${token}@github.com/cerebusfh/impartial-news.git`;
  
  try {
    execSync('git config user.email "news-bot@impartial-news.app"');
    execSync('git config user.name "News Bot"');
    execSync(`git remote set-url origin ${repoUrl}`);
  } catch (error) {
    console.error('Git config error:', error.message);
  }
}

// Read the prompt from file
function getPrompt() {
  return fs.readFileSync('./prompt.md', 'utf8');
}

// Push changes to GitHub
function pushToGitHub() {
  try {
    console.log('Pushing to GitHub...');
    execSync('git add index.html');
    execSync(`git commit -m "Update news - ${new Date().toISOString()}"`);
    execSync('git push origin main');
    console.log('Successfully pushed to GitHub!');
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
      ],
      temperature: 0.3,
    });

    const htmlContent = completion.choices[0].message.content;
    
    // Clean up encoding issues
    const cleanedHtml = htmlContent
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€"/g, '—')
      .replace(/â€"/g, '–');
    
    // Write to index.html
    fs.writeFileSync('./index.html', cleanedHtml);
    
    console.log('News generated successfully!');
    console.log(`Generated at: ${new Date().toISOString()}`);
    
    // Push to GitHub
    pushToGitHub();
    
  } catch (error) {
    console.error('Error generating news:', error);
  }
}

// Configure git on startup
configureGit();

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
