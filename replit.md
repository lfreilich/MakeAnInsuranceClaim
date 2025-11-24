# Moreland Estate Management - Insurance Claim Portal

## Overview

A web-based insurance claim submission portal for Moreland Estate Management that enables leaseholders to digitally submit buildings insurance claims. The system facilitates communication between leaseholders and insurance companies, streamlining the claim process through a multi-step guided form with file uploads, AI-enhanced writing assistance, and automated email notifications.

**Core Purpose**: Digital claim intake and facilitation (Moreland acts as an intermediary, not a claim decision-maker)

**Key Features**:
- 8-step progressive disclosure form for claim details
- File upload support for damage photos, quotes, and documents
- AI-powered incident description enhancement
- Digital signature collection
- Automated confirmation emails
- Claim reference number generation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript, using Vite as the build tool

**Routing**: Client-side routing with Wouter (lightweight React Router alternative)

**UI Component Library**: Shadcn UI (Radix UI primitives) with "new-york" style variant
- Design system based on professional property management aesthetics
- Tailwind CSS for styling with custom color scheme (professional blue/slate)
- Inter font family for modern, professional typography

**State Management**:
- React Hook Form for form state with Zod validation
- TanStack Query (React Query) for server state management
- No global state management library (component-level state only)

**Form Architecture**:
- Multi-step wizard pattern (8 steps) with progressive disclosure
- Each step is a separate component with independent validation
- Form data accumulates across steps before final submission
- Zod schemas for runtime validation per step

**Key Design Patterns**:
- Component composition with Radix UI primitives
- Custom hooks for reusable logic (mobile detection, toast notifications)
- Controlled components for all form inputs
- Progressive enhancement approach

### Backend Architecture

**Runtime**: Node.js with Express.js web framework

**Development vs Production**:
- Dev mode: Vite dev server with HMR integrated into Express
- Production: Pre-built static assets served by Express

**API Design**: RESTful endpoints under `/api` prefix
- POST `/api/claims` - Submit new claim
- POST `/api/ai/enhance-description` - AI text enhancement
- File upload endpoints (delegated to object storage service)

**Request Processing**:
- Express middleware for JSON parsing with raw body preservation
- Request logging with timestamps
- Error handling with appropriate HTTP status codes

**Data Layer**:
- Drizzle ORM for type-safe database operations
- Schema-first approach with shared types between client/server
- Transaction support for atomic operations

**File Handling**:
- Object storage integration via Google Cloud Storage SDK
- ACL (Access Control List) system for file permissions
- Public and private file access patterns
- Signed URL generation for secure file access

### Database Architecture

**Database**: PostgreSQL via Neon serverless driver
- WebSocket-based connection pooling
- Environment-based connection string configuration

**Schema Design** (single table approach):
- `claims` table with comprehensive denormalized structure
- All claim data in one table to avoid JOINs
- Array fields for multiple file uploads (PostgreSQL array type)
- Boolean flags for conditional sections (building damage, theft, sublet)

**Key Fields**:
- Claimant information (name, email, phone)
- Property details (address, block, unit)
- Incident details (date, type, description)
- Conditional sections (damage, theft, sublet) with flag-based inclusion
- File paths stored as text arrays
- Signature data and type (drawn vs typed)
- Status tracking and timestamps

**Migration Strategy**: Drizzle Kit for schema migrations
- Schema defined in TypeScript (`shared/schema.ts`)
- Push-based migrations for development (`npm run db:push`)

### External Dependencies

**AI Integration**: OpenAI API via Replit AI Integrations
- Model: GPT-5 (current latest)
- Purpose: Enhance incident descriptions for clarity and professionalism
- Fallback: Text formatting function when AI unavailable
- Uses Replit-provided credentials (billed to Replit credits)

**Email Service**: Nodemailer with SMTP
- Configurable SMTP settings via environment variables
- HTML email templates for claim confirmations
- Fallback to JSON transport in development
- Non-blocking email sending (errors logged but don't fail requests)

**File Storage**: Google Cloud Storage
- Replit Object Storage integration via sidecar service
- External account authentication pattern
- File upload with streaming support
- ACL-based access control

**Third-party UI Libraries**:
- Uppy for advanced file upload UI (dashboard, progress, multi-file)
- React Signature Canvas for digital signatures
- React Day Picker for date selection
- Radix UI for accessible component primitives

**Form Validation**: Zod schemas
- Runtime type checking and validation
- Shared between client and server
- Step-based validation with conditional requirements
- Integration with React Hook Form via @hookform/resolvers

**Development Tools**:
- Replit-specific plugins for runtime error overlay and dev banner
- Cartographer for code navigation
- TypeScript for type safety across full stack

### Configuration Management

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string (required)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - AI service endpoint
- `AI_INTEGRATIONS_OPENAI_API_KEY` - AI service authentication
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- `FROM_EMAIL`, `CLAIMS_EMAIL` - Email addresses

**Build Configuration**:
- Vite for frontend bundling with React plugin
- ESBuild for backend bundling (production)
- Path aliases for cleaner imports (`@/`, `@shared/`, `@assets/`)
- Separate `tsconfig.json` for TypeScript compilation