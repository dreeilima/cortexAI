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
      status: "pending", // Initial status
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating video record:", error);
    return { error: "Failed to save video metadata." };
  }

  // SIMULATION: In a real app, this would happen in a background job queue (e.g., BullMQ)
  // Here we simulate the "processed" state and send the email immediately for demonstration
  // In production: triggerCloudFunction(data.id) -> Cloud Function updates DB -> triggers Email

  import("@/lib/mail")
    .then(async ({ sendEmail }) => {
      import("@/lib/email-templates").then(
        async ({ getVideoProcessedEmail }) => {
          const emailHtml = getVideoProcessedEmail(
            user.user_metadata.full_name || "Usuário",
            title,
            process.env.NEXT_PUBLIC_APP_URL + "/dashboard",
          );
          await sendEmail({
            to: user.email!,
            subject: "Seu vídeo foi processado! ✂️",
            html: emailHtml,
          });
        },
      );
    })
    .catch((err) => console.error("Failed to send simulation email", err));

  revalidatePath("/dashboard");
  return { success: true, data };
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

  const workspaceIds = workspaces.map((w) => w.id);

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
    videos?.map((v) => ({
      id: v.id,
      nome: v.title,
      status: v.status === "completed" ? "concluido" : "aguardando", // Map DB status to UI status
      data: new Date(v.created_at).toLocaleDateString("pt-BR"),
      cortesCount: v.cortes?.[0]?.count || 0, // Approximate join count
    })) || []
  );
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
