const fs = require('fs');
const path = require('path');

// Cost estimates per generation type (in USD)
const COST_ESTIMATES = {
  QUICK: 0.30,  // Reduced searches, Haiku for HTML
  FULL: 0.80    // Full searches, Haiku for HTML
};

// Log file path
const LOG_FILE = path.join(__dirname, 'usage-log.txt');

/**
 * Log a generation attempt with timestamp, mode, and outcome
 * @param {string} mode - 'QUICK' or 'FULL'
 * @param {boolean} success - Whether generation succeeded
 * @param {string|null} error - Error message if failed
 * @param {Object} metadata - Additional info (tokens used, searches, etc)
 */
function logGeneration(mode, success, error = null, metadata = {}) {
  const timestamp = new Date().toISOString();
  const estimatedCost = COST_ESTIMATES[mode] || 0;
  
  const logEntry = {
    timestamp,
    mode,
    success,
    estimatedCost,
    error: error || null,
    metadata
  };
  
  // Format as readable line
  const logLine = `[${timestamp}] ${mode} mode - ${success ? 'SUCCESS' : 'FAILED'} - Est. cost: $${estimatedCost.toFixed(2)}${error ? ` - Error: ${error}` : ''}\n`;
  
  // Append to log file
  try {
    fs.appendFileSync(LOG_FILE, logLine);
    console.log('📊 Usage logged:', logLine.trim());
  } catch (err) {
    console.error('Failed to write to usage log:', err);
  }
  
  // Also log the full JSON for programmatic parsing
  const jsonLogLine = JSON.stringify(logEntry) + '\n';
  const jsonLogFile = path.join(__dirname, 'usage-log.json');
  
  try {
    fs.appendFileSync(jsonLogFile, jsonLogLine);
  } catch (err) {
    console.error('Failed to write to JSON usage log:', err);
  }
}

/**
 * Get total estimated costs for a given time period
 * @param {number} days - Number of days to look back
 * @returns {Object} Summary of costs
 */
function getCostSummary(days = 7) {
  const jsonLogFile = path.join(__dirname, 'usage-log.json');
  
  if (!fs.existsSync(jsonLogFile)) {
    return { totalCost: 0, successCount: 0, failCount: 0 };
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  try {
    const lines = fs.readFileSync(jsonLogFile, 'utf8').split('\n').filter(Boolean);
    const logs = lines.map(line => JSON.parse(line));
    
    const recentLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
    
    const summary = {
      totalCost: recentLogs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0),
      successCount: recentLogs.filter(log => log.success).length,
      failCount: recentLogs.filter(log => !log.success).length,
      quickCount: recentLogs.filter(log => log.mode === 'QUICK').length,
      fullCount: recentLogs.filter(log => log.mode === 'FULL').length
    };
    
    return summary;
  } catch (err) {
    console.error('Failed to parse usage logs:', err);
    return { totalCost: 0, successCount: 0, failCount: 0 };
  }
}

/**
 * Display cost summary
 */
function displayCostSummary() {
  const summary7d = getCostSummary(7);
  const summary30d = getCostSummary(30);
  
  console.log('\n📊 COST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Last 7 days:  $${summary7d.totalCost.toFixed(2)} (${summary7d.successCount} runs)`);
  console.log(`Last 30 days: $${summary30d.totalCost.toFixed(2)} (${summary30d.successCount} runs)`);
  console.log(`  - QUICK mode: ${summary7d.quickCount} runs`);
  console.log(`  - FULL mode:  ${summary7d.fullCount} runs`);
  console.log(`  - Failed:     ${summary7d.failCount} attempts`);
  console.log('═══════════════════════════════════════\n');
}

module.exports = {
  logGeneration,
  getCostSummary,
  displayCostSummary,
  COST_ESTIMATES
};
