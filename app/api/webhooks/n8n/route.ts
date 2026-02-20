import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId, status, cortes } = body;

    console.log("Received n8n webhook:", { videoId, status, cortesCount: cortes?.length });

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    // 1. Update Video Status
    let dbStatus = status;
    if (status === 'completed') {
        dbStatus = 'rendering'; // Move to FFmpeg phase
    } else if (status === 'error') {
        dbStatus = 'error';
    } else {
        dbStatus = 'processing';
    }

    try {
        await prisma.video.update({
            where: { id: videoId },
            data: { status: dbStatus }
        });
    } catch (e) {
        console.error("Error updating video status with Prisma:", e);
        return NextResponse.json({ error: "Failed to update video status" }, { status: 500 });
    }

    // 2. Insert Cortes if completed
    if (status === "completed" && cortes) {
      let cortesArray = cortes;
      if (typeof cortes === 'string') {
        try {
            // Cleanup potential markdown or extra chars
            const cleanJson = cortes.replace(/```json/g, '').replace(/```/g, '').trim();
            cortesArray = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse cortes JSON:", e);
            cortesArray = [];
        }
      }

      if (Array.isArray(cortesArray)) {
          console.log(`Processing ${cortesArray.length} cuts for video ${videoId}`);
          
          const cortesToInsert = cortesArray.map((c: any) => ({
            videoId: videoId,
            title: c.title || "Corte Viral",
            caption: c.summary || "",
            videoUrl: "", // Not rendered yet
            storagePath: "", // Waiting for render
            viralScore: c.viralScore ? Math.round(c.viralScore) : 0,
            thumbnailUrl: c.thumbnailUrl || null,
            startTime: c.start ? String(c.start) : null,
            endTime: c.end ? String(c.end) : null,
            viralReason: c.summary || null,
            wordsJson: c.words ? JSON.stringify(c.words) : null,
          }));
    
          if (cortesToInsert.length > 0) {
            try {
                // Prisma createMany is supported in Postgres
                await prisma.corte.createMany({
                    data: cortesToInsert
                });
                console.log(`Successfully inserted ${cortesToInsert.length} cortes for video ${videoId}`);
                
                // Trigger auto-render in background
                import("@/lib/render-service").then(({ renderVideoCuts }) => {
                    renderVideoCuts(videoId).catch(err => {
                        console.error(`[Webhook] Background render failed for video ${videoId}:`, err);
                    });
                });

            } catch (insertError) {
               console.error("Error inserting cortes with Prisma:", insertError);
            }
          }
      }
    }

    revalidatePath("/dashboard");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
