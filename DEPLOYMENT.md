# Vercel Deployment Guide

## Prerequisites

1. Install Vercel CLI: `npm i -g vercel`
2. Have a Vercel account at [vercel.com](https://vercel.com)
3. Have your Cal.com API key ready

## Deployment Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Login to Vercel

```bash
vercel login
```

### 4. Deploy to Vercel

```bash
vercel
```

Follow the prompts:

- Link to existing project? **N**
- What's your project's name? **calendar-api-integration**
- In which directory is your code located? **./**

### 5. Set Environment Variables

After deployment, set your environment variables in the Vercel dashboard or via CLI:

```bash
vercel env add CALCOM_API_KEY
vercel env add CALCOM_BASE_URL
vercel env add NODE_ENV
```

Or set them in the Vercel dashboard:

- Go to your project settings
- Navigate to "Environment Variables"
- Add the following variables:

| Variable          | Value                    | Environment                      |
| ----------------- | ------------------------ | -------------------------------- |
| `CALCOM_API_KEY`  | Your Cal.com API key     | Production, Preview, Development |
| `CALCOM_BASE_URL` | `https://api.cal.com/v2` | Production, Preview, Development |
| `NODE_ENV`        | `production`             | Production                       |
| `LOG_LEVEL`       | `info`                   | Production, Preview, Development |

### 6. Redeploy with Environment Variables

```bash
vercel --prod
```

## API Endpoints

After deployment, your API will be available at:

- `https://your-project.vercel.app/health` - Health check
- `https://your-project.vercel.app/api/date` - Current date
- `https://your-project.vercel.app/api/slots/available` - Available slots
- `https://your-project.vercel.app/api/slots/reserve` - Reserve slot
- `https://your-project.vercel.app/api/slots/:id` - Update reservation

## Testing Your Deployment

1. **Health Check**:

   ```bash
   curl https://your-project.vercel.app/health
   ```

2. **Get Current Date**:

   ```bash
   curl https://your-project.vercel.app/api/date
   ```

3. **Get Available Slots**:
   ```bash
   curl "https://your-project.vercel.app/api/slots/available?eventTypeId=123"
   ```

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Set**: Make sure all required environment variables are configured in Vercel dashboard

2. **Build Errors**: Check that TypeScript compiles without errors:

   ```bash
   npm run build
   ```

3. **API Key Issues**: Verify your Cal.com API key is valid and has the necessary permissions

4. **CORS Issues**: The API includes CORS middleware, but you may need to configure specific origins for production

### Logs and Monitoring:

- View deployment logs in Vercel dashboard
- Use `vercel logs` command to see runtime logs
- Monitor function performance in Vercel analytics

## Local Development vs Production

- **Local**: Uses `src/index.ts` with Express server
- **Vercel**: Uses `api/index.ts` as serverless function
- Both share the same Express app configuration from `src/app.ts`
