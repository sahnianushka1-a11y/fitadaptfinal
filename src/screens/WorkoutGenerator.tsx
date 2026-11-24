
import { useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  WifiOff,
  Clock,
  Flame,
  Dumbbell,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  ListChecks,
  Play,
} from 'lucide-react';

import { useApp } from '@/context/AppContext';
import { Card, SectionHeader, EmptyState } from '@/components/ui';
import {
  generateWorkout,
  paramsFromOnboarding,
  type GenerateParams,
} from '@/lib/api';

import type { GeneratedWorkout, Tab } from '@/types';

// Match generated exercise names with available demonstrations.
function getExerciseDemo(name: string): string | null {
  const exercise = name.toLowerCase().replace(/[-_]/g, ' ');

  if (exercise.includes('squat')) {
    return '/exercises/squat.gif';
  }

  if (
    exercise.includes('push up') ||
    exercise.includes('pushup')
  ) {
    return '/exercises/pushup.gif';
  }

  return null;
}

export function WorkoutGenerator({
  onNavigate,
  onWorkoutReady,
}: {
  onNavigate: (t: Tab) => void;
  onWorkoutReady: (w: GeneratedWorkout) => void;
}) {
  const { onboarding } = useApp();

  const [energy, setEnergy] = useState('moderate');
  const [soreness, setSoreness] = useState('none');
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  if (!onboarding) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setOffline(false);
    setWorkout(null);

    const params: GenerateParams = paramsFromOnboarding(
      onboarding,
      energy,
      soreness
    );

    const res = await generateWorkout(params);

    setLoading(false);

    if (res.data) {
      setWorkout(res.data);
    } else {
      setError(res.error ?? 'Something went wrong.');
      setOffline(!!res.offline);
    }
  };

  const energyOptions = [
    { v: 'low', label: 'Low', emoji: '😵' },
    { v: 'moderate', label: 'Moderate', emoji: '😐' },
    { v: 'high', label: 'High', emoji: '🔥' },
  ];

  const sorenessOptions = [
    { v: 'none', label: 'None' },
    { v: 'light', label: 'Light' },
    { v: 'moderate', label: 'Moderate' },
    { v: 'heavy', label: 'Heavy' },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-white">
          AI Workout Generator
        </h1>

        <p className="mt-1.5 text-sm text-white/50">
          Your personal AI coach, adapting to your energy and recovery.
        </p>
      </div>

      {/* Profile summary */}
      <Card className="p-5 animate-fade-up">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Goal', value: onboarding.goal },
            { label: 'Level', value: onboarding.level },
            {
              label: 'Duration',
              value: `${onboarding.workoutDuration} min`,
            },
            {
              label: 'Equipment',
              value: onboarding.equipment.join(', ') || 'None',
            },
            ...(onboarding.limitations &&
            onboarding.limitations !== 'Prefer not to say'
              ? [{ label: 'Limits', value: onboarding.limitations }]
              : []),
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/5 bg-white/5 px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                {item.label}
              </p>
              <p className="text-sm text-white/80">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Energy and soreness */}
      <div className="grid gap-4 lg:grid-cols-2 animate-fade-up">

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-white/70">
            Energy level today
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {energyOptions.map((opt) => (
              <button
                key={opt.v}
                onClick={() => setEnergy(opt.v)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-3 transition-all ${
                  energy === opt.v
                    ? 'border-lime-400/50 bg-lime-400/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-xs text-white/70">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-white/70">
            Soreness level
          </h3>

          <div className="grid grid-cols-4 gap-2">
            {sorenessOptions.map((opt) => (
              <button
                key={opt.v}
                onClick={() => setSoreness(opt.v)}
                className={`rounded-xl border py-3 text-xs ${
                  soreness === opt.v
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-white/10 bg-white/5 text-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary w-full text-base"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating your workout...
          </>
        ) : workout ? (
          <>
            <RotateCcw className="h-5 w-5" />
            Regenerate workout
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate my workout
          </>
        )}
      </button>

      {/* Loading */}
      {loading && (
        <Card className="p-6">
          <div className="space-y-3">
            <div className="skeleton h-6 w-2/3 rounded-lg" />
            <div className="skeleton h-4 w-1/3 rounded-lg" />
            <div className="skeleton h-20 w-full rounded-xl" />
          </div>

          <p className="mt-4 text-center text-sm text-white/40">
            Your AI coach is building your personalised plan...
          </p>
        </Card>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-rose-500/20 p-6">
          <div className="flex items-start gap-3">
            {offline ? (
              <WifiOff className="h-5 w-5 text-rose-300" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-300" />
            )}

            <div>
              <h3 className="font-semibold text-white">
                {offline
                  ? 'Backend unavailable'
                  : 'Could not generate workout'}
              </h3>

              <p className="mt-1 text-sm text-white/50">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Workout result */}
      {workout && !loading && (
        <WorkoutCard
          workout={workout}
          onStart={() => {
            onWorkoutReady(workout);
            onNavigate('workouts');
          }}
        />
      )}

      {/* Empty state */}
      {!workout && !loading && !error && (
        <EmptyState
          icon={<Dumbbell className="h-8 w-8" />}
          title="No workout yet"
          description="Set your energy and soreness, then generate your personalised workout."
        />
      )}
    </div>
  );
}


// Workout result card
function WorkoutCard({
  workout,
  onStart,
}: {
  workout: GeneratedWorkout;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4 animate-scale-in">

      {/* Workout overview */}
      <Card className="relative overflow-hidden p-6">
        <div className="relative">

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="chip bg-lime-400/15 text-lime-300">
              <Sparkles className="h-3 w-3" />
              AI-generated
            </span>

            <span className="chip bg-white/5 text-white/50">
              <Clock className="h-3 w-3" />
              {workout.estimatedMinutes} min
            </span>

            <span className="chip bg-violet-500/15 text-violet-300">
              <Flame className="h-3 w-3" />
              {workout.intensity}
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold text-white">
            {workout.title}
          </h2>

          <div className="mt-4 rounded-2xl border border-lime-400/15 bg-lime-400/5 p-4">
            <p className="mb-1 text-xs font-medium uppercase text-lime-300">
              Why this workout
            </p>

            <p className="text-sm text-white/70">
              {workout.whySelected}
            </p>
          </div>
        </div>
      </Card>

      {/* Exercise list with demonstrations */}
      <Card className="p-5">
        <SectionHeader
          title="Your exercises"
          subtitle={`${workout.exercises.length} moves`}
        />

        <div className="space-y-5">

          {workout.exercises.map((ex, i) => {
            const demo = getExerciseDemo(ex.name);

            return (
              <div
                key={`${ex.name}-${i}`}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >

                {/* Exercise details */}
                <div className="p-4">

                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-400/10 text-xs font-bold text-lime-300">
                      {i + 1}
                    </span>

                    <div>
                      <h4 className="font-semibold text-white">
                        {ex.name}
                      </h4>

                      <p className="text-xs text-white/40">
                        Exercise {i + 1}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-white/60">
                    {ex.instructions}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip bg-white/5 text-white/60">
                      {ex.sets} sets × {ex.reps}
                    </span>

                    {ex.duration && (
                      <span className="chip bg-white/5 text-white/60">
                        <Clock className="h-3 w-3" />
                        {ex.duration}s
                      </span>
                    )}

                    <span className="chip bg-violet-500/10 text-violet-300">
                      {ex.restSeconds}s rest
                    </span>
                  </div>
                </div>

                {/* Exercise demonstration */}
                <div className="border-t border-white/5 bg-black/20 p-3">

                  {demo ? (
                    <>
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-lime-300">
                        <Play className="h-3 w-3" />
                        Exercise demonstration
                      </div>

                      <img
                        src={demo}
                        alt={`${ex.name} demonstration`}
                        className="w-full max-h-64 rounded-xl object-contain bg-black"
                        loading="lazy"
                      />
                    </>
                  ) : (
                    <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
                      <div>
                        <Dumbbell className="mx-auto mb-2 h-6 w-6 text-white/30" />
                        <p className="text-xs text-white/40">
                          Demo coming soon
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}

        </div>
      </Card>

      {/* Safety note */}
      {workout.safetyNote && (
        <Card className="border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />

            <div>
              <p className="text-xs font-medium uppercase text-amber-300">
                Safety note
              </p>

              <p className="mt-1 text-sm text-white/70">
                {workout.safetyNote}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Start workout */}
      <button
        onClick={onStart}
        className="btn-primary w-full text-base"
      >
        <ListChecks className="h-5 w-5" />
        Start workout player
        <ArrowRight className="h-4 w-4" />
      </button>

    </div>
  );
}

