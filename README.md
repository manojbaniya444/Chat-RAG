# ChatWithPDF - Intelligent Document Conversations

A modern, enterprise-grade Next.js application that enables users to upload PDF documents and engage in intelligent conversations with them using advanced AI technology. Built with industry best practices, clean architecture, and scalable design patterns.

## Features

### Core Functionality

- **Smart PDF Upload**: Drag & drop interface with real-time validation and progress tracking
- **Intelligent Text Processing**: Advanced text extraction and chunking with semantic understanding
- **AI-Powered Conversations**: Context-aware chat interface with document-specific responses
- **Vector Search**: Semantic search across document content using Pinecone vector database
- **Real-time Streaming**: Live AI responses with streaming capabilities

### User Experience

- **Secure Authentication**: Enterprise-grade authentication with Clerk
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Rate Limiting**: Intelligent rate limiting to prevent abuse
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Loading States**: Smooth transitions and loading indicators

### Developer Experience

- **Type Safety**: Full TypeScript implementation with strict type checking
- **Server Components**: Leveraging Next.js 15 App Router with Server Components
- **Server Actions**: Modern form handling and mutations with Server Actions
- **Clean Architecture**: Separation of concerns with service layers and validation

## Architecture

### Technology Stack

#### Frontend

- **Next.js 15**: App Router with React Server Components
- **React 19**: Latest React features with modern patterns
- **TypeScript**: Strict type safety and developer experience
- **Tailwind CSS**: Utility-first styling with custom design system

#### Backend & Services

- **Prisma ORM**: Type-safe database operations with PostgreSQL
- **Clerk Authentication**: Secure user management and authentication
- **Supabase Storage**: Scalable file storage with signed URLs
- **Pinecone Vector DB**: High-performance vector search and embeddings
- **Groq AI**: Fast AI completions with streaming support

#### Validation & Security

- **Zod**: Runtime type validation and schema validation
- **Rate Limiting**: Built-in rate limiting service
- **Input Sanitization**: Comprehensive input validation and sanitization
- **Error Boundaries**: Client-side error handling and recovery

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication pages
│   ├── chat/                    # Chat application
│   │   ├── [id]/               # Individual chat pages
│   │   └── _components/        # Chat-specific components
│   ├── api/                    # Legacy API routes (being phased out)
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Landing page
├── components/                  # Reusable UI components
│   ├── layout/                 # Layout components (Header, Footer)
│   ├── pdf/                    # PDF-specific components
│   ├── ui/                     # Base UI components (shadcn/ui)
│   └── error-boundary.tsx      # Error handling components
├── lib/                        # Core library functions
│   ├── actions/                # Server Actions
│   │   ├── chat.actions.ts     # Chat-related server actions
│   │   └── pdf.actions.ts      # PDF processing actions
│   ├── services/               # Business logic services
│   │   ├── chat.service.ts     # Chat operations
│   │   ├── pdf.service.ts      # PDF processing
│   │   └── rate-limit.service.ts # Rate limiting
│   ├── validations.ts          # Zod schemas and validation
│   ├── embeddings.ts           # AI embeddings operations
│   ├── pinecone.ts             # Vector database operations
│   ├── prisma.ts               # Database client
│   └── supabaseClient.ts       # Storage client
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript type definitions
├── utils/                      # Utility functions
└── middleware.ts               # Clerk authentication middleware
```

## Service Layer Architecture

### Chat Service (`ChatService`)

- User chat management with caching
- Message operations with rate limiting
- Chat history and metadata management
- Database query optimization

### PDF Service (`PDFService`)

- File upload and processing pipeline
- Text extraction and chunking
- Vector embedding generation
- Storage management with cleanup

### Rate Limiting Service (`RateLimitService`)

- Per-user message limits (25/day)
- Per-chat message limits (15/chat)
- Upload rate limiting (5/hour)
- Cooldown period management

## 🔧 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** database
- **Clerk** account for authentication
- **Supabase** account for file storage
- **Pinecone** account for vector database
- **Groq** API key for AI completions

### Environment Setup

Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chatpdf"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_BUCKET_ID=pdf-documents

# Pinecone Vector Database
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=chatpdf-embeddings

# Groq AI
GROQ_API_KEY=gsk_...
```

### Installation & Setup

1. **Clone and Install**:

```bash
git clone <repository-url>
cd chatdoc
npm install
```

2. **Database Setup**:

```bash
npx prisma generate
npx prisma db push
```

3. **Development Server**:

```bash
npm run dev
```

4. **Production Build**:

```bash
npm run build
npm start
```

## Performance & Limits

### Rate Limits

- **Daily Messages**: 25 messages per user per 24 hours
- **Chat Messages**: 15 messages maximum per chat session
- **File Uploads**: 5 uploads per user per hour
- **File Size**: 5MB maximum per PDF

### Performance Optimizations

- **Server Components**: Reduced client-side JavaScript
- **Caching**: React cache for database queries
- **Streaming**: Real-time AI response streaming
- **Lazy Loading**: Component-level code splitting
- **Image Optimization**: Next.js automatic image optimization

## Testing & Quality

### Code Quality

- **ESLint**: Strict linting rules with Next.js configuration
- **TypeScript**: Strict mode with comprehensive type coverage
- **Error Boundaries**: Comprehensive error handling
- **Input Validation**: Zod schemas for all inputs

### Security Features

- **Authentication**: Clerk-powered secure authentication
- **Authorization**: Server-side route protection
- **Input Sanitization**: All user inputs validated and sanitized
- **Rate Limiting**: Built-in abuse prevention
- **CORS**: Proper cross-origin resource sharing

## Deployment

### Recommended Platforms

- **Vercel**: Optimized for Next.js with zero-config deployment
- **Railway**: Easy database and application deployment
- **Supabase**: Managed PostgreSQL with built-in features

### Environment Variables for Production

Ensure all environment variables are properly configured in your deployment platform.

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork & Branch**: Create a feature branch from `main`
2. **Code Style**: Follow the existing code style and conventions
3. **Type Safety**: Ensure all code is properly typed
4. **Testing**: Add tests for new features
5. **Documentation**: Update documentation for changes
6. **Pull Request**: Create a descriptive PR with clear goals

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

## 📄 API Documentation

### Server Actions

#### Chat Actions

- `getChatsAction()`: Retrieve user's chat list
- `getChatWithMessagesAction(chatId)`: Get chat with messages
- `deleteChatAction(formData)`: Delete a chat
- `updateChatTitleAction(chatId, title)`: Update chat title

#### PDF Actions

- `uploadAndProcessPdfAction(formData)`: Complete PDF upload workflow
- `generateUploadUrlAction(formData)`: Generate signed upload URL
- `processPdfAction(formData)`: Process uploaded PDF

## 📋 Roadmap

### Upcoming Features

- [ ] Multiple file format support (Word, PowerPoint, etc.)
- [ ] Advanced search and filtering
- [ ] Chat export functionality
- [ ] Team collaboration features
- [ ] API for third-party integrations
- [ ] Mobile app development

### Performance Improvements

- [ ] Background job processing
- [ ] Enhanced caching strategies
- [ ] CDN integration
- [ ] Database query optimization
