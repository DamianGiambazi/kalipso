"use client";

import { useState, useEffect, useRef } from "react";
import { TopBar } from "./components/TopBar";
import { Hero } from "./components/Hero";
import { StatementForm } from "./components/StatementForm";
import { ResponseCard } from "./components/ResponseCard";
import { ErrorCard } from "./components/ErrorCard";
import type { KalipsoNotarization } from "@/lib/types";

interface ErrorState {
  code: string;
  message: string;
  correlationId?: string;
}

export default function HomePage() {
  const [notarization, setNotarization] = useState<KalipsoNotarization | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  // Scroll the response into view when it appears
  useEffect(() => {
    if ((notarization || error) && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [notarization, error]);

  function handleResult(result: KalipsoNotarization) {
    setError(null);
    setNotarization(result);
  }

  function handleError(err: ErrorState) {
    setNotarization(null);
    setError(err);
  }

  return (
    <>
      <TopBar />
      <div className="mx-auto max-w-3xl px-5 py-12 md:px-6 md:py-16">
        <Hero />

        <main id="main">
          {/* Anchor for the result region — Hero stays at top, scrollIntoView lands here */}
          <div ref={responseRef}>
            {notarization && <ResponseCard notarization={notarization} />}
            {error && (
              <ErrorCard
                code={error.code}
                message={error.message}
                correlationId={error.correlationId}
                onDismiss={() => setError(null)}
              />
            )}
          </div>

          <StatementForm
            onResult={handleResult}
            onError={handleError}
            onRecording={setIsRecording}
            isRecording={isRecording}
          />
        </main>
      </div>
    </>
  );
}
