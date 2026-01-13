<p align="center">
  <img src="public/logo.svg" alt="LearnBook Logo" width="80" height="80">
</p>

<h1 align="center">📚 LearnBook</h1>

<p align="center">
  <strong>The World's First AI Learning Control Layer</strong><br>
  <em>Not another learning platform — an intelligent orchestrator that decides what you learn and when.</em>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js">
  <img alt="React" src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=flat-square&logo=supabase">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss">
  <img alt="AI Powered" src="https://img.shields.io/badge/AI-Groq%20%2B%20Gemini-FF6B6B?style=flat-square">
</p>

---

## 🌟 Why LearnBook is Different

> **"Every learning platform teaches you content. LearnBook is the first to teach you HOW to learn it."**

### The Problem with Current EdTech

| Platform Type | What They Do | The Gap |
|--------------|--------------|---------|
| **Coursera, Udemy** | Provide video courses | No personalized path, you pick randomly |
| **Khan Academy** | Subject tutorials | One-size-fits-all progression |
| **Duolingo** | Gamified learning | Works only for languages, not academics |
| **ChatGPT/AI Tutors** | Answer questions | Reactive, not proactive; no planning |
| **School LMS** | Host content | Zero intelligence, just file storage |

### LearnBook's Revolutionary Approach

LearnBook is **NOT** a content platform. It's an **AI Control Layer** that:

- ✅ **Decides** the optimal sequence of what to study
- ✅ **Adapts** when you miss sessions or need more time  
- ✅ **Understands** prerequisite chains and concept dependencies
- ✅ **Orchestrates** content from YouTube, notes, and external sources
- ✅ **Predicts** which topics you'll struggle with based on your profile

---

## 🚀 Groundbreaking Features

### 1. 🧠 AI-Powered Curriculum Engine
Unlike static syllabus, LearnBook **dynamically generates curriculum** based on:
- Your education board (CBSE, ICSE, State Boards, Universities)
- Real-time **web search** for latest official syllabus
- LLM-powered content structuring

```
Input: "CBSE Class 12 Physics"
Output: Precise chapter list with weightage, concepts, estimated hours
```

### 2. 🎯 Adaptive Roadmap Technology
First-ever system that creates **study roadmaps like project management**:
- Milestone-based learning paths
- Automatic rescheduling when you fall behind
- Priority adjustment based on exam proximity
- Visual Gantt-chart style progression

### 3. ⏰ Self-Healing Timetables
Traditional timetables break when you skip a day. LearnBook's don't:
- **Spillover handling**: Missed tasks automatically redistribute
- **Buffer days**: Built-in catch-up periods
- **Difficulty balancing**: Alternates hard/easy topics

### 4. 📊 Concept Dependency Graph
LearnBook understands that you can't learn Integration without Differentiation:
- Maps prerequisite relationships
- Warns if you skip foundational topics
- Suggests optimal learning order

### 5. 🤖 Context-Aware AI Assistant
Not just a chatbot — an AI that **knows your syllabus**:
- Answers questions in context of your curriculum
- Generates summaries for specific chapters
- Creates practice questions based on your weak areas

### 6. 📺 Intelligent Resource Curation
Automatically fetches the best YouTube tutorials:
- Filters by relevance to your exact topic
- Prioritizes quality educational channels
- Saves hours of searching

---

## 🏆 Technical Excellence

### Modern Architecture

| Aspect | Implementation | Why It Matters |
|--------|---------------|----------------|
| **Framework** | Next.js 16 App Router | Latest React paradigm, server components |
| **React Version** | 19.2 (Bleeding Edge) | Concurrent features, improved performance |
| **Type Safety** | Full TypeScript | Zero runtime type errors |
| **Styling** | Tailwind CSS 4.0 | Latest design tokens, container queries |
| **Animation** | Framer Motion | 60fps buttery smooth transitions |
| **Auth** | Supabase RLS | Row-level security, zero trust |
| **AI** | Multi-provider | Groq for speed, Gemini for accuracy |

### Security First Design

```
┌─────────────────────────────────────────────────┐
│  Row Level Security (RLS) on ALL user tables    │
│  ─────────────────────────────────────────────  │
│  • Users can ONLY access their own data         │
│  • No API can leak data across users            │
│  • Server-side validation on every request      │
└─────────────────────────────────────────────────┘
```

### Scalable Database Schema

Designed for **millions of users** with:
- Optimized indexes for common queries
- Normalized structure avoiding data duplication
- Efficient progress tracking without performance degradation

---

## 📈 Impact & Use Cases

### For Students
- **Exam Preparation**: Get a precise day-by-day study plan for board exams
- **Catch-up Learning**: Fell behind? AI redistributes your workload
- **Weak Topic Focus**: System identifies and prioritizes problem areas

### For Self-Learners
- **Skill Acquisition**: Learn programming, data science with structured paths
- **Time Optimization**: Maximum learning in minimum time slots
- **Progress Visibility**: Always know where you stand

### For Educators
- **Curriculum Design**: Understand topic interdependencies
- **Student Tracking**: Monitor class progress (future feature)
- **Resource Curation**: Build curated content libraries

---

## 🔬 Innovation Highlights

### First-of-its-Kind Features

| Feature | Traditional Apps | LearnBook |
|---------|-----------------|-----------|
| Curriculum Source | Static database | **Real-time AI + Web search** |
| Scheduling | Fixed timetable | **Adaptive self-healing** |
| Content | Hosts everything | **Orchestrates external sources** |
| AI Role | Q&A chatbot | **Proactive learning advisor** |
| Personalization | Choose difficulty | **Complete profile-based adaptation** |

### Patent-Worthy Algorithms

1. **Syllabus Extraction Pipeline**: Web search → LLM parsing → Structured JSON
2. **Adaptive Rescheduling**: Constraint satisfaction for timeline optimization  
3. **Dependency Resolution**: Topological sorting for concept prerequisites

---

## 🏗️ Architecture

```
learnbook/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── ai/             # AI chat & summarization
│   │   │   ├── curriculum/     # Dynamic curriculum generation
│   │   │   ├── youtube/        # Video resource fetching
│   │   │   └── chat/           # Conversational AI
│   │   ├── auth/               # Authentication callbacks
│   │   ├── dashboard/          # Main user dashboard
│   │   ├── onboarding/         # User setup flow
│   │   ├── roadmap/            # Learning roadmap view
│   │   ├── subject/            # Subject details & chapters
│   │   └── timetable/          # Daily schedule management
│   ├── components/             # Reusable UI components
│   │   ├── ChatBot.tsx         # AI assistant sidebar
│   │   ├── FormattedText.tsx   # Markdown/text rendering
│   │   └── TodoSidebar.tsx     # Task management panel
│   ├── contexts/               # React contexts (Auth)
│   ├── lib/                    # Core utilities
│   │   ├── gemini.ts           # Google Gemini AI integration
│   │   ├── groq.ts             # Groq AI (fast inference)
│   │   ├── google-search.ts    # Web search for syllabus
│   │   ├── google-calendar.ts  # Calendar sync
│   │   └── supabase/           # Database client & hooks
│   └── types/                  # TypeScript definitions
├── supabase/
│   └── migrations/             # Production-ready schema
└── public/                     # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn** or **pnpm**
- **Supabase** account (free tier works)
- **Groq** API key (for AI features)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/learnbook.git
cd learnbook

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and experience the future of learning.

### Environment Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Provider (Required)
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Google APIs (Recommended)
YOUTUBE_API_KEY=your_youtube_api_key
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

### Database Setup

Run migrations in Supabase SQL Editor:
1. `001_initial_schema.sql` — Core tables with RLS
2. `002_add_subjects_table.sql` — Subject management
3. `003_add_notes_column.sql` — Note-taking support
4. `004_add_course_program.sql` — College curriculum

---

## � API Reference

### Curriculum Generation API

**`POST /api/curriculum`**

Dynamically generates curriculum using AI + web search.

```json
{
  "country": "India",
  "educationLevel": "school",
  "board": "CBSE",
  "classGrade": "Class 12",
  "searchType": "subjects",
  "courseProgram": "B.Tech CSE"  // For college
}
```

**Response:** Structured JSON with subjects/chapters/topics

### AI Assistant API

**`POST /api/ai`** — Context-aware explanations and summaries

### Resource API

**`GET /api/youtube`** — Curated educational videos

---

## 🗄️ Database Schema

| Table | Purpose | Records Scale |
|-------|---------|---------------|
| `user_profiles` | User education context | 1 per user |
| `user_subjects` | Selected subjects | 5-10 per user |
| `chapters` | Syllabus data | Thousands |
| `user_progress` | Completion tracking | High volume |
| `daily_tasks` | Scheduled activities | Daily updates |
| `roadmap_items` | Learning milestones | Per subject |

---

## 🎨 UI/UX Philosophy

- **Glassmorphism** design language for modern aesthetics
- **Micro-animations** for delightful interactions  
- **Dark mode first** — easy on the eyes during study sessions
- **Mobile responsive** — learn on any device
- **Accessibility** — WCAG compliant components

---

## � Future Roadmap

- [ ] **Collaborative Learning** — Study groups and peer matching
- [ ] **Spaced Repetition** — Scientifically-proven revision scheduling
- [ ] **Mobile Apps** — Native iOS/Android applications
- [ ] **Teacher Dashboard** — Classroom management features
- [ ] **Analytics Engine** — Deep learning insights
- [ ] **Offline Mode** — Study without internet

---

## 🏅 Project Highlights for Interviewers

### Technical Depth
- **Full-stack TypeScript** with strict type safety
- **Modern React patterns** — Server components, hooks, context
- **Production-ready auth** — Supabase with RLS
- **Multi-provider AI** — Graceful fallback between Groq & Gemini
- **Real-time capabilities** — Supabase subscriptions ready

### Problem-Solving
- **Novel approach** to education — control layer vs content platform
- **Complex algorithms** — scheduling, dependency resolution
- **API design** — RESTful, well-documented, error handling

### Best Practices
- **Clean architecture** — Separation of concerns
- **Security first** — RLS, environment variables, validation
- **Scalable design** — Indexed queries, normalized schema
- **Developer experience** — TypeScript, ESLint, organized structure

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>🌟 Built with passion to revolutionize how the world learns 🌟</strong>
</p>

<p align="center">
  <em>"The best investment you can make is in yourself."</em> — Warren Buffett
</p>
