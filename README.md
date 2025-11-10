## Search Agent 🔍

![NOMI](https://ik.imagekit.io/wq68aygdr/logo.png?updatedAt=1762786354336)

An AI-powered web search assistant that finds sources, synthesizes answers with inline citations, and offers a personalized discovery experience (news, markets, weather).



### Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-3b82f6?style=for-the-badge&logo=clerk&logoColor=white)
![Inngest](https://img.shields.io/badge/Inngest-111827?style=for-the-badge&logo=inngest&logoColor=white)

### Core Technologies
- **Frontend**: Next.js 16, React, TypeScript, Tailwind, shadcn/ui
- **Auth**: Clerk (`app/layout.tsx`, `proxy.ts`, `app/(auth)/*`)
- **Data**: Supabase (`services/supabase.tsx`, tables: `Users`, `Library`, `chats`)
- **Background Jobs**: Inngest (event-driven LLM generation)
- **LLM**: Gemini API (Google Generative Language)
- **Search**: Google Search API
- **News**: GNews API
- **Weather**: WeatherAPI.com
- **Markets**: AlphaVantage `/api/market-api` route


## 🏗️ System Design

### Architecture Overview

![architecture](https://ik.imagekit.io/wq68aygdr/NOMI-Architecture.png?updatedAt=1762786535179)

## New & Notable Features

- **Discovery Page** (`app/(routes)/discover/page.tsx`)
  - Curated news via GNews API categories (For You, Finance, Technology, Sports, Entertainment, Politics) using `/api/gnews-api`.
  - Localized weather widget via `/api/weather-api` (backed by WeatherAPI).
  - Market snapshot via `/api/market-api`.
  - Clean, responsive layout built with shadcn/ui and Tailwind.

- **Search + Answering Flow**
  - User prompt is stored in Supabase `Library`, and each run creates a row in `chats` with formatted Google search results via `/api/google-search-api`.
  - Answer generation runs asynchronously using Inngest (`llm-model` function), which calls Gemini and writes the result back to `chats.aiResponce`.
  - UI live-updates and polls run status via `/api/get-inngest-status`, rendering tabs: Answer, Images, Sources.

- **Authentication**
  - App-level protection via Clerk middleware in `proxy.ts` (public routes include `/`, `/sign-in`, `/sign-up`, `/api/inngest`).
  - User bootstrap/upsert into Supabase in `app/provider.tsx` to sync profile (`Users` table).

## How It Works (High-Level)

```mermaid

```

## Environment Variables

```env
#clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in


NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/

#supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_KEY=

#google search api
GOOGLE_SEARCH_API_KEY=
CSE_ID=

#gemini api
GEMINI_API_KEY=

#inngest
INNGEST_SIGNIN_KEY=
INNGEST_SERVER_HOST=

#news
GNEWS_API_KEY=
#weather
WEATHER_API_KEY=
#stock market
ALPHA_VANTAGE_API_KEY=
```

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

3. Configure environment variables (see above).

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
├── app/                       # Next.js App Router
│   ├── (auth)/               # Clerk auth pages
│   ├── (components)/         # Shared UI (sidebar, displays)
│   ├── (routes)/discover/    # Discovery page (news/weather/markets)
│   ├── (routes)/search/      # Search flow (Library/chats)
│   └── api/                  # API routes (search, inngest, news, weather, market)
├── components/ui/            # shadcn/ui primitives
├── inngest/                  # Inngest client and functions
├── services/                 # Supabase client and shared config
└── public/                   # Static assets
```

## TODO

- [x] Implement discovery page with GNews, weather, markets
- [x] Integrate Clerk auth and middleware protection
- [x] Wire Google CSE + formatted search result ingestion
- [x] Add Inngest background job for LLM answer generation
- [x] Persist chats and answers in Supabase
- [ ] Fix inline citation to display the source on hover
- [ ] Integrate deepSearch with agentic capabilities
- [ ] add multiple AI models support
- [ ] add Finance page to retreive the data from a stock market api and generate a report using LLM

## 🙏 Acknowledgements

This project was made possible thanks to the incredible work of the open-source community.  
deeply appreciate the following technologies, libraries, whose tools and frameworks powered this project:

- **[Next.js](https://nextjs.org/)** — for its seamless developer experience and powerful React-based full-stack capabilities.  
- **[ShadCN](https://shadcn.com/)** — for providing elegant, customizable UI components built on top of Radix and Tailwind.  
- **[Lucide Icons](https://www.radix-ui.com/)** — for its accessable ICONS  
- **[Tailwind CSS](https://tailwindcss.com/)** — for enabling beautiful and responsive styling with minimal effort.  
- **[Supabase](https://www.prisma.io/)** — for simplifying database interactions.  
- **[Inngest](https://www.inngest.com/)** — for managing reliable serverless workflows and background jobs.  
- **[Clerk Auth](https://github.com/betterauth/betterauth)** — for offering flexible, modern authentication solutions.  

Finally, heartfelt thanks to all the **open-source maintainers and contributors** whose dedication makes building with these tools possible. 

---

This project is under active development; features and docs will evolve.
