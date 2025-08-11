
import { GoogleGenAI, Type } from "@google/genai";
import { OnboardingData, WorkoutPlan, SessionLog } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const exerciseSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique identifier for the exercise, e.g., 'push-up-1'." },
        name: { type: Type.STRING, description: "Name of the exercise, e.g., 'Incline Push-ups'." },
        sets: { type: Type.INTEGER, description: "Number of sets." },
        reps: { type: Type.INTEGER, description: "Number of repetitions per set. Use only if not a timed exercise." },
        duration: { type: Type.INTEGER, description: "Duration in seconds for timed exercises like planks. Use only if not a rep-based exercise." },
        rest: { type: Type.INTEGER, description: "Rest time in seconds between sets." },
    },
    required: ["id", "name", "sets", "rest"],
};

const workoutDaySchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique identifier for the workout day, e.g., 'week1-day1'." },
        day: { type: Type.INTEGER, description: "The day number within the week (1, 2, 3, etc.)." },
        name: { type: Type.STRING, description: "A descriptive name for the workout, e.g., 'Full Body A'." },
        exercises: { type: Type.ARRAY, items: exerciseSchema },
        isCompleted: { type: Type.BOOLEAN, description: "Set to false by default." },
    },
    required: ["id", "day", "name", "exercises", "isCompleted"],
};

const workoutWeekSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique identifier for the week, e.g., 'week1'." },
        week: { type: Type.INTEGER, description: "The week number (1-4)." },
        description: { type: Type.STRING, description: "A brief description of the week's focus, e.g., 'Introduction/Baseline'." },
        days: { type: Type.ARRAY, items: workoutDaySchema },
    },
    required: ["id", "week", "description", "days"],
};

const workoutPlanSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique ID for the entire plan, e.g., a timestamp." },
        weeks: { type: Type.ARRAY, items: workoutWeekSchema },
    },
    required: ["id", "weeks"],
};


const generatePrompt = (data: OnboardingData): string => {
    return `
    System Instruction: You are an expert calisthenics and fitness coach. Your task is to generate a structured, progressive 4-week workout plan in JSON format based on the user's profile, goals, and baseline assessment. Adhere strictly to the provided JSON schema.

    User's Data:
    - Profile: { weight: ${data.userProfile.weight}kg, height: ${data.userProfile.height}cm }
    - Fitness Goal: ${data.fitnessProfile.primaryGoal}
    - Sessions Per Week: ${data.fitnessProfile.sessionsPerWeek}
    - Baseline:
      - Max Push-ups: ${data.baseline.maxPushups}
      - Max Plank: ${data.baseline.maxPlankDuration} seconds
      - Can do standard push-ups: ${data.baseline.canPerformStandardPushup}
      - Has Equipment: ${data.baseline.hasEquipment}

    Workout Structure (Mesocycle):
    - 4 weeks total.
    - Week 1: Introduction/Baseline.
    - Week 2: Volume Increase (e.g., add a set or reps).
    - Week 3: Intensity Increase (e.g., harder exercise variation, less rest).
    - Week 4: Deload/Skill Focus (e.g., lower volume, focus on form).

    Goal-Specific Parameters:
    - If goal is 'strength', use 4-8 reps and 90-120s rest.
    - If goal is 'lean' (hypertrophy), use 8-15 reps and 45-90s rest.
    - If goal is 'endurance', use timed sets (30-60 seconds) or AMRAP (As Many Reps As Possible) with 20-45s rest. If using AMRAP, set "reps" to 0.

    Exercise Selection Rules:
    - Based on the user's baseline, select appropriate exercise variations.
    - If 'hasEquipment' is false, you MUST ONLY suggest exercises that require no equipment. For pulling exercises, suggest alternatives like Bodyweight Rows (using a sturdy table or two chairs) or Floor Swimmers. DO NOT suggest pull-ups or chin-ups.
    - If 'canPerformStandardPushup' is false or max pushups is low (<5), start with Incline Push-ups or Knee Push-ups.
    - If max pushups is high (>20), consider Diamond Push-ups or Archer Push-ups for progression.
    - Always include a balanced mix of push, pull, legs (e.g., Squats, Lunges), and core exercises (e.g., Planks, Leg Raises).
    - Ensure exercises progress logically from week to week. For example, move from Squats to Jump Squats or Knee Push-ups to Standard Push-ups.

    Generate a JSON object for a ${data.fitnessProfile.sessionsPerWeek}-day per week plan. The output MUST conform to the schema.
    `;
};


export const generateInitialWorkoutPlan = async (data: OnboardingData): Promise<WorkoutPlan> => {
    const prompt = generatePrompt(data);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: workoutPlanSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const plan = JSON.parse(jsonText);
        // Add a top-level ID if the model forgets
        if (!plan.id) {
            plan.id = `plan-${Date.now()}`;
        }
        return plan;
    } catch (error) {
        console.error("Failed to parse Gemini response:", response.text);
        throw new Error("AI response was not valid JSON.");
    }
};


export const adjustWorkoutPlan = async (currentPlan: WorkoutPlan, recentSessions: SessionLog[]): Promise<WorkoutPlan> => {
    const adjustmentPrompt = `
    System Instruction: You are an expert calisthenics coach. Your task is to adjust an existing workout plan based on the user's recent performance (RPE). Generate a new, complete 4-week plan that represents the next phase of training.

    Previous Plan:
    ${JSON.stringify(currentPlan, null, 2)}

    Recent Performance (last 2 sessions):
    ${JSON.stringify(recentSessions.map(s => ({ dayName: s.name, RPE: s.rpe })), null, 2)}

    Adjustment Rules:
    - IF average RPE of recent sessions is <= 6, THEN increase difficulty for the next mesocycle. This means progressing exercises (e.g., Incline Push-ups to Standard Push-ups), increasing volume (more sets/reps), or increasing intensity (less rest).
    - IF average RPE is >= 9, THEN decrease difficulty or maintain. This could mean regressing an exercise or reducing a set.
    - IF average RPE is 7-8, THEN maintain the current difficulty but perhaps introduce a new skill-based exercise.
    - IMPORTANT: Respect the user's equipment availability from the original plan. If the original plan was equipment-free, the new plan must also be equipment-free.

    Generate a brand new 4-week plan based on these adjustments. The new plan should follow the same JSON schema as the original.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: adjustmentPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: workoutPlanSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Failed to parse Gemini adjustment response:", response.text);
        throw new Error("AI adjustment response was not valid JSON.");
    }
};