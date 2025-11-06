# Search Agent 🔍

A powerful web search agent that leverages LLM capabilities to provide intelligent, source-cited answers to user queries.

## 🚧 Work in Progress

This project is currently under active development. Features and documentation will be updated regularly.

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

### Core Technologies

- **Frontend Framework**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Database**: Supabase
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Features

- 🔐 Secure authentication with Clerk
- 🎨 Beautiful and responsive UI with shadcn components
- 🔍 Intelligent web search capabilities
- 📝 LLM-powered response generation
- 📊 User data management with Supabase
- 📱 Mobile-responsive design

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/Bhuvan-S-prasad/Search-Agent.git
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_KEY=

# Add other required environment variables
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
├── app/                  # Next.js app router
├── components/          
│   └── ui/             # shadcn UI components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── public/             # Static assets
└── services/           # API services
```

## Contributing

This project is currently in development.

---

*Note: This project is under active development. Features and documentation are subject to change.*
