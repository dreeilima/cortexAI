import { Suspense } from "react";
import { getCutsForVideo } from "@/app/dashboard/actions";
import { CortesList, CortesListSkeleton } from "./cortes-list";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function CortesContent({ videoId }: { videoId: string }) {
  const cortes = await getCutsForVideo(videoId);

  return <CortesList cortes={cortes} />;
}

export default async function CortesPage(props: PageProps) {
  const params = await props.params;

  return (
    <div className="mx-auto max-w-6xl">
      <Suspense fallback={<CortesListSkeleton />}>
        <CortesContent videoId={params.id} />
      </Suspense>
    </div>
  );
}
