# Domku - Subdomain Management Platform

## Overview

Domku is a full-stack web application that provides subdomain management capabilities integrated with Cloudflare's DNS API. The platform allows users to create, edit, and manage subdomains with support for A, CNAME, and AAAA DNS records. Built with a modern tech stack, it features a React frontend, Express.js backend, and PostgreSQL database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: Custom components built with Radix UI primitives and styled with Tailwind CSS
- **Styling**: Tailwind CSS with custom dark theme configuration
- **Form Management**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Design**: RESTful API with JSON responses
- **Request Handling**: Express middleware for JSON parsing, URL encoding, and request logging
- **Error Handling**: Centralized error handling middleware

### Data Storage
- **Database**: PostgreSQL (configured for compatibility with Neon Database)
- **ORM**: Drizzle ORM with migration support
- **Schema**: Type-safe database schema with Zod validation
- **Storage Interface**: Abstract storage interface with in-memory implementation for development

## Key Components

### Database Schema
- **Users Table**: Basic user management with username/password authentication
- **Subdomains Table**: Stores subdomain records with DNS type, target, status, Cloudflare record ID, and user IP tracking

### API Endpoints
- **GET /api/subdomains**: Retrieve user's subdomains based on IP address
- **POST /api/create**: Create new subdomain with Cloudflare integration
- **PUT /api/update/:id**: Update existing subdomain
- **DELETE /api/delete/:id**: Delete subdomain and remove from Cloudflare
- **GET /api/check-availability**: Check subdomain name availability

### Frontend Pages
- **Landing Page**: Marketing page showcasing platform features
- **Dashboard**: Main application interface for subdomain management
- **API Documentation**: Public API documentation for developers

### Security Features
- **Rate Limiting**: Maximum 5 subdomains per IP address
- **Blocked Subdomains**: Predefined list of restricted subdomain names (admin, api, mail, etc.)
- **Input Validation**: Comprehensive validation using Zod schemas
- **IP-based Access Control**: Uses client IP for user identification

## Data Flow

1. **Subdomain Creation**: User submits form → Validation → Availability check → Cloudflare API call → Database storage
2. **Real-time Updates**: Dashboard automatically refreshes subdomain list every 30 seconds
3. **DNS Management**: All DNS operations go through Cloudflare API with proper error handling
4. **State Management**: TanStack Query handles caching, synchronization, and optimistic updates

## External Dependencies

### Core Dependencies
- **Cloudflare API**: DNS record management through REST API
- **Neon Database**: PostgreSQL hosting (via @neondatabase/serverless)
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **Date-fns**: Date manipulation and formatting

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Production bundling for server code
- **Drizzle Kit**: Database migration management

## Deployment Strategy

### Development Mode
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with watch mode
- **Database**: Development migrations with `drizzle-kit push`

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Database**: Production-ready PostgreSQL with connection pooling
- **Environment**: Requires `DATABASE_URL`, `CF_API_TOKEN`, and `CF_ZONE_ID` environment variables

### Key Architectural Decisions

1. **IP-based User Identification**: Chosen over traditional authentication for simplicity and accessibility
2. **Cloudflare Integration**: Direct API integration provides reliable DNS management
3. **TypeScript Full Stack**: Ensures type safety and better developer experience
4. **Component-based UI**: Modular design with reusable components for maintainability
5. **Abstract Storage Layer**: Allows for easy switching between storage implementations
6. **Real-time Data**: Auto-refresh ensures users see current subdomain status
7. **Vercel-Compatible API Structure**: `/api` folder structure for serverless deployment compatibility

## Recent Changes

### July 20, 2025 - Vercel Deployment Optimization
- **Fixed Domain Display**: Updated subdomain display to show correct `test.domku.my.id` format
- **Created Vercel API Structure**: Added `/api` folder with TypeScript handlers for Vercel compatibility
- **Enhanced Form UX**: Added real-time domain preview in subdomain creation form
- **Comprehensive Testing**: Implemented full deployment pipeline testing including:
  - Build verification (`npm run build` - successful 16s build)
  - Production preview testing (`vite preview` - working on port 4173)
  - API endpoint validation (all endpoints responding correctly)
  - Vercel configuration validation (proper framework preset configuration)
  - Cloudflare integration testing (DNS records creating successfully)
- **Deployment Ready**: Application verified for Vercel free tier deployment with optimized bundle sizes

### Testing Results
- ✅ Build Process: Clean build with optimized assets (CSS: 63KB, JS: 521KB)
- ✅ API Endpoints: All endpoints (`/api/create`, `/api/check-availability`) functioning correctly
- ✅ Domain Validation: Blocked subdomains and format validation working properly
- ✅ Cloudflare Integration: DNS record creation and management operational
- ✅ Frontend Functionality: React application loading and interactive
- ✅ Production Build: Vite preview server running successfully
