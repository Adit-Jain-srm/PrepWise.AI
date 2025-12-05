# PrepWise.AI Integration Guide

Complete guide for integrating PrepWise.AI into your existing website or application.

## Table of Contents

1. [Overview](#overview)
2. [Pre-Integration Analysis](#pre-integration-analysis)
3. [Integration Approaches](#integration-approaches)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Payment & Account Setup](#payment--account-setup)
6. [API Integration](#api-integration)
7. [Authentication Integration](#authentication-integration)
8. [Testing & Validation](#testing--validation)
9. [Deployment Considerations](#deployment-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

PrepWise.AI can be integrated into existing websites through multiple approaches:

1. **Embedded Widget** – Iframe or React component embedding
2. **API Integration** – Direct API calls from your backend
3. **White-Label Solution** – Full customization for Enterprise tier
4. **Standalone Deployment** – Deploy PrepWise.AI as a subdomain/subdirectory

This guide covers all approaches with detailed steps and considerations.

---

## Pre-Integration Analysis

### 1. Requirements Assessment

Before integrating, assess your needs:

#### Technical Requirements
- [ ] **Hosting Platform**: Where will PrepWise.AI be hosted?
  - Vercel (recommended)
  - AWS/Azure/GCP
  - Self-hosted
- [ ] **Domain Strategy**: 
  - Subdomain: `prepwise.yourdomain.com`
  - Subdirectory: `yourdomain.com/prepwise`
  - Separate domain: `prepwise-ai.com`
- [ ] **Authentication**: 
  - Use PrepWise.AI's Supabase auth
  - Integrate with your existing auth system (SSO/OAuth)
  - Custom authentication bridge
- [ ] **Database**: 
  - Use PrepWise.AI's Supabase instance
  - Connect to your existing database
  - Hybrid approach (separate user data, shared content)

#### Business Requirements
- [ ] **Pricing Model**: 
  - Use PrepWise.AI's subscription tiers
  - Custom pricing integration
  - Free tier only
- [ ] **Payment Processing**: 
  - Stripe (recommended, built-in)
  - PayPal
  - Custom payment gateway
- [ ] **Branding**: 
  - PrepWise.AI branding (Free/Premium)
  - White-label (Enterprise)
  - Hybrid branding

#### Feature Requirements
- [ ] **Core Features Needed**:
  - Mock interviews only
  - Full platform (quizzes, learning, news)
  - Custom features
- [ ] **User Management**:
  - Separate user accounts
  - Shared user accounts
  - Admin dashboard access

### 2. Cost Analysis

Review [COST_ANALYSIS.md](./COST_ANALYSIS.md) for:
- Per-session API costs
- Infrastructure costs (Azure, Supabase, Vercel)
- Estimated monthly costs based on usage
- Cost optimization strategies

### 3. Technical Stack Compatibility

PrepWise.AI is built with:
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, Node.js
- **Services**: Azure OpenAI, Azure Speech, Azure Blob Storage, Supabase
- **Deployment**: Vercel (recommended) or any Node.js hosting

**Compatibility Checklist**:
- [ ] Node.js 18+ support
- [ ] HTTPS support (required for media recording)
- [ ] CORS configuration capability
- [ ] Environment variable management
- [ ] WebSocket support (optional, for real-time features)

---

## Integration Approaches

### Approach 1: Embedded Widget (Easiest)

**Best for**: Quick integration, minimal customization needed

#### Implementation Steps

1. **Deploy PrepWise.AI** to a subdomain or separate domain
2. **Create Embed Component** in your website:

```typescript
// prepwise-widget.tsx
import { useEffect, useRef } from 'react';

interface PrepWiseWidgetProps {
  userId?: string;
  userEmail?: string;
  tier?: 'free' | 'premium' | 'enterprise';
  onComplete?: (sessionId: string) => void;
}

export function PrepWiseWidget({ userId, userEmail, tier, onComplete }: PrepWiseWidgetProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Listen for messages from PrepWise.AI
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== 'https://prepwise.yourdomain.com') return;

      if (event.data.type === 'SESSION_COMPLETE') {
        onComplete?.(event.data.sessionId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  // Build URL with user context
  const prepwiseUrl = new URL('https://prepwise.yourdomain.com');
  if (userId) prepwiseUrl.searchParams.set('userId', userId);
  if (userEmail) prepwiseUrl.searchParams.set('email', userEmail);
  if (tier) prepwiseUrl.searchParams.set('tier', tier);

  return (
    <iframe
      ref={iframeRef}
      src={prepwiseUrl.toString()}
      width="100%"
      height="800px"
      frameBorder="0"
      allow="camera; microphone; autoplay"
      style={{ border: 'none' }}
    />
  );
}
```

3. **Use in Your Pages**:

```tsx
import { PrepWiseWidget } from './prepwise-widget';

export default function InterviewPage() {
  const handleComplete = (sessionId: string) => {
    console.log('Interview completed:', sessionId);
    // Handle completion in your app
  };

  return (
    <PrepWiseWidget
      userId="user-123"
      userEmail="user@example.com"
      tier="premium"
      onComplete={handleComplete}
    />
  );
}
```

#### Pros
- ✅ Quick to implement
- ✅ Isolated from your codebase
- ✅ Easy to update PrepWise.AI independently
- ✅ No authentication complexity

#### Cons
- ❌ Limited customization
- ❌ iframe limitations (camera/mic permissions)
- ❌ Less seamless user experience

---

### Approach 2: API Integration (Most Flexible)

**Best for**: Full control, custom UI, existing user management

#### Implementation Steps

1. **Set Up API Access**

   Create an API key in PrepWise.AI admin panel (Enterprise feature) or use service account:

```bash
# .env
PREPWISE_API_URL=https://prepwise.yourdomain.com/api
PREPWISE_API_KEY=your-api-key-here
```

2. **Create API Client**

```typescript
// prepwise-client.ts
class PrepWiseClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async parseResume(resumeFile: File): Promise<CandidateProfile> {
    const formData = new FormData();
    formData.append('resume', resumeFile);

    const response = await fetch(`${this.baseUrl}/candidates/parse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to parse resume');
    return response.json();
  }

  async generateInterviewPlan(profile: CandidateProfile, tier: string): Promise<InterviewPlan> {
    const response = await fetch(`${this.baseUrl}/interviews/plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile, tier }),
    });

    if (!response.ok) throw new Error('Failed to generate plan');
    return response.json();
  }

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch(`${this.baseUrl}/interviews/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to transcribe');
    return response.json();
  }

  async evaluateResponse(
    plan: InterviewPlan,
    responses: InterviewResponse[]
  ): Promise<EvaluationResult> {
    const response = await fetch(`${this.baseUrl}/interviews/evaluate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan, responses }),
    });

    if (!response.ok) throw new Error('Failed to evaluate');
    return response.json();
  }

  async generateReport(sessionId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/interviews/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) throw new Error('Failed to generate report');
    return response.blob();
  }
}
```

3. **Use in Your Application**

```typescript
import { PrepWiseClient } from './prepwise-client';

const client = new PrepWiseClient(
  process.env.PREPWISE_API_URL!,
  process.env.PREPWISE_API_KEY!
);

// In your interview flow
async function startInterview(resumeFile: File, userTier: string) {
  // 1. Parse resume
  const profile = await client.parseResume(resumeFile);

  // 2. Generate interview plan
  const plan = await client.generateInterviewPlan(profile, userTier);

  // 3. User records responses (your UI)
  // ...

  // 4. Transcribe audio
  const transcription = await client.transcribeAudio(audioBlob);

  // 5. Evaluate responses
  const evaluation = await client.evaluateResponse(plan, responses);

  // 6. Generate PDF report
  const reportPdf = await client.generateReport(sessionId);

  return { evaluation, reportPdf };
}
```

#### Pros
- ✅ Full control over UI/UX
- ✅ Seamless integration with your design
- ✅ Use your existing authentication
- ✅ Customize user flow

#### Cons
- ❌ More development effort
- ❌ Need to implement recording UI
- ❌ Handle all API error cases
- ❌ Requires API access (Enterprise tier)

---

### Approach 3: White-Label Solution (Enterprise)

**Best for**: Complete branding control, custom domain, full customization

#### Implementation Steps

1. **Contact Sales** for Enterprise tier setup
2. **Custom Domain Configuration**:
   - Point `prepwise.yourdomain.com` to PrepWise.AI deployment
   - SSL certificate setup
   - DNS configuration

3. **Branding Customization**:
   - Logo replacement
   - Color scheme customization
   - Custom email templates
   - Remove PrepWise.AI branding

4. **Custom Features** (if needed):
   - Custom evaluation rubrics
   - Additional question types
   - Custom integrations
   - API extensions

#### Pros
- ✅ Complete branding control
- ✅ Professional appearance
- ✅ Custom features available
- ✅ Dedicated support

#### Cons
- ❌ Higher cost ($99.99/month)
- ❌ Requires Enterprise subscription
- ❌ Custom features may require development

---

### Approach 4: Standalone Deployment

**Best for**: Complete control, self-hosting, data sovereignty

#### Implementation Steps

1. **Clone Repository**:
```bash
git clone https://github.com/your-org/prepwise-ai.git
cd prepwise-ai/prepwise
```

2. **Set Up Environment Variables**:
```bash
cp .env.example .env.local
# Fill in all Azure and Supabase credentials
```

3. **Deploy to Your Infrastructure**:
   - Vercel (recommended)
   - AWS (Amplify, EC2, ECS)
   - Azure (App Service, Container Instances)
   - GCP (Cloud Run, App Engine)
   - Self-hosted (Docker, Kubernetes)

4. **Configure Domain**:
   - Point domain to your deployment
   - Set up SSL certificates
   - Configure CORS if needed

#### Pros
- ✅ Complete control
- ✅ Data sovereignty
- ✅ Custom modifications possible
- ✅ No per-user fees

#### Cons
- ❌ Full infrastructure management
- ❌ All costs are yours
- ❌ Need to maintain updates
- ❌ More complex setup

---

## Step-by-Step Integration

### Phase 1: Preparation (Week 1)

1. **Choose Integration Approach** based on requirements
2. **Set Up Azure Resources**:
   - Azure OpenAI deployment (gpt-4o or gpt-4o-mini)
   - Azure Blob Storage account
   - Azure Speech service
   - See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)

3. **Set Up Supabase**:
   - Create Supabase project
   - Run database migrations (see [SUPABASE_MIGRATION.sql](./SUPABASE_MIGRATION.sql))
   - Configure authentication providers
   - Set up Row Level Security (RLS) policies

4. **Deploy PrepWise.AI**:
   - Deploy to Vercel or your hosting platform
   - Configure environment variables
   - Test health endpoint: `/api/health`

### Phase 2: Authentication Integration (Week 1-2)

#### Option A: Use PrepWise.AI Auth

1. **Configure Supabase Auth Providers**:
   - Email/Password
   - Google OAuth
   - GitHub OAuth
   - Custom OAuth providers

2. **User Flow**:
   - Users sign up/login on PrepWise.AI
   - Session stored in Supabase
   - Your app can check auth status via `/api/auth/user`

#### Option B: Integrate Your Auth System

1. **Create Auth Bridge**:

```typescript
// auth-bridge.ts
export async function syncUserToPrepWise(userId: string, email: string, tier: string) {
  // Create or update user in PrepWise.AI
  const response = await fetch('https://prepwise.yourdomain.com/api/auth/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PREPWISE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, email, tier }),
  });

  return response.json();
}
```

2. **Sync on Login**:
```typescript
// In your auth handler
async function handleLogin(user: YourUser) {
  // Your existing login logic
  await yourAuthService.login(user);

  // Sync to PrepWise.AI
  await syncUserToPrepWise(user.id, user.email, user.subscriptionTier);
}
```

### Phase 3: Payment & Account Setup (Week 2)

See [Payment & Account Setup](#payment--account-setup) section below.

### Phase 4: UI Integration (Week 2-3)

1. **Embed Widget** or **Build Custom UI** based on chosen approach
2. **Test All Flows**:
   - Resume upload
   - Question generation
   - Video recording
   - Evaluation
   - Report generation

### Phase 5: Testing & Launch (Week 3-4)

1. **End-to-End Testing**
2. **Performance Testing**
3. **Security Audit**
4. **User Acceptance Testing**
5. **Launch**

---

## Payment & Account Setup

### Stripe Integration (Recommended)

PrepWise.AI uses Stripe for payment processing. Set up as follows:

#### 1. Stripe Account Setup

1. **Create Stripe Account**: https://dashboard.stripe.com/register
2. **Get API Keys**:
   - Test keys: `pk_test_...` and `sk_test_...`
   - Live keys: `pk_live_...` and `sk_live_...`

3. **Configure Webhooks**:
   - Webhook URL: `https://prepwise.yourdomain.com/api/webhooks/stripe`
   - Events to listen:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

#### 2. Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 3. Create Subscription Products

In Stripe Dashboard, create products:

- **Premium Plan**: $29.99/month
- **Enterprise Plan**: $99.99/month

#### 4. Subscription Flow

```typescript
// subscription-flow.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(
  userId: string,
  tier: 'premium' | 'enterprise'
): Promise<string> {
  const priceId = tier === 'premium' 
    ? process.env.STRIPE_PREMIUM_PRICE_ID!
    : process.env.STRIPE_ENTERPRISE_PRICE_ID!;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    metadata: {
      userId,
      tier,
    },
    success_url: `${yourDomain}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${yourDomain}/pricing`,
  });

  return session.url!;
}
```

#### 5. Webhook Handler

```typescript
// api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      await updateUserSubscription(subscription);
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await cancelUserSubscription(deletedSubscription);
      break;
  }

  return NextResponse.json({ received: true });
}
```

### Alternative Payment Providers

#### PayPal Integration

1. Set up PayPal Business account
2. Create PayPal products
3. Implement PayPal checkout flow
4. Handle webhooks for subscription updates

#### Custom Payment Gateway

1. Implement payment API endpoints
2. Create checkout flow
3. Handle payment callbacks
4. Update user subscription status

---

## API Integration

### Authentication

All API requests require authentication:

```typescript
// Option 1: Session-based (cookies)
const response = await fetch('https://prepwise.yourdomain.com/api/interviews/plan', {
  method: 'POST',
  credentials: 'include', // Include cookies
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

// Option 2: API Key (Enterprise)
const response = await fetch('https://prepwise.yourdomain.com/api/interviews/plan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

### Rate Limiting

API endpoints have rate limits:
- **Free Tier**: 10 requests/minute
- **Premium Tier**: 100 requests/minute
- **Enterprise Tier**: 1000 requests/minute

Handle rate limit errors:

```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  // Wait and retry
  await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter!) * 1000));
}
```

### Error Handling

All API errors follow this format:

```typescript
{
  error: string;
  code?: string;
  details?: any;
}
```

Handle errors:

```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return await response.json();
} catch (error) {
  console.error('API Error:', error);
  // Handle error in UI
}
```

---

## Authentication Integration

### Option 1: Supabase Auth (Built-in)

PrepWise.AI uses Supabase Auth by default. Users sign up/login directly on PrepWise.AI.

**Pros**: Simple, secure, handles all auth complexity
**Cons**: Separate user accounts from your system

### Option 2: SSO Integration

Integrate with your existing SSO provider:

1. **Configure OAuth Provider** in Supabase:
   - Google OAuth
   - Microsoft Azure AD
   - Okta
   - Custom OAuth

2. **Redirect Flow**:
```typescript
// Initiate SSO login
const supabaseUrl = 'https://your-project.supabase.co';
const redirectUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${yourCallbackUrl}`;
window.location.href = redirectUrl;

// Handle callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
if (code) {
  // Exchange code for session
  await supabase.auth.exchangeCodeForSession(code);
}
```

### Option 3: Custom Auth Bridge

Create a bridge between your auth and PrepWise.AI:

```typescript
// auth-bridge.ts
export async function createPrepWiseSession(yourUserToken: string) {
  // Verify token with your auth system
  const user = await verifyToken(yourUserToken);
  
  // Create session in PrepWise.AI
  const response = await fetch('https://prepwise.yourdomain.com/api/auth/create-session', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PREPWISE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      tier: user.subscriptionTier,
    }),
  });

  const { sessionToken } = await response.json();
  return sessionToken;
}
```

---

## Testing & Validation

### 1. Unit Tests

Test API client functions:

```typescript
describe('PrepWiseClient', () => {
  it('should parse resume', async () => {
    const client = new PrepWiseClient(apiUrl, apiKey);
    const profile = await client.parseResume(resumeFile);
    expect(profile).toHaveProperty('full_name');
  });
});
```

### 2. Integration Tests

Test full interview flow:

```typescript
describe('Interview Flow', () => {
  it('should complete full interview', async () => {
    // 1. Parse resume
    const profile = await client.parseResume(resumeFile);
    
    // 2. Generate plan
    const plan = await client.generateInterviewPlan(profile, 'premium');
    expect(plan.questions).toHaveLength(7);
    
    // 3. Transcribe audio
    const transcription = await client.transcribeAudio(audioBlob);
    expect(transcription.transcript).toBeTruthy();
    
    // 4. Evaluate
    const evaluation = await client.evaluateResponse(plan, responses);
    expect(evaluation.overall_score).toBeGreaterThan(0);
  });
});
```

### 3. End-to-End Tests

Use Playwright or Cypress:

```typescript
test('user can complete interview', async ({ page }) => {
  await page.goto('https://yourdomain.com/interview');
  await page.uploadFile('input[type="file"]', 'resume.pdf');
  await page.click('button:has-text("Start Interview")');
  // ... continue test
});
```

### 4. Performance Testing

Test API response times:

```typescript
const startTime = Date.now();
await client.parseResume(resumeFile);
const duration = Date.now() - startTime;
expect(duration).toBeLessThan(5000); // Should complete in < 5s
```

---

## Deployment Considerations

### Environment Variables

Set all required environment variables in your hosting platform:

```bash
# Azure
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_SPEECH_KEY=...

# Supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
```

### CORS Configuration

If embedding PrepWise.AI, configure CORS:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### SSL/HTTPS

**Required** for media recording (camera/microphone access). Ensure:
- SSL certificate is valid
- HTTPS is enforced
- Mixed content is blocked

### Monitoring & Logging

Set up monitoring:

1. **Error Tracking**: Sentry, LogRocket, or similar
2. **Analytics**: Google Analytics, Mixpanel, or custom
3. **Performance**: Vercel Analytics, New Relic, or similar
4. **Uptime**: UptimeRobot, Pingdom, or similar

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: `Access-Control-Allow-Origin` errors

**Solution**: 
- Configure CORS in `next.config.ts`
- Add your domain to allowed origins
- Ensure credentials are included if using cookies

#### 2. Authentication Failures

**Problem**: Users can't log in

**Solution**:
- Check Supabase auth configuration
- Verify environment variables
- Check RLS policies
- Review auth provider settings

#### 3. Payment Not Processing

**Problem**: Stripe checkout fails

**Solution**:
- Verify Stripe API keys (test vs live)
- Check webhook configuration
- Review webhook logs in Stripe dashboard
- Ensure webhook secret is correct

#### 4. API Rate Limiting

**Problem**: Too many requests errors

**Solution**:
- Implement request queuing
- Add retry logic with exponential backoff
- Upgrade to higher tier for higher limits
- Cache responses where possible

#### 5. Media Recording Issues

**Problem**: Camera/microphone not working

**Solution**:
- Ensure HTTPS is enabled
- Check browser permissions
- Verify MediaRecorder API support
- Test in different browsers

### Getting Help

- **Documentation**: Check [docs/](./) folder
- **Issues**: GitHub Issues (if open source)
- **Support**: Enterprise tier includes dedicated support
- **Community**: Discord/Slack (if available)

---

## Next Steps

1. ✅ Choose integration approach
2. ✅ Set up Azure and Supabase resources
3. ✅ Deploy PrepWise.AI
4. ✅ Configure authentication
5. ✅ Set up payment processing
6. ✅ Integrate into your website
7. ✅ Test thoroughly
8. ✅ Launch!

For detailed cost analysis, see [COST_ANALYSIS.md](./COST_ANALYSIS.md).
