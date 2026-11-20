import { Suspense } from "react";
import { CaptureView } from "./view";

export default function Page({ params }: PageProps<"/app/capture/[threadId]">) {
  return (
    <Suspense fallback={null}>
      <Resolved params={params} />
    </Suspense>
  );
}

async function Resolved({ params }: { params: PageProps<"/app/capture/[threadId]">["params"] }) {
  const { threadId } = await params;
  return <CaptureView threadId={threadId} />;
}
