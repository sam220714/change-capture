import { Suspense } from "react";
import { RecordView } from "./view";

export default function Page({ params }: PageProps<"/app/changes/[id]">) {
  return (
    <Suspense fallback={null}>
      <Resolved params={params} />
    </Suspense>
  );
}

async function Resolved({ params }: { params: PageProps<"/app/changes/[id]">["params"] }) {
  const { id } = await params;
  return <RecordView id={id} />;
}
