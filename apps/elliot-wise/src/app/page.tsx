import { Suspense } from "react";
import { Funnel } from "funnel-core";
import config from "../config";
import { questions } from "../questions";

const APP_ID = "elliot-wise";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/80">Loading…</div>}>
      <Funnel
        appId={APP_ID}
        config={config}
        questions={questions}
      />
    </Suspense>
  );
}
