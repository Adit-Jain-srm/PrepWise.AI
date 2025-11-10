# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Candidate profile not found" Error

**Symptom**: Error message "Candidate profile not found. Please upload a resume first." when generating interview plan.

**Solution**: 
- This issue has been fixed in the latest version
- The system now sends the profile from frontend state to avoid store lookup issues
- Ensure you're using the latest version of the code
- Check that the resume was successfully parsed before generating the plan

**Prevention**: The system now sends both `candidateId` and `profile` from frontend state when generating the plan, ensuring the API has the data even if the store is unavailable.

---

### 2. Azure Speech SDK "AudioInputStream not available" Error

**Symptom**: Error message "Cannot read properties of undefined (reading 'AudioInputStream')" in speech transcription.

**Solution**:
- This is fixed by using `require()` for Azure Speech SDK import
- Ensure `serverExternalPackages: ["microsoft-cognitiveservices-speech-sdk"]` is configured in `next.config.ts`
- Restart the development server after changes
- The SDK is now properly configured for Next.js CommonJS compatibility

**Prevention**: The system uses `require()` for Azure Speech SDK and configures `serverExternalPackages` in Next.js config.

---

### 3. "Failed to parse PDF file" Error

**Symptom**: Error message "Failed to parse PDF file: pdfParse is not a function" or similar.

**Solution**:
- This is fixed by using pdf-parse v2 class-based API
- Ensure `serverExternalPackages: ["pdf-parse"]` is configured in `next.config.ts`
- The system now uses `new PDFParse({ data: buffer }).getText()` instead of a function call
- Restart the development server after changes

**Prevention**: The system uses pdf-parse v2 API correctly and configures `serverExternalPackages` in Next.js config.

---

### 4. "Resume parsing failed: Invalid input: expected string, received null" Error

**Symptom**: Zod validation error when parsing resume JSON response.

**Solution**:
- This is fixed by using `.nullish()` in Zod schemas instead of `.optional()`
- The system now handles `null` values from LLM responses correctly
- Null values are converted to `undefined` in the mapping function
- Ensure you're using the latest version of the code

**Prevention**: The system uses `.nullish()` in Zod schemas and converts `null` to `undefined` in mapping functions.

---

### 5. "500 Internal Server Error" on Resume Upload

**Symptom**: Server error when uploading resume.

**Solution**:
1. **Check Server Logs**: Check the terminal where `npm run dev` is running for detailed error messages
2. **Verify Azure OpenAI Configuration**: 
   - Ensure `AZURE_OPENAI_ENDPOINT` is the base URL only (e.g., `https://your-resource.openai.azure.com/`)
   - The system automatically handles path and query parameters
   - Verify API key is correct and not expired
3. **Check API Version**: Ensure `AZURE_OPENAI_API_VERSION` supports JSON schema (e.g., `2024-02-15-preview` or later)
4. **Verify Deployment**: Check that the deployment name matches `AZURE_OPENAI_DEPLOYMENT`
5. **Check File Format**: Ensure the resume is a valid PDF or DOCX file

**Debug Steps**:
1. Visit `http://localhost:3000/api/health` to verify Azure OpenAI configuration
2. Check server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Test with a different resume file

---

### 6. "Camera/Mic blocked" Error

**Symptom**: Unable to access camera or microphone in the interview recorder.

**Solution**:
- Grant browser permissions for camera and microphone
- Use HTTPS or localhost (required for MediaRecorder API)
- Check browser settings for media permissions
- Restart the browser if permissions are stuck
- Check that no other application is using the camera/microphone

**Prevention**: The system displays clear error messages when camera/microphone access is denied.

---

### 7. "Azure Speech transcription failed" Error

**Symptom**: Speech transcription errors in the evaluation pipeline.

**Solution**:
- Verify Azure Speech Service is configured correctly
- Check that the region matches your Speech resource
- Ensure audio format is supported (webm is supported)
- **The system continues with placeholder data if transcription fails** - this is expected behavior
- Check server logs for detailed error messages

**Prevention**: The system handles transcription errors gracefully and continues evaluation with placeholder transcripts.

---

### 8. "Interview session plan not found" Error

**Symptom**: 404 error when evaluating interview responses.

**Solution**:
- This is fixed by sending the plan from frontend state
- The system now sends both `plan` and `profile` from frontend to avoid store lookup issues
- Ensure you're using the latest version of the code
- Check that the interview plan was successfully generated

**Prevention**: The system sends the plan and profile from frontend state when evaluating responses, ensuring the API has the data even if the store is unavailable.

---

### 9. "White text on white background" Issue

**Symptom**: Text is not visible in form inputs (white text on white background).

**Solution**:
- This is fixed in the latest version
- All form inputs now have explicit text colors (`text-slate-900` on `bg-white`)
- Refresh your browser to see the changes
- Clear browser cache if the issue persists

**Prevention**: All form inputs have explicit text and background colors for proper contrast.

---

### 10. "Essay prompt auto-filled" Issue

**Symptom**: Essay prompt field is automatically filled with "Explain your leadership philosophy."

**Solution**:
- This is fixed in the latest version
- The essay prompt field now starts empty
- The placeholder text shows an example instead
- Clear the field if it's already filled

**Prevention**: The essay prompt field starts with an empty string, and the placeholder shows an example.

---

### 11. "Missing audio/video" Edge Cases

**Symptom**: Errors when audio or video is missing during interview recording.

**Solution**:
- The system now handles missing audio/video gracefully
- Placeholder transcripts are used if audio is missing
- Evaluation continues even if transcription fails
- Check server logs for warnings about missing data

**Prevention**: The system handles edge cases gracefully and continues evaluation with placeholder data.

---

### 12. API Version Compatibility Issues

**Symptom**: Errors related to JSON schema or response format.

**Solution**:
- Ensure `AZURE_OPENAI_API_VERSION` supports JSON schema (e.g., `2024-02-15-preview` or later)
- The system uses `response_format: { type: "json_object" }` for JSON mode
- Try using `2024-08-01-preview` or `2024-10-01-preview` if issues persist
- Check Azure OpenAI documentation for supported API versions

**Prevention**: The system uses JSON mode for reliable parsing and handles API version compatibility.

---

### 13. Environment Variable Issues

**Symptom**: "Missing required environment variable" errors.

**Solution**:
1. **Check `.env.local`**: Ensure all required variables are set
2. **Verify Variable Names**: Check that variable names match exactly (case-sensitive)
3. **Restart Server**: Restart the development server after changing `.env.local`
4. **Check Vercel**: If deploying to Vercel, ensure environment variables are set in project settings
5. **Health Check**: Visit `http://localhost:3000/api/health` to verify configuration

**Required Variables**:
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_CONTAINER`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`

**Optional Variables**:
- `SUPABASE_URL` (falls back to in-memory if not provided)
- `SUPABASE_SERVICE_ROLE_KEY` (falls back to in-memory if not provided)

---

### 14. TypeScript Errors

**Symptom**: TypeScript compilation errors.

**Solution**:
- Run `npm install` to ensure all type definitions are installed
- Check that `@types/pdfkit` is installed (for PDF generation)
- Ensure TypeScript strict mode is enabled
- Check that all types are properly imported
- Restart the TypeScript server in your IDE

**Prevention**: The system uses TypeScript strict mode and includes all necessary type definitions.

---

### 15. Build Errors

**Symptom**: Build failures in Vercel or locally.

**Solution**:
1. **Check Environment Variables**: Ensure all environment variables are set in Vercel
2. **Verify Dependencies**: Run `npm install` to ensure all dependencies are installed
3. **Check Next.js Config**: Ensure `next.config.ts` is configured correctly
4. **Verify Node Version**: Ensure Node.js 18+ is used
5. **Check Build Logs**: Review build logs for detailed error messages

**Prevention**: The system is configured for Vercel deployment with proper Next.js configuration.

---

## Debugging Tips

### 1. Enable Verbose Logging

Check server logs in the terminal where `npm run dev` is running. The application logs:
- Azure OpenAI API calls
- Speech transcription process
- Evaluation pipeline
- Error messages with context

### 2. Health Check Endpoint

Visit `http://localhost:3000/api/health` to verify:
- Azure OpenAI configuration status
- Missing environment variables (if any)
- Service availability

### 3. Browser Console

Check the browser console for:
- Client-side errors
- API response errors
- Network request failures

### 4. Server Logs

Check server logs for:
- Detailed error messages
- API call details
- Transcription process
- Evaluation pipeline

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Documentation**: Review [README.md](../prepwise/README.md) and [SETUP.md](./SETUP.md)
2. **Review Logs**: Check server logs and browser console for detailed error messages
3. **Verify Configuration**: Use the health check endpoint to verify Azure configuration
4. **Test with Sample Data**: Try with a simple resume file to isolate the issue
5. **Check Azure Services**: Verify Azure services are running and have proper quotas

---

## Known Limitations

1. **In-Memory Store**: Data is lost on server restart if Supabase is not configured
2. **Audio Format**: Currently supports webm format (browser default)
3. **File Size**: Very large resume files may exceed Azure OpenAI token limits
4. **Rate Limits**: Azure services have rate limits that may affect performance
5. **Browser Compatibility**: MediaRecorder API requires modern browsers with HTTPS or localhost

---

## Recent Fixes

The following issues have been fixed in the latest version:

- ✅ Candidate profile not found error (send from frontend)
- ✅ Azure Speech SDK import issues (use `require()`)
- ✅ pdf-parse v2 API integration (class-based)
- ✅ Zod schema validation (handle null values)
- ✅ White text on white background (explicit colors)
- ✅ Essay prompt auto-fill (empty by default)
- ✅ Missing audio/video handling (graceful fallback)
- ✅ Interview session plan not found (send from frontend)
- ✅ Enhanced error handling throughout the application
