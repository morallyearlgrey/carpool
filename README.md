# 🚗 Carpool - Smart Ride Sharing Platform

A modern, intelligent carpooling application that connects drivers and passengers through AI-powered matching and schedule optimization.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🎯 Smart Ride Matching
- **AI-Powered Recommendations**: Intelligent algorithm matches riders with compatible drivers based on schedules, locations, and preferences
- **Real-time Route Optimization**: Google Maps integration for optimal route planning and distance calculations
- **Schedule Compatibility**: Advanced time-slot matching with configurable time flexibility

### 📅 Flexible Schedule Management
- **Manual Schedule Entry**: Create detailed weekly schedules with specific time slots and locations
- **AI Schedule Upload**: Upload schedule screenshots and let AI extract your availability automatically
- **Multi-location Support**: Set different start and end locations for each time slot
- **Weekly Templates**: Easily replicate schedules across multiple weeks

### 🔒 Secure Authentication & Profiles
- **NextAuth.js Integration**: Secure authentication with email/password
- **User Profiles**: Comprehensive user management with vehicle information
- **Privacy Controls**: Granular privacy settings for personal information

### 🗺️ Interactive Maps & Location Services
- **Google Maps Integration**: Interactive map selection for pickup and drop-off locations
- **Places Autocomplete**: Smart location search with address suggestions
- **Distance Calculations**: Haversine distance calculations for accurate matching
- **Route Visualization**: Visual route display with estimated times and distances

### 📱 Real-time Request Management
- **Ride Requests**: Send and receive ride requests with instant notifications
- **Request Tracking**: Monitor incoming, outgoing, and public ride requests
- **Acceptance/Rejection**: Simple workflow for managing ride requests
- **Public Ride Board**: Browse and claim public ride requests

### 🚙 Vehicle & Capacity Management
- **Vehicle Information**: Track vehicle details, seating capacity, and availability
- **Seat Management**: Automatic calculation of available seats per ride
- **Multi-passenger Support**: Handle multiple passengers per vehicle

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom components
- **UI Components**: Radix UI primitives
- **Maps**: Google Maps API with React integration
- **Icons**: Heroicons & Lucide React

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: NextAuth.js with JWT tokens
- **File Upload**: Multipart form handling
- **AI Integration**: Google Gemini API for schedule extraction

### Development & Deployment
- **Type Safety**: Full TypeScript coverage with strict mode
- **Linting**: ESLint with Next.js configuration
- **Package Manager**: PNPM with workspace support
- **Build System**: Next.js optimized builds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and PNPM
- MongoDB Atlas account
- Google Maps API key
- Google Gemini API key (optional, for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/morallyearlgrey/carpool.git
cd carpool

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carpool

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# Google Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional: Firebase (if using Firebase features)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
```

### Database Setup

The application uses MongoDB with Mongoose. Database collections and schemas are automatically created on first run.

**Core Collections:**
- `users` - User profiles and authentication
- `schedules` - User availability schedules
- `rides` - Active ride offers
- `requests` - Ride requests and matches

### Development Server

```bash
# Start the development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📖 Usage Guide

### 1. **Account Setup**
- Register with email and password
- Complete your profile with vehicle information
- Set up your weekly availability schedule

### 2. **Creating Your Schedule**
- **Manual Entry**: Use the schedule builder to set specific time slots
- **AI Upload**: Take a screenshot of your schedule and let AI extract the data
- **Weekly Planning**: Set recurring schedules with flexible time slots

### 3. **Finding Rides**
- Browse the dashboard for recommended matches
- Use the map interface to set pickup and destination points
- Submit ride requests to compatible drivers

### 4. **Offering Rides**
- Post your available rides with capacity and timing
- Review and manage incoming ride requests
- Accept compatible passengers based on your preferences

### 5. **Managing Requests**
- **Incoming**: Review and respond to ride requests from other users
- **Outgoing**: Track your submitted ride requests
- **Public**: Browse and claim publicly available ride requests

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - User login
- `POST /api/register` - User registration

### Schedule Management
- `GET /api/schedule` - Retrieve user schedule
- `POST /api/schedule` - Create/update schedule
- `POST /api/upload` - AI-powered schedule upload

### Ride & Request System
- `GET /api/recommendations` - Get ride recommendations
- `POST /api/offers` - Create ride offer
- `GET /api/requests/incoming` - Get incoming requests
- `GET /api/requests/outgoing` - Get outgoing requests
- `POST /api/requests/[id]/respond` - Accept/reject requests

### User Management
- `GET /api/users` - Get user information
- `GET /api/rides/mine` - Get user's rides

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── schedule/          # Schedule management
│   └── carpool/           # Legacy carpool interface
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   └── [feature]/        # Feature-specific components
├── lib/                   # Utilities and configurations
│   ├── models/           # Mongoose schemas
│   ├── auth.ts           # NextAuth configuration
│   ├── mongodb.ts        # Database connection
│   └── utils.ts          # Helper functions
└── types/                # TypeScript type definitions
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Guidelines
1. Follow TypeScript best practices
2. Use ESLint configuration provided
3. Write meaningful commit messages
4. Test thoroughly before submitting PRs

### Code Style
- Use TypeScript for all new code
- Follow the existing component structure
- Use Tailwind CSS for styling
- Implement proper error handling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- **Next.js Team** for the amazing framework
- **Google Maps Platform** for location services
- **MongoDB** for robust database solutions
- **Vercel** for seamless deployment platform

## 📞 Support

For support and questions:
- Create an [issue](https://github.com/morallyearlgrey/carpool/issues)
- Join our [discussions](https://github.com/morallyearlgrey/carpool/discussions)
- Contact the maintainers

---

<div align="center">
  <strong>Built with ❤️ for sustainable transportation</strong>
</div>
