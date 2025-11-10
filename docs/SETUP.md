# PrepWise.AI Setup Guide

## Quick Start

### 1. Prerequisites

- **Node.js 18+** and npm
- **Azure Account** with the following services:
  - Azure OpenAI (deployment: `gpt-4o` recommended)
  - Azure Blob Storage
  - Azure Speech Service

### 2. Azure Resource Setup

#### Azure OpenAI
1. Create an Azure OpenAI resource in Azure Portal
2. Deploy a model (recommended: `gpt-4o` for best results)
3. Note your endpoint URL and API key
4. Ensure the deployment supports JSON schema structured outputs (API version `2024-02-15-preview` or later)
5. **Important**: The endpoint should be the base URL only (e.g., `https://your-resource.openai.azure.com/`). The system will automatically handle path and query parameters.

#### Azure Blob Storage
1. Create a Storage Account
2. Create a container named `prepwise-assets`
3. Set container access to **Private**
4. Get the connection string from Access Keys

#### Azure Speech Service
1. Create a Speech Service resource
2. Note your subscription key and region (e.g., `eastus`)

### 3. Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd PrepWise.AI/prepwise

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your Azure credentials
```

### 4. Environment Variables

Create `prepwise/.env.local` with the following:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-10-01-preview
# Note: You can use newer API versions like 2025-01-01-preview if supported by your Azure OpenAI resource

# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=prepwise-assets

# Azure Speech Service Configuration
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=eastus

# Optional: Supabase for persistence (falls back to in-memory if not provided)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

> **Note**: 
> - The `AZURE_OPENAI_ENDPOINT` should be the base URL only. The system automatically handles path and query parameters.
> - If Supabase is not configured, the app will use an in-memory store (data is lost on server restart).
> - All environment variables are optional except Azure OpenAI and Azure Speech (for full functionality).

### 5. Run the Application

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### 6. Testing the Application

1. **Upload Resume**: Upload a PDF or DOCX resume
   - Essay prompt field is optional and starts empty
   - You can optionally provide an essay prompt or upload an essay file
2. **Generate Interview Plan**: Click "Generate Interview" to create personalized questions
   - The system generates 5 interview questions and 1-2 essay prompts
   - Essay prompts have a 250-word target (500-word maximum)
3. **Complete Essay** (if prompted): Write essay responses
   - Target: 250 words (minimum: 200 words, 80% of target)
   - Maximum: 500 words
   - Real-time word count feedback with color-coded validation
4. **Start Interview**: Launch the video interview interface
   - Grant camera and microphone permissions
   - You can skip the preparation time if ready
   - Answer each question (30s prep, 60s response)
5. **Record Responses**: Answer each question
   - System handles missing audio/video gracefully
   - Transcripts are generated via Azure Speech SDK
6. **View Results**: Review the performance dashboard
   - View tone analysis, confidence analysis, and communication clarity
   - Review question-wise feedback
   - Download PDF report

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Import your GitHub repository in Vercel
2. Configure environment variables in Vercel Project Settings
3. Add all environment variables from `.env.local`
4. Set the build command to `npm run build` (default)
5. Set the output directory to `.next` (default)
6. Deploy

### 3. Post-Deployment

1. Ensure Azure Blob container exists:
   ```bash
   az storage container create --name prepwise-assets --connection-string "your-connection-string"
   ```

2. Test the deployment:
   - Upload a resume
   - Generate interview questions
   - Complete a mock interview
   - Download the PDF report

3. Verify environment variables are set correctly in Vercel:
   - Check that all Azure credentials are configured
   - Verify Supabase credentials if using persistent storage

## Troubleshooting

### Common Issues

1. **"Missing required environment variable"**
   - Ensure all Azure credentials are set in `.env.local` or Vercel
   - Check that variable names match exactly (case-sensitive)
   - Restart the development server after changing `.env.local`

2. **"Camera/Mic blocked"**
   - Grant browser permissions for camera and microphone
   - Use HTTPS or localhost (required for MediaRecorder API)
   - Check browser settings for media permissions

3. **"Azure Speech transcription failed"**
   - Verify Azure Speech Service is configured correctly
   - Check that the region matches your Speech resource
   - Ensure audio format is supported (webm is supported)
   - The system will continue with placeholder data if transcription fails

4. **"Failed to parse resume"**
   - Verify the resume file is a valid PDF or DOCX
   - Check Azure OpenAI quota and deployment status
   - Ensure the deployment supports structured outputs (JSON schema)
   - Check that the API version supports JSON mode

5. **"Storage upload failed"**
   - Verify Azure Blob Storage connection string
   - Check container exists and is accessible
   - Ensure storage account has proper permissions
   - Upload failures are logged but don't block the interview flow

6. **"Candidate profile not found"**
   - This is fixed by sending profile and plan from frontend
   - Ensure you're using the latest version of the code
   - Check that the resume was successfully parsed

7. **"AudioInputStream not available"**
   - This is fixed by using `require()` for Azure Speech SDK
   - Ensure `serverExternalPackages` is configured in `next.config.ts`
   - Restart the development server after changes

8. **"White text on white background"**
   - This is fixed in the latest version
   - All form inputs now have explicit text colors
   - Refresh your browser to see the changes

### Debug Mode

Enable verbose logging by checking server logs in the terminal where `npm run dev` is running. The application logs detailed information about:
- Azure OpenAI API calls
- Speech transcription process
- Evaluation pipeline
- Error messages with context

Check browser console and server logs for detailed error messages.

## Architecture Overview

### Frontend
- **Next.js 16** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Plotly.js** for visualizations
- **MediaRecorder API** for video/audio capture

### Backend
- **Next.js API Routes** (serverless)
- **Azure OpenAI** for AI capabilities
- **Azure Speech SDK** for transcription (CommonJS compatibility)
- **Azure Blob Storage** for asset storage
- **Supabase** (optional) for data persistence
- **PDFKit** for PDF report generation

### Data Flow

1. **Resume Upload** → Azure Blob Storage → Azure OpenAI parsing → Store profile
2. **Question Generation** → Azure OpenAI → Store plan (frontend state + backend store)
3. **Essay Response** → Validate word count → Store essay
4. **Video Recording** → MediaRecorder → Azure Blob Storage
5. **Transcription** → Azure Speech SDK → Extract transcript and metrics
6. **Evaluation** → Azure OpenAI analysis → Generate scores and feedback
7. **Report Generation** → PDFKit → Download

### Module Compatibility

The application uses CommonJS modules (`pdf-parse`, `microsoft-cognitiveservices-speech-sdk`) which require special configuration in Next.js:

- **next.config.ts**: Configured with `serverExternalPackages` to handle CommonJS modules
- **Azure Speech SDK**: Imported using `require()` for Next.js compatibility
- **pdf-parse**: Using v2 class-based API with proper cleanup

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use Vercel environment variables** for production secrets
3. **Restrict Azure Blob Storage** access (private containers)
4. **Use Supabase service role key** only on server-side
5. **Validate file uploads** (type, size limits)
6. **Implement rate limiting** for API routes (production)
7. **Sanitize user inputs** before processing
8. **Handle errors gracefully** without exposing sensitive information

## Performance Optimization

1. **Azure OpenAI**: Use `gpt-4o` for best results (can use `gpt-4o-mini` for cost optimization)
2. **Blob Storage**: Use hot tier for frequently accessed assets
3. **Caching**: Implement Redis caching for profiles (future)
4. **CDN**: Use Azure CDN for static assets (future)
5. **Edge Cases**: System handles missing data gracefully without blocking the flow

## Support

For issues or questions:
1. Check the [README.md](../prepwise/README.md)
2. Review [workflow.md](./workflow.md) for implementation details
3. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
4. Check Azure service status and quotas
5. Review browser console and server logs

## API Health Check

Visit `http://localhost:3000/api/health` to verify your Azure OpenAI configuration is loaded correctly. This endpoint returns:
- Azure OpenAI configuration status
- Missing environment variables (if any)
- Service availability
