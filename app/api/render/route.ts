import { NextResponse } from "next/server";
import { renderVideoCuts } from "@/lib/render-service";

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    const result = await renderVideoCuts(videoId);

    return NextResponse.json({ 
        success: true, 
        rendered: result.rendered,
        total: result.total,
        archived: result.archived
    });

  } catch (error: any) {
    console.error("Render API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
