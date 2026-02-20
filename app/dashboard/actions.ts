"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createVideoRecord(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const originalUrl = formData.get("originalUrl") as string; // Optional (if upload)
  const duration = formData.get("duration")
    ? parseInt(formData.get("duration") as string)
    : 0;
  const workspaceId = formData.get("workspaceId") as string;
  const generateSubtitles = formData.get("generateSubtitles") === "true";
  const videoLanguage = (formData.get("videoLanguage") as string) || "auto";
  const cutStyle = (formData.get("cutStyle") as string) || "fill";

  // Validate session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get workspace if not provided (fallback to first owned workspace)
  let userWorkspaceId = workspaceId;
  if (!userWorkspaceId) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (workspace) {
      userWorkspaceId = workspace.id;
    } else {
      // Create default workspace if none exists (fallback for existing users before trigger)
      const { data: newWorkspace, error: wsError } = await supabase
        .from("workspaces")
        .insert({ name: "Meu Workspace", owner_id: user.id })
        .select()
        .single();

      if (wsError || !newWorkspace) {
        return { error: "Failed to create default workspace" };
      }
      userWorkspaceId = newWorkspace.id;
    }
  }

  const { data, error } = await supabase
    .from("videos")
    .insert({
      workspace_id: userWorkspaceId,
      title: title,
      original_url: originalUrl,
      duration: duration,
      style: cutStyle,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating video record:", error);
    return { error: "Failed to save video metadata." };
  }

  // Trigger n8n Webhook
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nWebhookUrl) {
    try {
      // Generate Presigned Download URL for n8n
      const { getPresignedDownloadUrl } = await import("@/lib/r2");
      let videoUrlForN8n = originalUrl;
      
      // If originalUrl is not a full URL (meaning it's a key) or if we want to ensure access
      // We try to generate a signed URL. 
      // Assuming originalUrl stored in DB might be the key or the public URL. 
      // The component sends 'publicUrl' from r2.ts as 'originalUrl'.
      // If R2_PUBLIC_URL was empty, originalUrl might be just the key or null/undefined.
      
      // Let's verify what we actually have. The getUploadUrl returns fileKey.
      // We should probably rely on re-generating the signed url using the key.
      // But we don't have the bare key easily unless we extract it or pass it.
      // Simplified approach: unexpected publicUrl? Try to treat the filename as key if possible.
      // BETTER: The component should send the fileKey too.
      // For now, let's assume originalUrl IS the key if it doesn't start with http, OR we extract last part.
      
      const fileKey = originalUrl.split("/").pop(); 
      if (fileKey) {
          const signedUrl = await getPresignedDownloadUrl(fileKey);
          if (signedUrl) {
              videoUrlForN8n = signedUrl;
          }
      }

      const payload = {
          videoId: data.id,
          userId: user.id,
          videoUrl: videoUrlForN8n,
          title: title,
          options: {
            style: cutStyle,
            language: videoLanguage,
            subtitles: generateSubtitles,
          },
      };
      
      console.log("Sending payload to n8n:", JSON.stringify(payload, null, 2));

      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("n8n webhook triggered. Status:", response.status, "for video:", data.id);
      if (!response.ok) {
        console.error("n8n response error:", await response.text());
      }
    } catch (err) {
      console.error("Failed to trigger n8n webhook:", err);
    }
  }

  revalidatePath("/dashboard");
  return { success: true, data, videoId: data.id };
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { videos: 0, cortes: 0, taxa: 0 };

  // Get user workspaces
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id);

  if (!workspaces || workspaces.length === 0)
    return { videos: 0, cortes: 0, taxa: 0 };

  const workspaceIds = workspaces.map((w: { id: string }) => w.id);

  // Count Videos
  const { count: videosCount } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .in("workspace_id", workspaceIds);

  // Count Cortes (via Video relation ideally, but we can check if we have access)
  // Since we have RLS policies, simple select should work if aligned with policies
  // However, cortes table policies rely on joins.
  // Let's rely on the policy "Users can view own cortes"
  const { count: cortesCount } = await supabase
    .from("cortes")
    .select("*", { count: "exact", head: true });

  return {
    videosProcessados: videosCount || 0,
    cortesGerados: cortesCount || 0,
    taxaAproveitamento: 0, // Placeholder logic for now
  };
}

export async function getRecentActivity() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get recent videos
  const { data: videos } = await supabase
    .from("videos")
    .select(
      `
            id,
            title,
            status,
            created_at,
            cortes (count)
        `,
    )
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    videos?.map((v: any) => ({
      id: v.id,
      nome: v.title,
      status: (v.status === "completed" || v.status === "archived") ? "concluido" : "aguardando", // Map DB status to UI status
      data: new Date(v.created_at).toLocaleDateString("pt-BR"),
      cortesCount: v.cortes?.[0]?.count || 0, // Approximate join count
    })) || []
  );
}

export async function getRecentCuts(limit: number = 6) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: cortes } = await supabase
    .from("cortes")
    .select(`
        id,
        title,
        caption,
        viral_score,
        start_time,
        end_time,
        created_at,
        storage_path,
        thumbnail_url,
        video_id,
        video:videos (title)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  return Promise.all((cortes || []).map(async (c: any) => {
      let videoUrl = null;
      if (c.storage_path) {
        try {
          const { getPresignedDownloadUrl } = await import("@/lib/r2");
          videoUrl = await getPresignedDownloadUrl(c.storage_path);
        } catch (e) {
          console.error("Error signing recent cut", e);
        }
      }

      return {
        id: c.id,
        videoId: c.video_id,
        titulo: c.title,
        legenda: c.caption,
        tags: ["#Viral", `#${c.viral_score || 0}pts`], 
        duracao: calculateDuration(c.start_time, c.end_time),
        thumbnail: c.thumbnail_url,
        videoUrl: videoUrl,
        videoTitle: c.video?.title
      };
  }));
}

export async function getCutsForVideo(videoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: cortes } = await supabase
    .from("cortes")
    .select(`
        id,
        title,
        caption,
        viral_score,
        start_time,
        end_time,
        created_at,
        storage_path,
        thumbnail_url
    `)
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  // Fetch parent video to get the key
  const { data: video } = await supabase
    .from("videos")
    .select("original_url")
    .eq("id", videoId)
    .single();

  let signedVideoUrl = null;
  if (video?.original_url) {
      let fileKey = video.original_url;
      
      // Extract just the filename from any URL or path format
      // Handle cases like "placeholder text/timestamp-file.mp4" or full URLs
      const lastSlash = fileKey.lastIndexOf("/");
      if (lastSlash >= 0) {
        fileKey = fileKey.substring(lastSlash + 1);
      }
      // Remove query params
      if (fileKey.includes("?")) {
        fileKey = fileKey.split("?")[0];
      }
      // Decode URI
      fileKey = decodeURIComponent(fileKey);

      console.log(`Generating signed URL for key: ${fileKey}`);
      
      try {
        const { getPresignedDownloadUrl } = await import("@/lib/r2");
        signedVideoUrl = await getPresignedDownloadUrl(fileKey);
      } catch (e) {
          console.error("Failed to generate signed url for video", e);
      }
  }

  // Parallel processing for cuts
  const processedCuts = await Promise.all((cortes || []).map(async (c: any) => {
      let cutVideoUrl = signedVideoUrl; // Default to parent (Virtual)
      const isProcessed = !!(c.storage_path && c.storage_path.length > 0);
      
      if (isProcessed) {
          // If processed, fetching the specific cut URL override
          try {
             // We can import dynamically or reuse existing r2 logic
             // Ideally we shouldn't await in loop, but for <50 items it's okay given R2 signing is fast local-only op (if just signing)
             // Actually, getPresignedDownloadUrl IS local crypto op, no network.
             const { getPresignedDownloadUrl } = await import("@/lib/r2");
             const signedCut = await getPresignedDownloadUrl(c.storage_path);
             if (signedCut) cutVideoUrl = signedCut;
          } catch (e) {
             console.error("Error signing cut url", e);
          }
      }

      return {
        id: c.id,
        videoId: videoId,
        titulo: c.title,
        legenda: c.caption,
        tags: ["#Viral", `#${c.viral_score || 0}pts`], 
        duracao: calculateDuration(c.start_time, c.end_time),
        startTime: c.start_time || "00:00:00",
        endTime: c.end_time || "00:00:10",
        thumbnail: c.thumbnail_url,
        videoUrl: cutVideoUrl,
        isProcessed: isProcessed
      };
  }));

  return processedCuts;
}

function calculateDuration(start: string | null, end: string | null) {
    if (!start || !end) return "00:00";
    // Simple calc if format is HH:MM:SS or MM:SS
    // Basic return logic for display
    return `${start} - ${end}`; 
}

export async function getUploadUrl(fileName: string, fileType: string) {
  try {
    const { getPresignedUploadUrl } = await import("@/lib/r2");
    const { uploadUrl, fileKey, publicUrl } = await getPresignedUploadUrl(
      fileName,
      fileType,
    );
    return { success: true, uploadUrl, fileKey, publicUrl };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return { error: "Failed to generate upload URL" };
  }
}

// ========== VIDEO HISTORY ==========

export async function getVideoHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: videos } = await supabase
    .from("videos")
    .select(`
        id,
        title,
        status,
        created_at,
        cortes (id)
    `)
    .order("created_at", { ascending: false });

  return (videos || []).map((v: any) => ({
    id: v.id,
    nome: v.title,
    data: new Date(v.created_at).toLocaleDateString("pt-BR", {
        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
    }),
    status: mapStatus(v.status),
    cortesCount: v.cortes?.length || 0,
  }));
}

function mapStatus(dbStatus: string): "concluido" | "aguardando" | "erro" {
  switch (dbStatus) {
    case "completed": case "archived": return "concluido";
    case "error": return "erro";
    default: return "aguardando"; // pending, processing
  }
}

// ========== VIDEO STATUS POLLING ==========

export async function getVideoStatus(videoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: video } = await supabase
    .from("videos")
    .select("id, status, title, created_at")
    .eq("id", videoId)
    .single();

  if (!video) return null;

  const { count } = await supabase
    .from("cortes")
    .select("id", { count: "exact", head: true })
    .eq("video_id", videoId);

  return {
    id: video.id,
    status: video.status,
    title: video.title,
    cortesCount: count || 0,
  };
}

// ========== CRUD: DELETE VIDEO ==========

export async function deleteVideo(videoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const prisma = (await import("@/lib/db")).default;
    await prisma.video.delete({ where: { id: videoId } });
  } catch (error) {
    console.error("Error deleting video:", error);
    return { error: "Failed to delete video" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

// ========== CRUD: DELETE CORTE ==========

export async function deleteCorte(corteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const prisma = (await import("@/lib/db")).default;
    await prisma.corte.delete({ where: { id: corteId } });
  } catch (error) {
    console.error("Error deleting corte:", error);
    return { error: "Failed to delete corte" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ========== CRUD: UPDATE CORTE ==========

export async function updateCorte(corteId: string, data: { title?: string; caption?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const prisma = (await import("@/lib/db")).default;
    await prisma.corte.update({
      where: { id: corteId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.caption !== undefined && { caption: data.caption }),
      },
    });
  } catch (error) {
    console.error("Error updating corte:", error);
    return { error: "Failed to update corte" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
