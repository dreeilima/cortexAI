import prisma from "@/lib/db";
import { processVideoCut } from "@/lib/video-processor";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// R2 Config
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "cortex-raw";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export async function renderVideoCuts(videoId: string) {
    console.log(`[RenderService] Starting render for video ${videoId}`);
    
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { cortes: true }
    });

    if (!video || !video.originalUrl) {
      throw new Error("Video not found or missing original URL");
    }

    // 1. Generate signed URL for source
    const { getPresignedDownloadUrl } = await import("@/lib/r2");
    
    let fileKey = video.originalUrl;
    const lastSlash = fileKey.lastIndexOf("/");
    if (lastSlash >= 0) {
      fileKey = fileKey.substring(lastSlash + 1);
    }
    if (fileKey.includes("?")) {
      fileKey = fileKey.split("?")[0];
    }
    fileKey = decodeURIComponent(fileKey);
    
    const sourceUrl = await getPresignedDownloadUrl(fileKey);
    if (!sourceUrl) {
        throw new Error("Failed to generate source URL");
    }

    const videoStyle = (video.style as "fill" | "blur") || "fill";
    const renderedCuts: string[] = [];
    const errors: { id: string; error: string }[] = [];

    // 2. Process each cut with full effects
    for (const corte of video.cortes) {
      if (!corte.startTime || !corte.endTime) continue;
      
      // Skip if already rendered
      if (corte.storagePath && corte.storagePath.length > 0) {
          renderedCuts.push(corte.id);
          continue;
      }

      const outputKey = `cortes/${video.id}/${corte.id}.mp4`;
      
      // Parse word timestamps if available
      let words: WordTimestamp[] | undefined;
      if (corte.wordsJson) {
        try {
          words = JSON.parse(corte.wordsJson);
        } catch {
          console.warn(`[RenderService] Invalid wordsJson for cut ${corte.id}`);
        }
      }

      try {
        const result: any = await processVideoCut({
            sourceUrl,
            startTime: corte.startTime,
            endTime: corte.endTime,
            outputKey,
            style: videoStyle,
            title: corte.title || undefined,
            words,
        });

        const actualKey = result.key;
        
        // Update DB with rendered path
        const publicUrl = process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/${actualKey}` : actualKey;
        
        await prisma.corte.update({
            where: { id: corte.id },
            data: { 
                videoUrl: publicUrl,
                storagePath: actualKey
            }
        });
        
        console.log(`[RenderService] Rendered cut ${corte.id}`);
        renderedCuts.push(corte.id);

      } catch (err: any) {
        console.error(`[RenderService] Failed to render cut ${corte.id}:`, err?.message || err);
        errors.push({ id: corte.id, error: err?.message || "Unknown" });
      }
    }

    // 3. Cleanup Original if all successful
    const allSuccessful = renderedCuts.length === video.cortes.length;
    
    if (allSuccessful && video.cortes.length > 0) {
        console.log(`[RenderService] All cuts rendered. Deleting original: ${fileKey}`);
        try {
            await r2.send(new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fileKey
            }));
            
            await prisma.video.update({
                where: { id: videoId },
                data: { 
                    originalUrl: "",  // empty string (not null) for archived
                    status: 'archived'
                }
            });
            console.log(`[RenderService] Original deleted and video archived.`);
        } catch (cleanupErr) {
            console.error(`[RenderService] Failed to cleanup original:`, cleanupErr);
        }
    }

    return { 
        success: true, 
        rendered: renderedCuts.length, 
        total: video.cortes.length,
        errors,
        archived: allSuccessful
    };
}
