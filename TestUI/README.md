# OtelRedisNative API Test UI

Interactive browser-based testing interface for all project APIs with comprehensive rate limiting scenarios.

## Quick Start

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open TestUI:**
   - Open `TestUI/index.html` directly in your browser
   - Or serve via a local server (recommended):
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Node.js (using http-server)
     npx http-server TestUI
     ```
   - Navigate to `http://localhost:8000/index.html` (or appropriate port)

3. **Configure API Host:**
   - Default: `http://localhost:4000`
   - Change in the "API Host" input field if your server runs elsewhere

## Available Tests

### Basic API Tests

#### 🏥 Health Check
- **Endpoint:** `GET /health`
- **Tests:** Server status, uptime, timestamp
- **Use Case:** Verify server is running and responsive

#### 📡 API Data
- **Endpoint:** `GET /api/data`
- **Tests:** Basic API response
- **Use Case:** Simple connectivity test

### Redis Tests

#### 🔴 Redis SET/GET
- **Endpoint:** `GET /redis-test`
- **Tests:** Redis SET and GET operations
- **Use Case:** Verify Redis connectivity and basic operations

#### 🔗 Redis Flow
- **Endpoint:** `GET /redis-flow`
- **Tests:** Multi-step Redis operations
- **Use Case:** Validate complex Redis workflows

### Rate Limiting Scenarios

#### Single Request
- Sends 1 request and displays response
- **Expected:** HTTP 200
- **Use Case:** Quick sanity check

#### Burst Requests (5)
- Sends 5 rapid requests
- **Expected:** All HTTP 200 (within RATE_LIMIT_MAX=5)
- **Use Case:** Verify requests within limit are allowed

#### Limit Exceeded (6)
- Sends 6 rapid requests
- **Expected:** First 5 HTTP 200, 6th HTTP 429
- **Use Case:** Verify rate limiting triggers correctly

#### Window Reset Test
- Sends 3 requests → waits for window to reset → sends 3 more
- **Window:** Configurable (default 10s = RATE_LIMIT_WINDOW)
- **Expected:** All requests HTTP 200 (each batch within window)
- **Use Case:** Verify sliding window behavior and cleanup

#### Rate Limit Debug
- **Endpoint:** `GET /rate-limit-debug`
- **Shows:** Redis ZSET state, active request timestamps, TTL
- **Use Case:** Inspect internal rate limiter state
- **Note:** Subject to rate limiting itself

#### Concurrent Requests
- Sends N concurrent requests
- **Configurable:** Request count (default 10)
- **Expected:** Mixed 200 and 429 responses
- **Use Case:** Stress test concurrent behavior

## Configuration

### Request Settings

| Setting | Purpose | Default |
|---------|---------|---------|
| API Host | Server URL | `http://localhost:4000` |
| Request Delay | Delay between requests (ms) | `100` |
| Window (s) | Rate limit window for reset test | `10` |
| Request Count | Concurrent request count | `10` |

## Test Results

Each test displays:
- **HTTP Status:** Response status code
- **Duration:** Total request time
- **Response Data:** Full JSON response
- **Status Badge:** Color-coded result (✓ Success, ✗ Error, ⟳ Loading)

Results are color-coded:
- 🟢 **Green:** Successful (HTTP 200)
- 🔴 **Red:** Error or rate limited (HTTP 429, 5xx)
- 🟡 **Yellow:** Loading in progress

## Key Endpoints Tested

```
GET  /health              → Server health & uptime
GET  /api/data            → API data response
GET  /redis-test          → Redis SET/GET test
GET  /redis-flow          → Redis multi-step flow
GET  /rate-limit-debug    → Debug rate limiter state
```

## Rate Limiting Configuration

Current server config (`src/config/env.ts`):
- **RATE_LIMIT_WINDOW:** 10 seconds (rolling window)
- **RATE_LIMIT_MAX:** 5 requests per window
- **Algorithm:** Sliding window (ZSET-based)

## Browser Compatibility

- Modern browsers with Fetch API support
- Tested on: Chrome, Firefox, Safari, Edge
- CORS: Requests from `file://` may require a local server

## Common Issues

### 🔴 Server Connection Failed
- **Problem:** Cannot reach API host
- **Solution:** 
  1. Verify server is running: `npm run dev`
  2. Check API Host setting matches server URL
  3. Ensure Docker Redis is running

### 🔴 CORS Errors
- **Problem:** Cross-origin request blocked
- **Solution:** 
  1. Serve TestUI via local HTTP server (not `file://`)
  2. Check server CORS configuration

### 🟡 All Requests Blocked (429)
- **Problem:** Rate limit triggered
- **Solution:** 
  1. Wait for window reset (10s default)
  2. Use "Window Reset Test" to verify cleanup
  3. Check Rate Limit Debug endpoint for state

## API Response Examples

### Health Check (200)
```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2026-05-19T16:30:00.000Z"
}
```

### API Data (200)
```json
{
  "message": "Hello from API",
  "timestamp": "2026-05-19T16:30:00.000Z"
}
```

### Rate Limited (429)
```json
{
  "error": "Too many requests"
}
```

### Rate Limit Debug (200)
```json
{
  "status": "ok",
  "clientKey": "::1",
  "key": "rate_limit:::1",
  "rateLimit": {
    "count": 5,
    "ttl": 20,
    "members": {
      "1779208656259-0.5678": 1779208656259,
      "1779208656271-0.2590": 1779208656271
    }
  }
}
```

## Development

### Adding New Tests

1. Create a new function in `api-client.js`:
   ```javascript
   async function testNewFeature() {
     clearResult('element-id');
     displayLoading('element-id', 'Testing...');
     
     try {
       const response = await fetch(`${getApiHost()}/new-endpoint`);
       const data = await response.json();
       displayResult('element-id', { status: response.status, data }, response.ok);
     } catch (error) {
       displayResult('element-id', { error: error.message }, false);
     }
   }
   ```

2. Add corresponding HTML card in `index.html`:
   ```html
   <div class="card">
     <h2>🆕 New Feature</h2>
     <p>Description of what this tests.</p>
     <button onclick="testNewFeature()">Test</button>
     <div id="element-id"></div>
   </div>
   ```

## Notes

- Test UI is stateless—each test is independent
- Results persist until next test or page refresh
- Rate limit resets after configured window duration
- Redis debug shows per-client state (based on client IP)

## License

Part of OtelRedisNative project
