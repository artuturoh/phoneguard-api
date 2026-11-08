# 🛡️ PhoneGuard API

> **Ultra-Fast International Phone Intelligence & SMS Fraud Shield**  
> High-performance microservice designed for RapidAPI, 100% in-memory processing (< 2ms latency), canonical E.164 formatting, line type classification (Mobile, VoIP, Landline), IANA timezone resolution, and real-time fraud risk scoring.

---

## 🚀 Key Highlights

- **⚡ Sub-2ms Latency:** Zero external database roundtrips. Powered by pre-compiled binary datasets (`libphonenumber-js/max` and `countries-and-timezones`) residing strictly in RAM.
- **📱 Line-Type Detection:** Accurately isolates `MOBILE`, `FIXED_LINE`, `FIXED_LINE_OR_MOBILE`, `VOIP`, `TOLL_FREE`, `PREMIUM_RATE`, and `SHARED_COST`.
- **✉️ SMS Deliverability Flag:** Immediate `canReceiveSms: true/false` decision to protect SMS delivery budgets from being wasted on landlines or virtual burner lines.
- **🛡️ Fraud Risk Score & Recommendation:** Computes `riskScore` (0–100) and actionable `recommendation` (`allow`, `review`, `block`) with reason codes.
- **🌐 240+ Countries & IANA Timezones:** Automatically resolves country ISO 3166-1 alpha-2, country names, calling codes, and complete timezones arrays.
- **🔒 RapidAPI Proxy Secret Enforcement:** Built-in middleware validates `X-RapidAPI-Proxy-Secret` to ensure traffic originates strictly through the RapidAPI gateway.
- **🖥️ Developer-First Landing Page:** Content negotiation serves a modern dark-mode interactive testing playground at `GET /` when accessed by browsers, or JSON metadata for API consumers.

---

## 📦 Project Structure

```
phoneguard-api/
├── public/
│   └── index.html               # Modern dark-mode landing page & interactive tester (Tailwind CDN)
├── src/
│   ├── config/
│   │   └── env.js               # Environment variables & microservice configuration
│   ├── controllers/
│   │   ├── metaController.js    # GET / (content negotiation) & GET /health
│   │   └── phoneController.js   # POST /v1/validate, GET /v1/validate, POST /v1/validate/batch
│   ├── middleware/
│   │   ├── auth.js              # RapidAPI proxy secret verification
│   │   └── errorHandler.js      # Centralized error handler & Zod validation translator
│   ├── routes/
│   │   ├── index.js             # Root routing
│   │   └── v1.js                # Protected /v1 API routes
│   ├── schemas/
│   │   └── validation.js        # Strict Zod schemas for single, query, and batch requests
│   ├── services/
│   │   ├── countryService.js    # In-memory country & timezone resolution
│   │   └── phoneService.js      # Core phone validation, formatting & fraud scoring engine
│   ├── app.js                   # Express application factory with Helmet CSP & CORS
│   └── server.js                # Server bootstrap with graceful shutdown
├── test/
│   ├── api.test.js              # Endpoint tests (POST /v1/validate, batch, GET)
│   ├── landing.test.js          # Content negotiation, healthcheck, Helmet CSP
│   ├── phoneService.test.js     # Engine unit tests & execution latency benchmarks
│   └── security.test.js         # RapidAPI proxy secret enforcement tests
├── .env.example
├── package.json
└── README.md
```

---

## 🛠️ Quickstart

### 1. Requirements
- Node.js 18.0.0+ (Tested on Node.js 20.x)
- npm 9+

### 2. Installation
```bash
npm install
```

### 3. Run the Microservice
```bash
# Start in production mode
npm start

# Start in development mode with auto-reload
npm run dev
```

The server starts on port `3000` by default. Visit `http://localhost:3000/` in your browser to interact with the Developer Playground.

---

## 🧪 Running the Test Suite

Execute the automated test suite powered by `node:test` and `supertest`:

```bash
npm test
```

---

## 📡 API Endpoints

### 1. `POST /v1/validate`
Validates a single international phone number.

#### Request Body
```json
{
  "phone": "+14155552671",
  "defaultCountry": "US"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "phone": "+14155552671",
    "isValid": true,
    "isPossible": true,
    "lineType": "FIXED_LINE_OR_MOBILE",
    "canReceiveSms": true,
    "formats": {
      "e164": "+14155552671",
      "international": "+1 415 555 2671",
      "national": "(415) 555-2671",
      "rfc3966": "tel:+14155552671"
    },
    "country": {
      "code": "US",
      "name": "United States of America",
      "callingCode": "+1",
      "continent": "North America",
      "timezones": [
        "America/New_York",
        "America/Detroit",
        "America/Chicago",
        "America/Los_Angeles"
      ],
      "primaryTimezone": "America/Adak",
      "totalTimezones": 29
    },
    "fraudAnalysis": {
      "riskScore": 15,
      "recommendation": "allow",
      "reasons": [
        "AMBIGUOUS_MOBILE_OR_FIXED_PREFIX",
        "SMS_DELIVERY_SUPPORTED"
      ]
    }
  },
  "meta": {
    "execution_time_ms": 0.35,
    "timestamp": "2026-11-08T07:45:00.000Z"
  }
}
```

---

### 2. `POST /v1/validate/batch`
Validates an array of up to 50 phone numbers concurrently in RAM.

#### Request Body
```json
{
  "numbers": [
    "+34612345678",
    { "phone": "3312345678", "defaultCountry": "MX" },
    "+18005550199"
  ]
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "summary": {
    "total": 3,
    "valid": 3,
    "invalid": 0,
    "recommendations": {
      "allow": 2,
      "review": 1,
      "block": 0
    },
    "execution_time_ms": 0.85
  },
  "data": [
    { /* Phone 1 details */ },
    { /* Phone 2 details */ },
    { /* Phone 3 details */ }
  ],
  "meta": {
    "execution_time_ms": 0.85,
    "timestamp": "2026-11-08T07:45:00.000Z"
  }
}
```

---

### 3. `GET /v1/validate`
Fast GET method accepting query parameters.

```bash
GET /v1/validate?phone=%2B523312345678&country=MX
```

---

### 4. `GET /health`
Keep-alive probe providing real-time system metrics.

```json
{
  "status": "ok",
  "service": "PhoneGuard API",
  "version": "1.0.0",
  "uptime_seconds": 1284.52,
  "memory_mb": {
    "rss": 42.15,
    "heap_used": 18.23,
    "heap_total": 24.11
  },
  "timestamp": "2026-11-08T07:45:00.000Z"
}
```

---

## 🔐 RapidAPI Security Configuration

To ensure consumers only access your API via RapidAPI's proxy, set the environment variable:

```bash
RAPIDAPI_PROXY_SECRET=your_secret_token_from_rapidapi_dashboard
```

When configured:
- Incoming calls to `/v1/*` must include header: `X-RapidAPI-Proxy-Secret: your_secret_token_from_rapidapi_dashboard`.
- Mismatched or missing headers return `401 Unauthorized`.
- Public landing page (`GET /`) and health check (`GET /health`) remain open for uptime monitors.

---

## 📄 License
MIT License. Built for high-volume developer platforms and RapidAPI.
