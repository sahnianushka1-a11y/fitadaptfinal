# FITADAPT — Your Fitness Era. Your Rules. 💪

**Fitness that adapts to your life, not the other way around.**

FITADAPT is an AI-powered fitness companion designed for students and young professionals who want to build healthier habits but struggle with busy schedules, limited equipment, motivation, or gym anxiety.

Instead of following rigid workout plans, FITADAPT helps users discover routines that fit their goals, fitness levels, available time, and daily readiness.

## ✨ Key Features

- **Personalised Onboarding:** Collects fitness goals, experience level, available workout time, equipment, and limitations.
- **AI-Powered Workout Generation:** Uses Google's Gemini API to generate workouts based on individual user preferences.
- **Smart Fallback System:** Provides locally generated workouts when the AI service is unavailable.
- **Personalised Dashboard:** Displays activity, weekly workout plans, streaks, XP, and progress.
- **Interactive Workout Player:** Provides exercise instructions, timers, and workout controls.
- **Exercise Demonstrations:** Includes visual demonstrations for bodyweight squats and push-ups.
- **Live Camera Preview:** Allows users to view themselves while following exercise demonstrations.
- **Gamified Experience:** Uses XP, levels, streaks, and achievements to encourage consistency.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| AI Integration | Google Gemini API |
| Icons | Lucide React |
| Development Tools | VS Code, Git, GitHub |

## 🏗️ Project Structure

```text
FITADAPT/
│
├── backend/
│   ├── app/
│   ├── tests/
│   ├── server.js
│   └── package.json
│
├── public/
│   └── exercises/
│       ├── squat.gif
│       └── pushup.gif
│
├── src/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── pages/
│   └── types/
│
├── .gitignore
├── index.html
├── package.json
└── README.md
```

*The structure above highlights the main project directories; individual files may vary.*

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sahnianushka1-a11y/fitadaptfinal.git
```

### 2. Navigate to the project

```bash
cd fitadaptfinal
```

### 3. Install frontend dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `backend` folder:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=8787
```

Do not upload your API key or `.env` file to GitHub.

### 5. Install backend dependencies

```bash
cd backend
npm install
```

### 6. Start the backend

```bash
npm run dev
```

### 7. Start the frontend

Open another terminal, navigate to the project root, and run:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🔐 Privacy & Security

- API keys are stored in environment variables.
- The `.env` file should remain excluded from version control.
- The live camera preview requires browser camera permission.
- FITADAPT currently provides exercise demonstrations and camera preview; automated pose-based form correction is not implemented.

## 🌱 Future Improvements

- Real-time AI-based exercise posture analysis.
- Apple Health integration.
- Expanded exercise demonstration library.
- More advanced activity and recovery insights.
- Personalised long-term fitness recommendations.

## 🎯 Our Vision

We believe fitness shouldn't feel like another assignment on an already packed schedule.

FITADAPT makes fitness more accessible, flexible, and enjoyable by adapting workouts to real people and their real lives.

**Your fitness era. Your rules.**

---

**Built with ❤️ by Anushka Sahni**
