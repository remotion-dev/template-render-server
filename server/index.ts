import express from "express";
import { makeRenderQueue } from "./render-queue";
import { bundle } from "@remotion/bundler";
import path from "node:path";
import { ensureBrowser } from "@remotion/renderer";
import { registerTts } from "./tts";

const { PORT = 3000, REMOTION_SERVE_URL, PUBLIC_URL, API_KEY } = process.env;

function setupApp({ remotionBundleUrl }: { remotionBundleUrl: string }) {
  const app = express();

  const rendersDir = path.resolve("renders");

  const queue = makeRenderQueue({
    port: Number(PORT),
    publicUrl: PUBLIC_URL,
    serveUrl: remotionBundleUrl,
    rendersDir,
  });

  // Optional shared secret: set API_KEY and send it as "x-api-key" on POST/DELETE.
  // GET/HEAD (status, mp4 and voice files) stay open so the video can be downloaded.
  app.use((req, res, next) => {
    if (!API_KEY || (req.method !== "POST" && req.method !== "DELETE")) {
      next();
      return;
    }
    if (req.header("x-api-key") !== API_KEY) {
      res.status(401).json({ message: "Invalid or missing x-api-key" });
      return;
    }
    next();
  });

  // Host renders on /renders
  app.use("/renders", express.static(rendersDir));
  app.use(express.json({ limit: "5mb" }));

  // Free text-to-speech: POST /tts  and  GET /voice/<id>.mp3
  registerTts(app);

  // Endpoint to create a new job
  app.post("/renders", async (req, res) => {
    const compositionId = req.body?.compositionId ?? "HelloWorld";
    const inputProps =
      req.body?.inputProps ??
      (typeof req.body?.titleText === "string"
        ? { titleText: req.body.titleText }
        : {});

    if (typeof compositionId !== "string") {
      res.status(400).json({ message: "compositionId must be a string" });
      return;
    }
    if (
      typeof inputProps !== "object" ||
      inputProps === null ||
      Array.isArray(inputProps)
    ) {
      res.status(400).json({ message: "inputProps must be an object" });
      return;
    }

    const jobId = queue.createJob({ compositionId, inputProps });

    res.json({ jobId });
  });

  // Endpoint to get a job status
  app.get("/renders/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const job = queue.jobs.get(jobId);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    // Error objects serialize to {} in JSON, so send the message explicitly.
    if (job.status === "failed") {
      res.json({ ...job, error: job.error.message });
      return;
    }

    res.json(job);
  });

  // Endpoint to cancel a job
  app.delete("/renders/:jobId", (req, res) => {
    const jobId = req.params.jobId;

    const job = queue.jobs.get(jobId);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (job.status !== "queued" && job.status !== "in-progress") {
      res.status(400).json({ message: "Job is not cancellable" });
      return;
    }

    job.cancel();

    res.json({ message: "Job cancelled" });
  });

  return app;
}

async function main() {
  await ensureBrowser();

  const remotionBundleUrl = REMOTION_SERVE_URL
    ? REMOTION_SERVE_URL
    : await bundle({
        entryPoint: path.resolve("remotion/index.ts"),
        onProgress(progress) {
          console.info(`Bundling Remotion project: ${progress}%`);
        },
      });

  const app = setupApp({ remotionBundleUrl });

  app.listen(PORT, () => {
    console.info(`Server is running on port ${PORT}`);
  });
}

main();
