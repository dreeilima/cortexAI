import ffmpeg from "fluent-ffmpeg";
import { getPresignedUploadUrl } from "./r2";
import fs from "fs";
import path from "path";
import os from "os";

// ========== TYPES ==========

interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

interface CutOptions {
  sourceUrl: string;
  startTime: string;      // HH:MM:SS
  endTime: string;        // HH:MM:SS
  outputKey: string;      // R2 key
  style?: "fill" | "blur"; // crop mode
  title?: string;         // viral title overlay
  words?: WordTimestamp[]; // word-by-word captions
}

// ========== MAIN PROCESSOR ==========

export async function processVideoCut(opts: CutOptions) {
  const { sourceUrl, startTime, endTime, outputKey, style = "fill", title, words } = opts;

  return new Promise<{ success: boolean; key: string }>(async (resolve, reject) => {
    try {
      console.log(`[VideoProcessor] Starting: ${outputKey} (style: ${style})`);

      const tempId = Math.random().toString(36).substring(7);
      const tempPath = path.join(os.tmpdir(), `cut-${tempId}.mp4`);
      const duration = calculateDuration(startTime, endTime);
      const startSec = parseTime(startTime);

      // Build the complex filter graph
      const filterGraph = buildFilterGraph({ style, title, words, startSec, duration });

      const cmd = ffmpeg(sourceUrl)
        .setStartTime(startTime)
        .setDuration(duration)
        .complexFilter(filterGraph.filters)
        .outputOptions([
          "-map", `[${filterGraph.outputLabel}]`,
          "-map", "0:a?",
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-shortest",
          "-y"
        ])
        .output(tempPath);

      cmd.on("end", async () => {
          console.log(`[VideoProcessor] FFmpeg done. Uploading to R2: ${outputKey}`);

          try {
            const fileBuffer = fs.readFileSync(tempPath);
            const { uploadUrl, fileKey } = await getPresignedUploadUrl(outputKey, "video/mp4");

            if (!uploadUrl) throw new Error("Failed to get upload URL");

            const uploadRes = await fetch(uploadUrl, {
              method: "PUT",
              body: fileBuffer,
              headers: { "Content-Type": "video/mp4" },
            });

            if (!uploadRes.ok) throw new Error("Upload to R2 failed");

            fs.unlinkSync(tempPath);
            resolve({ success: true, key: fileKey || outputKey });
          } catch (uploadErr) {
            reject(uploadErr);
          }
        })
        .on("error", (err: Error) => {
          console.error("[VideoProcessor] FFmpeg error:", err.message);
          // Cleanup temp file on error
          try { fs.unlinkSync(tempPath); } catch {}
          reject(err);
        })
        .run();
    } catch (e) {
      reject(e);
    }
  });
}

// ========== FILTER GRAPH BUILDER ==========

interface FilterBuildOptions {
  style: "fill" | "blur";
  title?: string;
  words?: WordTimestamp[];
  startSec: number;
  duration: number;
}

interface FilterGraph {
  filters: string[];
  outputLabel: string;
}

function buildFilterGraph(opts: FilterBuildOptions): FilterGraph {
  const { style, title, words, startSec, duration } = opts;
  const filters: string[] = [];
  let currentLabel = "base";

  // ------ STEP 1: Crop/Blur to 9:16 (1080x1920) ------
  if (style === "blur") {
    // Blur background: split into blurred bg + sharp foreground overlay
    filters.push(
      // Create blurred background scaled to 1080x1920
      `[0:v]split=2[bg][fg]`,
      `[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[blurbg]`,
      // Scale foreground to fit width while maintaining aspect ratio
      `[fg]scale=1080:-2:force_original_aspect_ratio=decrease[fgscaled]`,
      // Overlay foreground centered on blurred background
      `[blurbg][fgscaled]overlay=(W-w)/2:(H-h)/2[${currentLabel}]`
    );
  } else {
    // Fill (crop): center crop to 9:16
    filters.push(
      `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[${currentLabel}]`
    );
  }

  // ------ STEP 2: Viral Title (full duration, top area) ------
  if (title) {
    const nextLabel = "titled";
    const escapedTitle = escapeFFmpegText(title);
    
    // White bold text with black outline on semi-transparent dark box at top
    // Font: using Impact/Arial Bold available on Windows
    filters.push(
      `[${currentLabel}]drawtext=` +
      `text='${escapedTitle}':` +
      `fontfile='C\\:/Windows/Fonts/impact.ttf':` +
      `fontsize=58:` +
      `fontcolor=white:` +
      `borderw=2:` +
      `bordercolor=black:` +
      `box=1:` +
      `boxcolor=red@1:` +
      `boxborderw=20:` +
      `x=(w-text_w)/2:` +
      `y=180:` +
      `line_spacing=8` +
      `[${nextLabel}]`
    );
    currentLabel = nextLabel;
  }

  // ------ STEP 3: Word-by-word captions (bottom area) ------
  if (words && words.length > 0) {
    // 1-2 words per line for that viral dynamic feel
    const groups = groupWordsIntoLines(words, 2);

    groups.forEach((group, i) => {
      const nextLabel = `cap${i}`;
      // Relative timing: words come with absolute timestamps from Deepgram
      // We need to subtract the cut's startTime to make them relative
      const relStart = Math.max(0, group.start - startSec);
      const relEnd = Math.min(duration, group.end - startSec);

      if (relEnd <= relStart) return; // Skip if outside cut range

      const escapedText = escapeFFmpegText(group.text);

      filters.push(
        `[${currentLabel}]drawtext=` +
        `text='${escapedText.toUpperCase()}':` +
        `fontfile='C\\:/Windows/Fonts/impact.ttf':` +
        `fontsize=64:` +
        `fontcolor=yellow:` +
        `borderw=4:` +
        `bordercolor=black:` +
        `x=(w-text_w)/2:` +
        `y=h-400:` +
        `enable='between(t,${relStart.toFixed(3)},${relEnd.toFixed(3)})'` +
        `[${nextLabel}]`
      );
      currentLabel = nextLabel;
    });
  }

  // Rename final label to "vout"
  if (currentLabel !== "vout") {
    filters.push(`[${currentLabel}]null[vout]`);
  }

  return {
    filters,
    outputLabel: "vout",
  };
}

// ========== HELPERS ==========

/**
 * Group words into lines of N words each for subtitle display
 */
function groupWordsIntoLines(words: WordTimestamp[], wordsPerLine: number) {
  const groups: { text: string; start: number; end: number }[] = [];

  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    groups.push({
      text: chunk.map((w) => w.word).join(" "),
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
    });
  }

  return groups;
}

/**
 * Escape text for FFmpeg drawtext filter
 * Must escape: ' : \ and wrap certain special chars
 */
function escapeFFmpegText(text: string): string {
  return text
    .replace(/\\/g, "\\\\\\\\")   // backslash
    .replace(/'/g, "\u2019")       // replace ' with unicode right quote
    .replace(/:/g, "\\:")         // colon
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/%/g, "%%")          // percent
    .replace(/;/g, "\\;")        // semicolon
    .toUpperCase();               // viral titles are CAPS
}

function calculateDuration(start: string, end: string): number {
  const startSec = parseTime(start);
  const endSec = parseTime(end);
  return endSec - startSec;
}

function parseTime(time: string): number {
  if (!time) return 0;
  if (time.includes(":")) {
    const parts = time.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return parseFloat(time);
}
