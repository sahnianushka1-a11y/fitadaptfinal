
import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Camera,
  CameraOff,
  Check,
  Timer,
  Dumbbell,
  PartyPopper,
  RotateCcw,
  X,
  Video,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

import { useApp } from '@/context/AppContext';
import { Card, ProgressBar, EmptyState } from '@/components/ui';
import type { GeneratedWorkout, Exercise } from '@/types';

export function WorkoutPlayer({
  workout,
  onClear,
}: {
  workout: GeneratedWorkout | null;
  onClear: () => void;
}) {
  const { recordWorkout, profile } = useApp();

  const [phase, setPhase] = useState<
    'ready' | 'active' | 'paused' | 'rest' | 'done'
  >('ready');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [earnedXp, setEarnedXp] = useState(0);
  const [demoFailed, setDemoFailed] = useState(false);

  // Camera preview reference
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exercises = workout?.exercises ?? [];
  const current = exercises[currentIdx];

  // -----------------------------------------
  // TIMER
  // -----------------------------------------

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (phase === 'active') {
      timerRef.current = setInterval(() => {
        setElapsed((previous) => previous + 1);
      }, 1000);
    }

    if (phase === 'rest') {
      timerRef.current = setInterval(() => {
        setRestRemaining((previous) => {
          if (previous <= 1) {
            setPhase('active');
            return 0;
          }

          return previous - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  // -----------------------------------------
  // CAMERA: KEEP VIDEO ELEMENT MOUNTED
  // -----------------------------------------

  const startCamera = async () => {
    setCameraError('');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Camera is unavailable. Open the app using localhost or HTTPS.'
        );
      }

      // Ask browser for camera permission.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      // Stop any previous stream.
      streamRef.current?.getTracks().forEach((track) => track.stop());

      streamRef.current = stream;

      // Show the video element first.
      setCameraOn(true);
    } catch (error) {
      console.error('Camera error:', error);

      const message =
        error instanceof Error ? error.message : 'Could not access camera.';

      setCameraError(message);
      setCameraOn(false);
    }
  };

  // Attach the stream AFTER React renders the video element.
  useEffect(() => {
    if (!cameraOn || !streamRef.current || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    video.srcObject = streamRef.current;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    video.play().catch((error) => {
      console.error('Camera playback error:', error);
      setCameraError('Camera opened, but preview could not start.');
    });

    return () => {
      video.pause();
      video.srcObject = null;
    };
  }, [cameraOn]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;
    setCameraOn(false);
    setCameraError('');
  };

  // Stop camera and timer when leaving this screen.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // -----------------------------------------
  // WORKOUT CONTROLS
  // -----------------------------------------

  const handleStart = () => {
    setPhase('active');
    setElapsed(0);
    setCurrentIdx(0);
  };

  const handleNext = () => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx((previous) => previous + 1);
      setElapsed(0);
      setRestRemaining(current?.restSeconds ?? 30);
      setPhase('rest');
    } else {
      completeWorkout();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((previous) => previous - 1);
      setElapsed(0);
      setPhase('active');
    }
  };

  const completeWorkout = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    stopCamera();

    const xp = recordWorkout({
      date: new Date().toISOString().slice(0, 10),
      title: workout?.title ?? 'Workout',
      durationMinutes: workout?.estimatedMinutes ?? 20,
      intensity: workout?.intensity ?? 'Moderate',
    });

    setEarnedXp(xp);
    setPhase('done');
  };

  const reset = () => {
    setPhase('ready');
    setCurrentIdx(0);
    setElapsed(0);
    setRestRemaining(0);
    setEarnedXp(0);
  };

  // -----------------------------------------
  // EMPTY STATE
  // -----------------------------------------

  if (!workout) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold text-white">
          Workout Player
        </h1>

        <EmptyState
          icon={<Dumbbell className="h-8 w-8" />}
          title="No workout loaded"
          description="Generate a workout first and tap Start workout player."
        />
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <CompletionScreen
        workout={workout}
        xp={earnedXp}
        onReset={reset}
        onExit={onClear}
        name={profile?.name ?? ''}
      />
    );
  }

  const exerciseDuration = current?.duration ?? 40;

  const progressPct =
    phase === 'active'
      ? Math.min((elapsed / exerciseDuration) * 100, 100)
      : 0;

  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {workout.title}
          </h1>

          <p className="text-sm text-white/50">
            {phase === 'ready'
              ? 'Ready to begin'
              : `Exercise ${currentIdx + 1} of ${exercises.length}`}
          </p>
        </div>

        <button
          onClick={onClear}
          className="rounded-xl p-2 text-white/40 hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* LEFT: EXERCISE DEMO AND DETAILS */}
        <div className="space-y-4">

          <Card className="relative overflow-hidden">

            {/* ACTUAL EXERCISE VIDEO */}
            <div className="relative flex h-64 items-center justify-center bg-ink-950 lg:h-80">

              {current && (
                <ExerciseDemo
                  exercise={current}
                  active={phase === 'active'}
                  failed={demoFailed}
                  onVideoError={() => setDemoFailed(true)}
                  onVideoLoad={() => setDemoFailed(false)}
                />
              )}

              {phase === 'rest' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-ink-950/80 backdrop-blur-sm">
                  <Timer className="h-10 w-10 text-violet-400" />

                  <p className="mt-3 font-display text-5xl font-bold text-violet-300">
                    {restRemaining}
                  </p>

                  <p className="text-sm text-white/50">
                    Rest seconds remaining
                  </p>
                </div>
              )}

            </div>

            {/* EXERCISE INFORMATION */}
            <div className="p-5">

              {phase === 'ready' ? (
                <div className="py-4 text-center">

                  <h2 className="font-display text-xl font-semibold text-white">
                    {workout.title}
                  </h2>

                  <p className="mt-1 text-sm text-white/50">
                    {workout.estimatedMinutes} min · {workout.intensity} intensity
                  </p>

                  <p className="mt-3 text-sm text-white/60">
                    {exercises.length} exercises ahead
                  </p>

                  <button
                    onClick={handleStart}
                    className="btn-primary mx-auto mt-5"
                  >
                    <Play className="h-5 w-5" />
                    Start workout
                  </button>
                </div>
              ) : current ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-white">
                        {current.name}
                      </h2>

                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <span className="chip bg-lime-400/10 text-lime-300">
                          {current.sets} sets × {current.reps}
                        </span>

                        {current.duration && (
                          <span className="chip bg-white/5 text-white/60">
                            {current.duration}s
                          </span>
                        )}

                        <span className="chip bg-violet-500/10 text-violet-300">
                          {current.restSeconds}s rest
                        </span>
                      </div>
                    </div>

                    {phase === 'active' && (
                      <span className="font-display text-2xl font-bold text-lime-300">
                        {elapsed}s
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-white/60">
                    {current.instructions}
                  </p>

                  {phase === 'active' && (
                    <ProgressBar
                      value={progressPct}
                      className="mt-4"
                    />
                  )}
                </>
              ) : null}

            </div>
          </Card>

          {/* WORKOUT QUEUE */}
          <Card className="p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
              Workout queue
            </p>

            <div className="space-y-1.5">
              {exercises.map((exercise, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    index === currentIdx
                      ? 'bg-lime-400/10 text-lime-300'
                      : index < currentIdx
                      ? 'text-white/30'
                      : 'text-white/60'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold">
                    {index < currentIdx ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <span className="flex-1 truncate">
                    {exercise.name}
                  </span>

                  <span className="text-xs text-white/30">
                    {exercise.sets}×{exercise.reps}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT: LIVE CAMERA */}
        <div className="space-y-4">

          <Card className="overflow-hidden">

            <div className="relative flex h-64 items-center justify-center overflow-hidden bg-black lg:h-80">

              {/* IMPORTANT: VIDEO IS ALWAYS MOUNTED */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 h-full w-full object-cover ${
                  cameraOn ? 'block' : 'hidden'
                }`}
              />

              {!cameraOn && (
                <div className="flex flex-col items-center gap-3 text-white/30">
                  <Video className="h-12 w-12" />

                  <p className="text-sm">Your live camera preview</p>

                  <p className="text-xs text-white/20">
                    Enable camera to see yourself while exercising
                  </p>
                </div>
              )}

              {cameraOn && (
                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-xs text-rose-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                  LIVE
                </div>
              )}

            </div>

            <div className="p-4">

              <div className="flex gap-2">

                {!cameraOn ? (
                  <button
                    onClick={startCamera}
                    className="btn-ghost flex-1"
                  >
                    <Camera className="h-4 w-4" />
                    Start camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="btn-ghost flex-1"
                  >
                    <CameraOff className="h-4 w-4" />
                    Stop camera
                  </button>
                )}

              </div>

              {cameraError && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{cameraError}</p>
                </div>
              )}

              <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-center">
                <Sparkles className="mx-auto mb-1 h-4 w-4 text-violet-400" />

                <p className="text-xs font-medium text-violet-300">
                  AI form coaching — coming soon
                </p>

                <p className="mt-0.5 text-[10px] text-white/40">
                  Live camera preview is available. Pose detection is not yet active.
                </p>
              </div>

            </div>
          </Card>

          {/* PLAYER CONTROLS */}
          {phase !== 'ready' && (
            <Card className="p-4">

              <div className="grid grid-cols-4 gap-2">

                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="btn-ghost py-3 disabled:opacity-30"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  onClick={() =>
                    setPhase(phase === 'active' ? 'paused' : 'active')
                  }
                  className="btn-primary col-span-2"
                >
                  {phase === 'active' ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="btn-ghost py-3"
                >
                  <SkipForward className="h-4 w-4" />
                </button>

              </div>

              <button
                onClick={completeWorkout}
                className="mt-2 w-full rounded-xl border border-lime-400/20 py-2.5 text-sm font-medium text-lime-300 transition-colors hover:bg-lime-400/5"
              >
                <Check className="mr-1 inline h-4 w-4" />
                Finish workout
              </button>

            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

// -----------------------------------------
// EXERCISE VIDEO PLAYER
// -----------------------------------------

function getExerciseVideo(exercise: Exercise): string {
  const name = exercise.name.toLowerCase();

  if (name.includes('jump')) {
    return '/exercises/jumping-jacks.mp4';
  }

  if (name.includes('squat')) {
    return '/exercises/squat.mp4';
  }

  if (name.includes('lunge')) {
    return '/exercises/lunge.mp4';
  }

  if (name.includes('plank')) {
    return '/exercises/plank.mp4';
  }

  if (name.includes('push')) {
    return '/exercises/push-up.mp4';
  }

  if (name.includes('stretch') || name.includes('mobility')) {
    return '/exercises/stretch.mp4';
  }

  if (name.includes('yoga')) {
    return '/exercises/yoga.mp4';
  }

  return '/exercises/default.mp4';
}

function ExerciseDemo({
  exercise,
  active,
  failed,
  onVideoError,
  onVideoLoad,
}: {
  exercise: Exercise;
  active: boolean;
  failed: boolean;
  onVideoError: () => void;
  onVideoLoad: () => void;
}) {
  const videoSrc = getExerciseVideo(exercise);
  const name = exercise.name.toLowerCase();

  const isJump = name.includes('jump');
  const isSquat = name.includes('squat') || name.includes('lunge');
  const isPlank = name.includes('plank') || name.includes('push');
  const isStretch =
    name.includes('stretch') ||
    name.includes('mobility') ||
    name.includes('yoga');

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-800 to-ink-950">

      {!failed ? (
        <video
          key={videoSrc}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          controls
          onError={onVideoError}
          onLoadedData={onVideoLoad}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">

          <div
            className={`relative flex h-32 w-32 items-center justify-center ${
              active ? 'animate-float' : ''
            }`}
          >
            <div
              className={`absolute inset-0 rounded-full ${
                active
                  ? 'animate-pulse-ring bg-lime-400/10'
                  : 'bg-white/5'
              }`}
            />

            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
              {isJump && <span className="text-5xl">🤸</span>}
              {isSquat && <span className="text-5xl">🦵</span>}
              {isPlank && <span className="text-5xl">💪</span>}
              {isStretch && <span className="text-5xl">🧘</span>}

              {!isJump && !isSquat && !isPlank && !isStretch && (
                <Dumbbell className="h-12 w-12 text-lime-300" />
              )}
            </div>
          </div>

          <div>
            <p className="font-semibold text-white">
              {exercise.name}
            </p>

            <p className="mt-1 text-xs text-white/40">
              Exercise demo video not added yet
            </p>
          </div>

        </div>
      )}

      <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white/70">
        {active ? 'Exercise in progress' : 'Exercise demonstration'}
      </div>

    </div>
  );
}

// -----------------------------------------
// COMPLETION SCREEN
// -----------------------------------------

function CompletionScreen({
  workout,
  xp,
  onReset,
  onExit,
  name,
}: {
  workout: GeneratedWorkout;
  xp: number;
  onReset: () => void;
  onExit: () => void;
  name: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-scale-in">

      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse-ring rounded-full bg-lime-400/20" />

        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-lime-400 text-ink-950 shadow-glow">
          <PartyPopper className="h-12 w-12" />
        </div>
      </div>

      <h1 className="font-display text-3xl font-bold text-white">
        Workout complete!
      </h1>

      <p className="mt-2 max-w-sm text-white/60">
        {name}, you just finished {workout.title}. Character development detected.
      </p>

      <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-3">

        <Card className="p-4">
          <p className="text-xs text-white/40">Duration</p>
          <p className="font-display text-xl font-bold text-white">
            {workout.estimatedMinutes}
            <span className="text-sm text-white/40">m</span>
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-white/40">XP earned</p>
          <p className="font-display text-xl font-bold text-lime-300">
            +{xp}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-white/40">Exercises</p>
          <p className="font-display text-xl font-bold text-white">
            {workout.exercises.length}
          </p>
        </Card>

      </div>

      <div className="mt-8 flex gap-3">

        <button onClick={onReset} className="btn-ghost">
          <RotateCcw className="h-4 w-4" />
          Do it again
        </button>

        <button onClick={onExit} className="btn-primary">
          <Check className="h-4 w-4" />
          Back to workouts
        </button>

      </div>
    </div>
  );
}
