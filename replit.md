# Overview

DermaQuiz is a web application for dermatology exam preparation that allows users to take timed practice quizzes. The application supports importing questions from Excel files, creating custom quizzes with filters by chapter and year, and tracking quiz results with detailed performance analytics. Built as a full-stack TypeScript application with a React frontend and Express backend.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with three main routes (home, quiz, results)
- **State Management**: TanStack React Query for server state management with custom query client
- **UI Components**: Radix UI primitives with shadcn/ui components for consistent design system
- **Styling**: Tailwind CSS with CSS custom properties for theming and dark mode support
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with centralized route registration
- **Error Handling**: Global error handler middleware with structured error responses
- **File Processing**: Multer for handling Excel file uploads with XLSX parsing
- **Development**: Vite integration for hot module replacement in development

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for cloud database hosting
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Session Storage**: In-memory storage interface with extensible design for future database integration
- **Data Types**: JSON columns for complex data (arrays, objects) with TypeScript type safety

## Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Basic session handling infrastructure in place for future implementation
- **Security**: CORS and basic request logging middleware configured

## Database Schema Design
- **Questions Table**: Stores quiz questions with year, statement, multiple choice options, correct answers, chapter categorization, and book sections
- **Quizzes Table**: Manages quiz configurations including question count, selected chapters/years, timing preferences, and question selection
- **Quiz Results Table**: Tracks completed quiz attempts with answers, scores, time spent, and chapter-specific performance metrics
- **Data Validation**: Zod schemas for runtime type checking and API request validation

## Key Features
- **Excel Import**: Upload and parse Excel files to bulk import quiz questions
- **Dynamic Quiz Generation**: Create quizzes with customizable question count and content filters
- **Timed Assessment**: Optional timed mode with automatic submission
- **Performance Analytics**: Chapter-wise performance tracking and historical results
- **Responsive Design**: Mobile-first design with adaptive layouts

# External Dependencies

## Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **express**: Node.js web framework for API server
- **drizzle-orm**: Type-safe PostgreSQL ORM
- **@neondatabase/serverless**: Serverless PostgreSQL driver

## UI and Styling
- **@radix-ui/***: Headless UI component primitives (20+ components)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility

## Development Tools
- **vite**: Frontend build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development
- **esbuild**: Production build bundling

## File Processing
- **multer**: Multipart form data handling for file uploads
- **xlsx**: Excel file parsing and processing

## Validation and Utilities
- **zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation utilities
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation integration

## Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation
- **@replit/vite-plugin-dev-banner**: Development environment banner