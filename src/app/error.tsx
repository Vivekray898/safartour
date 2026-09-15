"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 pt-32 text-center">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-base text-muted">
        An unexpected error occurred. Please try again — or reach us on
        WhatsApp and we&apos;ll help you directly.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} variant="primary" size="lg">
          Try Again
        </Button>
        <Button href="/" variant="outline" size="lg">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
