import { Suspense } from "react";
import { ContractView } from "./view";

export default function Page({ params }: PageProps<"/app/contracts/[id]">) {
  return (
    <Suspense fallback={null}>
      <Resolved params={params} />
    </Suspense>
  );
}

async function Resolved({ params }: { params: PageProps<"/app/contracts/[id]">["params"] }) {
  const { id } = await params;
  return <ContractView id={id} />;
}
