# Overview

This is an AI Companion Service that allows creators to monetize their personalities through AI-powered chatbots. The application provides a creator dashboard where users can configure AI personas that engage with fans on social media platforms (primarily X/Twitter) through direct messages. The system includes features for safe flirting, content monetization, payment processing, and comprehensive safety/moderation tools to ensure compliant interactions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React and TypeScript using a modern component-based architecture:
- **React Router**: Uses `wouter` for client-side routing with dedicated pages for each major feature
- **State Management**: React Query (`@tanstack/react-query`) handles server state management and caching
- **UI Framework**: Shadcn/UI components built on Radix UI primitives for accessible, customizable interfaces
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Form Handling**: React Hook Form with Zod schema validation for type-safe form management

## Backend Architecture
The server is built with Express.js in TypeScript using a modular service-oriented approach:
- **API Design**: RESTful endpoints organized by feature domain (personas, conversations, content, etc.)
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Service Layer**: Modular services for LLM interactions, moderation, media handling, and audit logging
- **Middleware**: Request logging, error handling, and JSON parsing middleware

## Database Design
PostgreSQL database with comprehensive schema covering all business entities:
- **Core Entities**: Users, Personas, Fans, Conversations, Messages, Content Items
- **Financial**: Payments and revenue tracking
- **Safety**: Audit logs and moderation queue for compliance
- **JSON Fields**: Flexible storage for persona configurations, fan preferences, and metadata

## AI/LLM Integration
- **OpenAI Integration**: Uses GPT-4o for generating contextual, persona-appropriate responses
- **Safety Pipeline**: Multi-layer content moderation with classification, rules engine, and escalation
- **Conversation Memory**: Thread summaries and context management for coherent long-term interactions
- **Persona Configuration**: Detailed voice, behavior, and boundary definitions for consistent character portrayal

## Payment Processing
- **Stripe Integration**: Full payment processing with customer management and subscription handling
- **Revenue Tracking**: Comprehensive analytics and payment history
- **Content Monetization**: Tiered access and pay-per-content models

## Safety & Compliance
- **Content Moderation**: Real-time message analysis with automatic blocking/escalation
- **Audit Trail**: Comprehensive logging of all interactions for compliance
- **Age Verification**: Consent management and boundary enforcement
- **Platform Compliance**: Designed to meet X/Twitter policies and legal requirements

## Development Environment
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: Full TypeScript coverage with strict compiler settings
- **Path Resolution**: Organized imports with path aliases for clean code organization
- **Development Tools**: Hot reload, error overlays, and Replit integration

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with modern hooks and concurrent features
- **Express.js**: Node.js web framework for API server
- **TypeScript**: Static typing for both client and server code
- **Vite**: Build tool and development server

## Database & ORM
- **PostgreSQL**: Primary database (configured for Neon serverless)
- **Drizzle ORM**: Type-safe database toolkit with schema management
- **@neondatabase/serverless**: Serverless PostgreSQL client for cloud deployment

## AI & External Services
- **OpenAI API**: GPT-4o for AI conversation generation
- **Stripe**: Payment processing and subscription management
- **WebSocket**: Real-time communication support

## UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Pre-built component library
- **Lucide React**: Icon library

## Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation and type inference
- **@hookform/resolvers**: Integration between React Hook Form and Zod

## State Management & Data Fetching
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight React router

## Development & Build Tools
- **ESBuild**: Fast bundling for server-side code
- **PostCSS**: CSS processing with Autoprefixer
- **TSX**: TypeScript execution for development