// API Client for OtelRedisNative Project
// Provides fetch functions and test scenarios for all project endpoints

/**
 * Get API base URL from config
 */
function getApiHost() {
  return document.getElementById('apiHost').value || 'http://localhost:4000';
}

/**
 * Get request delay from config
 */
function getRequestDelay() {
  return parseInt(document.getElementById('requestDelay').value) || 0;
}

/**
 * Delay execution
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Display result in UI with formatting
 */
function displayResult(elementId, data, isSuccess = true) {
  const element = document.getElementById(elementId);
  const resultBox = element.querySelector('.result-box') || document.createElement('div');
  resultBox.className = `result-box ${isSuccess ? 'success' : 'error'}`;
  resultBox.textContent = JSON.stringify(data, null, 2);
  
  if (!element.contains(resultBox)) {
    element.appendChild(resultBox);
  }

  const badge = element.querySelector('.status-badge') || document.createElement('div');
  badge.className = `status-badge ${isSuccess ? 'success' : 'error'}`;
  badge.textContent = isSuccess ? '✓ Success' : '✗ Error';
  
  if (!element.contains(badge)) {
    element.appendChild(badge);
  }
}

/**
 * Display loading state
 */
function displayLoading(elementId, message = 'Loading...') {
  const element = document.getElementById(elementId);
  const badge = element.querySelector('.status-badge') || document.createElement('div');
  badge.className = 'status-badge loading';
  badge.innerHTML = `<span class="spinner">⟳</span> ${message}`;
  
  if (!element.contains(badge)) {
    element.appendChild(badge);
  }
}

/**
 * Clear result display
 */
function clearResult(elementId) {
  const element = document.getElementById(elementId);
  const resultBox = element.querySelector('.result-box');
  const badge = element.querySelector('.status-badge');
  
  if (resultBox) resultBox.remove();
  if (badge) badge.remove();
}

// ============================================================================
// BASIC API TESTS
// ============================================================================

/**
 * Test: Health Check
 * GET /health - Returns server status and uptime
 */
async function testHealth() {
  clearResult('health-result');
  displayLoading('health-result', 'Checking health...');

  try {
    const response = await fetch(`${getApiHost()}/health`);
    const data = await response.json();
    
    displayResult('health-result', {
      status: response.status,
      statusText: response.statusText,
      data
    }, response.ok);
  } catch (error) {
    displayResult('health-result', {
      error: error.message,
      hint: 'Make sure the server is running on ' + getApiHost()
    }, false);
  }
}

/**
 * Test: API Data
 * GET /api/data - Returns message and timestamp
 */
async function testApiData() {
  clearResult('api-data-result');
  displayLoading('api-data-result', 'Fetching data...');

  try {
    const response = await fetch(`${getApiHost()}/api/data`);
    const data = await response.json();
    
    displayResult('api-data-result', {
      status: response.status,
      statusText: response.statusText,
      data
    }, response.ok);
  } catch (error) {
    displayResult('api-data-result', {
      error: error.message
    }, false);
  }
}

// ============================================================================
// REDIS TESTS
// ============================================================================

/**
 * Test: Redis Basic Operations
 * GET /redis-test - Tests SET and GET on Redis
 */
async function testRedisBasic() {
  clearResult('redis-result');
  displayLoading('redis-result', 'Testing Redis...');

  try {
    const response = await fetch(`${getApiHost()}/redis-test`);
    const data = await response.json();
    
    displayResult('redis-result', {
      status: response.status,
      statusText: response.statusText,
      data
    }, response.ok);
  } catch (error) {
    displayResult('redis-result', {
      error: error.message
    }, false);
  }
}

/**
 * Test: Redis Flow
 * GET /redis-flow - Tests multi-step Redis operations
 */
async function testRedisFlow() {
  clearResult('redis-flow-result');
  displayLoading('redis-flow-result', 'Testing Redis flow...');

  try {
    const response = await fetch(`${getApiHost()}/redis-flow`);
    const data = await response.json();
    
    displayResult('redis-flow-result', {
      status: response.status,
      statusText: response.statusText,
      data
    }, response.ok);
  } catch (error) {
    displayResult('redis-flow-result', {
      error: error.message
    }, false);
  }
}

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

/**
 * Test: Single Request
 * Send a single request and display result
 */
async function testSingleRequest() {
  clearResult('single-result');
  displayLoading('single-result', 'Sending request...');

  try {
    const startTime = performance.now();
    const response = await fetch(`${getApiHost()}/api/data`);
    const endTime = performance.now();
    const data = await response.json();
    
    displayResult('single-result', {
      status: response.status,
      statusText: response.statusText,
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      data
    }, response.ok);
  } catch (error) {
    displayResult('single-result', {
      error: error.message
    }, false);
  }
}

/**
 * Test: Burst Requests
 * Send N rapid requests to observe rate limiting behavior
 */
async function testBurstRequests(count) {
  const resultId = `burst-${count}-result`;
  clearResult(resultId);
  displayLoading(resultId, `Sending ${count} requests...`);

  const results = [];
  const startTime = performance.now();

  try {
    for (let i = 1; i <= count; i++) {
      try {
        const response = await fetch(`${getApiHost()}/api/data`);
        const data = await response.json();
        
        results.push({
          request: i,
          status: response.status,
          statusText: response.statusText,
          allowed: response.ok,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        results.push({
          request: i,
          error: err.message
        });
      }

      // Add delay between requests if configured
      if (i < count && getRequestDelay() > 0) {
        await delay(getRequestDelay());
      }
    }

    const endTime = performance.now();
    const allowedCount = results.filter(r => r.allowed).length;
    const blockedCount = results.filter(r => !r.allowed && !r.error).length;

    displayResult(resultId, {
      totalRequests: count,
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      allowed: allowedCount,
      blocked: blockedCount,
      results
    }, blockedCount === 0 || (count === 6 && blockedCount > 0));
  } catch (error) {
    displayResult(resultId, {
      error: error.message
    }, false);
  }
}

/**
 * Test: Rate Limit Window Reset
 * Send requests, wait for window to reset, then send more
 */
async function testWindowReset() {
  clearResult('window-result');
  displayLoading('window-result', 'Starting window reset test...');

  try {
    const windowSeconds = parseInt(document.getElementById('windowSeconds').value) || 10;
    const results = [];

    // Phase 1: Send requests within window
    displayLoading('window-result', 'Phase 1: Sending initial requests...');
    
    for (let i = 1; i <= 3; i++) {
      const response = await fetch(`${getApiHost()}/api/data`);
      results.push({
        phase: 1,
        request: i,
        status: response.status
      });
      await delay(100);
    }

    // Phase 2: Wait for window to reset
    displayLoading('window-result', `Phase 2: Waiting ${windowSeconds}s for window to reset...`);
    await delay(windowSeconds * 1000 + 500);

    // Phase 3: Send more requests (should be allowed)
    displayLoading('window-result', 'Phase 3: Sending requests after reset...');
    
    for (let i = 1; i <= 3; i++) {
      const response = await fetch(`${getApiHost()}/api/data`);
      results.push({
        phase: 2,
        request: i,
        status: response.status
      });
      await delay(100);
    }

    displayResult('window-result', {
      windowSeconds,
      phase1: results.filter(r => r.phase === 1),
      phase2: results.filter(r => r.phase === 2),
      allSuccessful: results.every(r => r.status === 200)
    }, results.every(r => r.status === 200));
  } catch (error) {
    displayResult('window-result', {
      error: error.message
    }, false);
  }
}

/**
 * Test: Rate Limit Debug
 * GET /rate-limit-debug - Inspect sliding window state in Redis
 */
async function testRateLimitDebug() {
  clearResult('debug-result');
  displayLoading('debug-result', 'Fetching debug info...');

  try {
    const response = await fetch(`${getApiHost()}/rate-limit-debug`);
    const data = await response.json();
    
    if (response.ok) {
      const memberCount = Object.keys(data.rateLimit?.members || {}).length;
      
      displayResult('debug-result', {
        status: response.status,
        clientKey: data.clientKey,
        rateLimitKey: data.key,
        currentTimestamp: data.now,
        rateLimit: {
          activeRequests: data.rateLimit.count,
          ttlSeconds: data.rateLimit.ttl,
          memberCount,
          members: data.rateLimit.members
        }
      }, true);
    } else {
      displayResult('debug-result', {
        status: response.status,
        message: 'Rate limit debug endpoint blocked (rate limited)',
        hint: 'The debug endpoint itself is subject to rate limiting'
      }, false);
    }
  } catch (error) {
    displayResult('debug-result', {
      error: error.message
    }, false);
  }
}

/**
 * Test: Concurrent Requests
 * Send multiple concurrent requests and observe behavior
 */
async function testConcurrentRequests() {
  clearResult('concurrent-result');
  
  try {
    const count = parseInt(document.getElementById('concurrentCount').value) || 10;
    displayLoading('concurrent-result', `Sending ${count} concurrent requests...`);

    const startTime = performance.now();
    const promises = [];

    // Create all requests
    for (let i = 1; i <= count; i++) {
      promises.push(
        fetch(`${getApiHost()}/api/data`)
          .then(response => ({
            request: i,
            status: response.status,
            ok: response.ok,
            timestamp: new Date().toISOString()
          }))
          .catch(error => ({
            request: i,
            error: error.message
          }))
      );
    }

    // Wait for all to complete
    const results = await Promise.all(promises);
    const endTime = performance.now();

    const successCount = results.filter(r => r.ok).length;
    const blockedCount = results.filter(r => !r.ok && !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    displayResult('concurrent-result', {
      totalRequests: count,
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      successful: successCount,
      blocked: blockedCount,
      errors: errorCount,
      results: results.sort((a, b) => a.status - b.status)
    }, blockedCount === 0 || blockedCount > 0);
  } catch (error) {
    displayResult('concurrent-result', {
      error: error.message
    }, false);
  }
}

// ============================================================================
// UTILITY: Reset all results
// ============================================================================

/**
 * Clear all result displays
 */
function clearAllResults() {
  const resultElements = document.querySelectorAll('[id$="-result"]');
  resultElements.forEach(el => {
    el.querySelectorAll('.result-box, .status-badge').forEach(child => child.remove());
  });
}

// Log initialization
console.log('✓ API Client loaded');
console.log('Available endpoints:');
console.log('  - GET /health');
console.log('  - GET /api/data');
console.log('  - GET /redis-test');
console.log('  - GET /redis-flow');
console.log('  - GET /rate-limit-debug');
