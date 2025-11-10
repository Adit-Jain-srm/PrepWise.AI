"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { InterviewQuestion } from "@/lib/types/interview";

type Stage = "idle" | "prep" | "record" | "review" | "completed";

export type RecordedResponse = {
  question: InterviewQuestion;
  videoBlob: Blob;
  audioBlob: Blob;
  previewUrl: string;
  metadata: {
    startedAt: string;
    endedAt: string;
    prepSeconds: number;
    tabAwayRatio: number;
  };
};

type InterviewRecorderProps = {
  questions: InterviewQuestion[];
  onComplete: (responses: RecordedResponse[]) => void;
};

export function InterviewRecorder({ questions, onComplete }: InterviewRecorderProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [prepRemaining, setPrepRemaining] = useState<number>(questions[0]?.preparationSeconds ?? 30);
  const [recordRemaining, setRecordRemaining] = useState<number>(
    questions[0]?.responseSeconds ?? 60,
  );
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [responses, setResponses] = useState<RecordedResponse[]>([]);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const [prepTimerInterval, setPrepTimerInterval] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number | null>(null);
  const awayStartRef = useRef<number | null>(null);
  const awayTotalRef = useRef<number>(0);
  const responsesRef = useRef<RecordedResponse[]>([]);
  const recordingDurationRef = useRef<number>(0);

  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    async function enableMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Unable to access camera", error);
        setCameraError(
          "We need camera & microphone access for the mock interview. Please enable permissions.",
        );
      }
    }

    enableMedia();

    return () => {
      setMediaStream((stream) => {
        stream?.getTracks().forEach((track) => track.stop());
        return null;
      });
    };
  }, []);

  useEffect(() => {
    if (!mediaStream || !videoRef.current) {
      return;
    }
    videoRef.current.srcObject = mediaStream;
  }, [mediaStream]);

  useEffect(() => {
    if (stage !== "record") {
      return;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        awayStartRef.current = performance.now();
      } else if (awayStartRef.current) {
        awayTotalRef.current += performance.now() - awayStartRef.current;
        awayStartRef.current = null;
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      awayStartRef.current = null;
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "prep") {
      return;
    }

    setPrepRemaining(currentQuestion.preparationSeconds);

    const interval = window.setInterval(() => {
      setPrepRemaining((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(interval);
          setStage("record");
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    setPrepTimerInterval(interval);

    return () => {
      window.clearInterval(interval);
      setPrepTimerInterval(null);
    };
  }, [stage, currentQuestion]);

  const handleSkipPrep = () => {
    if (prepTimerInterval) {
      window.clearInterval(prepTimerInterval);
      setPrepTimerInterval(null);
    }
    setPrepRemaining(0);
    setStage("record");
  };

  useEffect(() => {
    if (stage !== "record") {
      return;
    }

    startRecording();
    setRecordRemaining(currentQuestion.responseSeconds);

    const interval = window.setInterval(() => {
      recordingDurationRef.current += 1;
      setRecordRemaining((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(interval);
          stopRecording();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentQuestion]);

  useEffect(() => {
    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [currentPreviewUrl]);

  const handleBegin = () => {
    setStage("prep");
  };

  const startRecording = () => {
    if (!mediaStream) {
      return;
    }

    videoChunksRef.current = [];
    audioChunksRef.current = [];
    awayTotalRef.current = 0;
    recordingDurationRef.current = 0;
    recordStartRef.current = performance.now();

    const videoRecorder = new MediaRecorder(mediaStream, {
      mimeType: "video/webm;codecs=vp9",
    });
    const audioStream = new MediaStream(mediaStream.getAudioTracks());
    const audioRecorder = new MediaRecorder(audioStream, {
      mimeType: "audio/webm",
    });

    videoRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        videoChunksRef.current.push(event.data);
      }
    };

    audioRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    videoRecorder.onstop = handleRecordingStop;

    videoRecorderRef.current = videoRecorder;
    audioRecorderRef.current = audioRecorder;

    videoRecorder.start();
    audioRecorder.start();
  };

  const stopRecording = () => {
    if (videoRecorderRef.current?.state === "recording") {
      videoRecorderRef.current.stop();
    }
    if (audioRecorderRef.current?.state === "recording") {
      audioRecorderRef.current.stop();
    }
    recordStartRef.current = recordStartRef.current ?? performance.now();
  };

  const handleRecordingStop = () => {
    const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const previewUrl = URL.createObjectURL(videoBlob);

    const startedAt = recordStartRef.current
      ? new Date(performance.timeOrigin + recordStartRef.current).toISOString()
      : new Date().toISOString();
    const endedAt = new Date().toISOString();
    const recordDuration =
      recordStartRef.current !== null ? performance.now() - recordStartRef.current : 0;
    const tabAwayRatio =
      recordDuration > 0 ? Math.min(1, awayTotalRef.current / recordDuration) : 0;

    setCurrentPreviewUrl(previewUrl);
    setStage("review");

    const response: RecordedResponse = {
      question: currentQuestion,
      videoBlob,
      audioBlob,
      previewUrl,
      metadata: {
        startedAt,
        endedAt,
        prepSeconds: currentQuestion.preparationSeconds,
        tabAwayRatio,
      },
    };

    const updatedResponses = [...responsesRef.current];
    updatedResponses[questionIndex] = response;
    responsesRef.current = updatedResponses;
    setResponses(updatedResponses);
  };

  const handleRetake = () => {
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      setCurrentPreviewUrl(null);
    }
    setStage("prep");
  };

  const handleContinue = () => {
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      setCurrentPreviewUrl(null);
    }

    const isLastQuestion = questionIndex === questions.length - 1;

    if (isLastQuestion) {
      setStage("completed");
      // Use ref to get the latest responses synchronously
      const completedResponses = responsesRef.current.filter(Boolean);
      onComplete(completedResponses);
    } else {
      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      setPrepRemaining(questions[nextIndex].preparationSeconds);
      setRecordRemaining(questions[nextIndex].responseSeconds);
      setStage("prep");
    }
  };

  const visualTimerValue = useMemo(() => {
    if (stage === "prep") {
      return { label: "Prep", value: prepRemaining };
    }
    if (stage === "record") {
      return { label: "Recording", value: recordRemaining };
    }
    return { label: "Ready", value: currentQuestion.preparationSeconds };
  }, [stage, prepRemaining, recordRemaining, currentQuestion]);

  return (
    <section className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          Step 3
        </p>
        <h2 className="text-3xl font-bold text-white mt-2">Mock Interview Studio</h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {cameraError
            ? cameraError
            : "We manage the timers. Focus on storytelling, impact metrics, and presence. You can skip prep time if you're ready."}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl border-2 border-slate-600 bg-black shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full bg-black object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-300 bg-sky-900/50 px-3 py-1 rounded-full">
                Question {questionIndex + 1} of {questions.length}
              </p>
              <span className="text-xs font-medium text-slate-300 bg-slate-800/70 px-2 py-1 rounded">
                {currentQuestion.category}
              </span>
            </div>
            <p className="text-lg font-bold text-white leading-tight">{currentQuestion.prompt}</p>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border-2 border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              {visualTimerValue.label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold text-white">
                {visualTimerValue.value.toString().padStart(2, "0")}
              </p>
              <p className="text-xl font-medium text-slate-300">s</p>
            </div>
            {stage === "prep" && (
              <div className="mt-4 h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-1000"
                  style={{
                    width: `${(prepRemaining / currentQuestion.preparationSeconds) * 100}%`,
                  }}
                />
              </div>
            )}
            {stage === "record" && (
              <div className="mt-4 h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-1000"
                  style={{
                    width: `${(recordRemaining / currentQuestion.responseSeconds) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {stage === "idle" && (
              <button
                type="button"
                className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:bg-sky-600"
                onClick={handleBegin}
                disabled={!mediaStream}
              >
                Start Prep
              </button>
            )}
            {stage === "prep" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-600 bg-slate-800/80 px-4 py-3 backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-200 mb-1">
                    💡 Preparation Time
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Use this time to outline your story using the STAR method. Recording will start automatically when time expires.
                  </p>
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl border-2 border-sky-500/60 bg-sky-500/20 px-4 py-3 text-sm font-semibold text-sky-200 transition-all hover:bg-sky-500/30 hover:border-sky-400 hover:shadow-lg"
                  onClick={handleSkipPrep}
                >
                  ⏩ Skip Prep & Start Recording
                </button>
              </div>
            )}
            {stage === "record" && (
              <div className="rounded-2xl border-2 border-emerald-500/60 bg-emerald-500/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm font-semibold text-emerald-200 mb-1 flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Recording in Progress
                </p>
                <p className="text-xs text-emerald-300 leading-relaxed">
                  Stay focused on one clear narrative with impact metrics. Speak clearly and maintain eye contact with the camera.
                </p>
              </div>
            )}
            {stage === "review" && currentPreviewUrl && (
              <div className="space-y-3">
                <video
                  controls
                  src={currentPreviewUrl}
                  className="w-full rounded-2xl border border-slate-700"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 rounded-xl border-2 border-slate-500 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-700 hover:border-slate-400"
                    onClick={handleRetake}
                  >
                    🔄 Retake
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-sky-600 hover:to-sky-700 hover:shadow-xl"
                    onClick={handleContinue}
                  >
                    ✓ Continue
                  </button>
                </div>
              </div>
            )}
            {stage === "completed" && (
              <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Interview recorded. Generating evaluation...
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
