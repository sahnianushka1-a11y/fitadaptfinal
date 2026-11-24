
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "FITADAPT backend is running!",
  });
});

// -----------------------------------------
// 1. GEMINI WORKOUT GENERATION
// -----------------------------------------

async function generateWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing.");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const models = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
  ];

  for (const model of models) {
    try {
      console.log(`Trying Gemini model: ${model}`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (!response.text) {
        throw new Error("Gemini returned an empty response.");
      }

      console.log(`Gemini succeeded: ${model}`);

      return response.text;

    } catch (error) {
      console.error(
        `${model} failed:`,
        error.status || error.code,
        error.message
      );

      // Do not waste requests retrying daily quota errors.
      // Try the next model once, then use local fallback.
    }
  }

  throw new Error("Gemini models unavailable. Switching to local workout.");
}

// -----------------------------------------
// 2. WORKOUT VALIDATION
// -----------------------------------------

function validateWorkout(workout) {
  if (
    !workout ||
    typeof workout.title !== "string" ||
    typeof workout.estimatedMinutes !== "number" ||
    typeof workout.intensity !== "string" ||
    typeof workout.whySelected !== "string" ||
    !Array.isArray(workout.exercises) ||
    typeof workout.safetyNote !== "string"
  ) {
    throw new Error("Invalid workout structure.");
  }

  for (const exercise of workout.exercises) {
    if (
      typeof exercise.name !== "string" ||
      typeof exercise.instructions !== "string" ||
      typeof exercise.sets !== "number" ||
      typeof exercise.reps !== "string" ||
      typeof exercise.restSeconds !== "number"
    ) {
      throw new Error("Invalid exercise structure.");
    }
  }

  return workout;
}

// -----------------------------------------
// 3. LOCAL FITADAPT FALLBACK GENERATOR
// -----------------------------------------

function generateFallbackWorkout(profile) {
  console.log("Creating personalised local FITADAPT workout...");

  const goal = String(profile.goal || "General fitness").toLowerCase();
  const level = String(profile.level || "Beginner").toLowerCase();
  const energy = String(profile.energy || "Normal").toLowerCase();
  const soreness = String(profile.soreness || "None").toLowerCase();

  const limitations = String(profile.limitations || "").toLowerCase();
  const avoid = String(profile.avoidMovements || "").toLowerCase();

  const minutes = Number(
    profile.minutes || profile.workoutDuration || 20
  );

  const safeMinutes = Math.min(
    45,
    Math.max(10, Number.isFinite(minutes) ? minutes : 20)
  );

  const language = String(
    profile.coachLanguage || "English"
  ).toLowerCase();

  const personality = String(
    profile.coachPersonality || "Supportive bestie"
  );

  const gentleMode =
    energy.includes("low") ||
    soreness.includes("high") ||
    soreness.includes("severe");

  const beginner = level.includes("beginner");

  const lowerBodyRestricted =
    limitations.includes("knee") ||
    limitations.includes("leg") ||
    limitations.includes("ankle") ||
    limitations.includes("hip") ||
    avoid.includes("squat");

  const upperBodyRestricted =
    limitations.includes("shoulder") ||
    limitations.includes("wrist") ||
    limitations.includes("elbow") ||
    limitations.includes("chest") ||
    avoid.includes("push");

  const hasLimitations = limitations.trim().length > 0;

  const exercises = [];

  // Warm-up
  exercises.push({
    name: "Standing March",
    sets: 1,
    reps: "60 seconds",
    instructions:
      "Stand tall and gently march in place. Move comfortably and prepare your body for exercise.",
    restSeconds: 15,
  });

  // Squats
  if (
    !lowerBodyRestricted &&
    !avoid.includes("squat") &&
    !soreness.includes("severe")
  ) {
    exercises.push({
      name: "Bodyweight Squats",
      sets: gentleMode ? 2 : beginner ? 2 : 3,
      reps: gentleMode ? "8" : beginner ? "10" : "12",
      instructions:
        "Stand with feet shoulder-width apart. Push your hips back, bend your knees comfortably, and return to standing. Keep your back neutral. Stop if you feel pain.",
      restSeconds: gentleMode ? 45 : 30,
    });
  }

  // Push-ups
  if (
    !upperBodyRestricted &&
    !avoid.includes("push") &&
    !soreness.includes("severe")
  ) {
    exercises.push({
      name: "Push-ups",
      sets: gentleMode ? 1 : beginner ? 2 : 3,
      reps: gentleMode ? "5" : beginner ? "6" : "10",
      instructions:
        "Place your hands slightly wider than shoulder-width apart. Keep your body aligned and lower yourself with control. Use a comfortable variation and stop if you feel pain.",
      restSeconds: gentleMode ? 60 : 45,
    });
  }

  // Mobility alternative when limitations are present
  if (hasLimitations || gentleMode) {
    exercises.push({
      name: "Gentle Standing Mobility",
      sets: 1,
      reps: "60 seconds",
      instructions:
        "Move your shoulders and arms gently through a comfortable range of motion. Avoid any movement that causes pain or discomfort.",
      restSeconds: 20,
    });
  }

  // Cooldown
  exercises.push({
    name: "Gentle Standing Stretch",
    sets: 1,
    reps: "60 seconds",
    instructions:
      "Breathe slowly and gently stretch within your comfortable range. Do not bounce or force a stretch.",
    restSeconds: 0,
  });

  // Coach messages
  let coachingMessage =
    "This workout is adapted to your current profile and available time.";

  if (language.includes("hinglish")) {
    coachingMessage =
      "Aaj ka plan tumhari energy aur fitness level ke hisaab se hai. Slow and steady, bestie!";
  } else if (language.includes("hindi")) {
    coachingMessage =
      "आज का वर्कआउट आपकी ऊर्जा और फिटनेस स्तर के अनुसार तैयार किया गया है। आराम से करें!";
  } else if (language.includes("kannada")) {
    coachingMessage =
      "ಈಗಿನ ನಿಮ್ಮ ಶಕ್ತಿ ಮತ್ತು ಫಿಟ್ನೆಸ್ ಮಟ್ಟಕ್ಕೆ ತಕ್ಕಂತೆ ಈ ವ್ಯಾಯಾಮವನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ.";
  }

  if (personality.toLowerCase().includes("savage")) {
    coachingMessage +=
      " No excuses, but no ignoring pain either.";
  } else if (personality.toLowerCase().includes("calm")) {
    coachingMessage +=
      " Take your time. Consistency matters more than intensity.";
  }

  let intensity = "Moderate";

  if (gentleMode || hasLimitations) {
    intensity = "Low";
  } else if (level.includes("advanced")) {
    intensity = "High";
  }

  let title = "Your FITADAPT Quick Session";

  if (goal.includes("strength")) {
    title = "Strength Without the Gym";
  } else if (goal.includes("stamina")) {
    title = "Build Your Stamina";
  } else if (goal.includes("mobility")) {
    title = "Move Better Session";
  } else if (goal.includes("weight")) {
    title = "Your Active Reset";
  } else if (gentleMode) {
    title = "Gentle Energy Reset";
  }

  return {
    title,
    estimatedMinutes: safeMinutes,
    intensity,
    whySelected: coachingMessage,
    exercises,
    safetyNote:
      "This is a general fitness routine, not medical advice. Work within your comfortable range, maintain proper form, and stop if you experience pain, dizziness, or unusual discomfort. Skip any movement that conflicts with your physical limitations.",
  };
}

// -----------------------------------------
// 4. WORKOUT GENERATION ENDPOINT
// -----------------------------------------

app.post("/api/workout", async (req, res) => {
  const profile = req.body.profile;

  if (!profile) {
    return res.status(400).json({
      error: "Workout profile is required.",
    });
  }

  const prompt = `
You are FITADAPT, a personalised AI fitness coach.

USER PROFILE:
${JSON.stringify(profile, null, 2)}

COACH PERSONALITY:
${profile.coachPersonality || "Supportive bestie"}

COACH LANGUAGE:
${profile.coachLanguage || "English"}

Create a personalised workout based on:
- Fitness goal
- Fitness level
- Available time
- Available equipment
- Current energy
- Muscle soreness
- Physical limitations
- Movements the user wants to avoid

Return ONLY valid JSON in this exact structure:

{
  "title": "Workout title",
  "estimatedMinutes": 20,
  "intensity": "Moderate",
  "whySelected": "Why this workout suits the user",
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": "12",
      "instructions": "Clear exercise instructions",
      "restSeconds": 30
    }
  ],
  "safetyNote": "Relevant safety guidance"
}

IMPORTANT RULES:
1. Follow the selected coach personality.
2. Respond in the selected coach language.
3. Use natural Hinglish if Hinglish is selected.
4. Respect the user's fitness level.
5. Never use unavailable equipment.
6. Avoid movements conflicting with limitations.
7. Adapt intensity to energy and soreness.
8. Include warm-up and cooldown exercises.
9. Stay close to the requested workout duration.
10. Never recommend pushing through pain.
11. Give clear instructions for every exercise.
12. Return valid JSON only. No markdown.
`;

  console.log("Generating personalised FITADAPT workout...");

  try {
    // Try Gemini first
    const result = await generateWithGemini(prompt);

    const workout = validateWorkout(
      JSON.parse(result)
    );

    console.log("Gemini workout successfully generated!");

    return res.json({
      workout,
      source: "gemini",
    });

  } catch (error) {
    console.log(
      "Gemini unavailable. Activating FITADAPT local fallback."
    );

    console.error("Gemini error:", error.message);

    try {
      const workout = generateFallbackWorkout(profile);

      console.log("Local fallback workout successfully generated!");

      return res.json({
        workout,
        source: "local-fallback",
      });

    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);

      return res.status(500).json({
        error: "Could not generate a workout. Please try again.",
      });
    }
  }
});

// -----------------------------------------
// 5. START SERVER
// -----------------------------------------

app.listen(PORT, () => {
  console.log(
    `FITADAPT backend running at http://localhost:${PORT}`
  );
});
