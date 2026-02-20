import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Re-use R2 config (should be exported better, but duplicating for safety in cron)
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

export async function GET(request: Request) {
    // Basic authorization for cron (Vercel Cron Header)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new NextResponse('Unauthorized', { status: 401 });
    // }
    
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Find videos to cleanup
        const videos = await prisma.video.findMany({
            where: {
                createdAt: { lt: twentyFourHoursAgo },
                status: 'completed',
                originalUrl: { not: null } // Only if we still have the original
            },
            include: { cortes: true }
        });

        console.log(`Found ${videos.length} videos to cleanup.`);
        
        const deletedIds = [];
        
        for (const video of videos) {
            // Check if all cuts have been rendered (have a storagePath)
            const allRendered = video.cortes.every(c => c.storagePath && c.storagePath !== "");
            
            if (allRendered || video.cortes.length === 0) {
                // Delete from R2
                if (video.originalUrl) {
                    let fileKey = video.originalUrl;
                    if (fileKey.startsWith("http")) {
                        fileKey = fileKey.split("/").pop()?.split("?")[0] || video.originalUrl;
                    }
                    fileKey = decodeURIComponent(fileKey);
                    
                    try {
                        await r2.send(new DeleteObjectCommand({
                            Bucket: R2_BUCKET_NAME,
                            Key: fileKey
                        }));
                        console.log(`Deleted R2 file: ${fileKey}`);
                    } catch (e) {
                         console.error(`Failed to delete R2 file ${fileKey}`, e);
                         continue; // Skip DB update if R2 delete fails
                    }
                    
                    // Update DB
                    await prisma.video.update({
                        where: { id: video.id },
                        data: { 
                            originalUrl: null,
                            status: 'archived'
                        }
                    });
                    
                    deletedIds.push(video.id);
                }
            } else {
                console.log(`Skipping video ${video.id} - not all cuts rendered.`);
            }
        }
        
        return NextResponse.json({ success: true, deleted: deletedIds.length, ids: deletedIds });

    } catch (e: any) {
        console.error("Cleanup Cron Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
