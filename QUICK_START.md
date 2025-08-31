# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Cal.com API key:

```env
CALCOM_API_KEY=your_cal_com_api_key_here
```

### 3. Build and Start

```bash
npm run build
npm start
```

### 4. Test the API

**Health Check:**

```bash
curl http://localhost:3000/health
```

**Get Current Date:**

```bash
curl http://localhost:3000/api/date
```

**Get Available Slots (replace `3139331` with your event type ID):**

```bash
curl "http://localhost:3000/api/slots/available?eventTypeId=3139331"
```

## 📋 Your Event Type ID

To find your Cal.com event type ID:

1. Go to your Cal.com dashboard
2. Click on an event type
3. Look at the URL: `https://cal.com/event-types/[EVENT_TYPE_ID]`
4. Use that number in the API calls

## 🧪 Test Available Slots

Replace `YOUR_EVENT_TYPE_ID` with your actual event type ID:

```bash
# Basic request
curl "http://localhost:3000/api/slots/available?eventTypeId=YOUR_EVENT_TYPE_ID"

# With date range (next 7 days)
curl "http://localhost:3000/api/slots/available?eventTypeId=YOUR_EVENT_TYPE_ID&start=$(date -u +%Y-%m-%dT%H:%M:%SZ)&end=$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)"

# With timezone
curl "http://localhost:3000/api/slots/available?eventTypeId=YOUR_EVENT_TYPE_ID&timezone=America/New_York"
```

## 📖 Full Documentation

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## ❗ Troubleshooting

**Server won't start?**

- Make sure port 3000 is free: `lsof -ti:3000 | xargs kill -9`
- Check your `.env` file has the correct API key

**API returns authentication error?**

- Verify your Cal.com API key is correct
- Make sure the API key has proper permissions

**No slots returned?**

- Check that your event type ID is correct
- Ensure your event type is published and active
- Try a different date range
