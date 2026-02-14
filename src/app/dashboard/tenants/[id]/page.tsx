import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/db";
import { EditTenantForm } from "./edit-tenant-form";

export const dynamic = "force-dynamic";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantById(id);
  if (!tenant) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Edit tenant</h1>
      <p className="text-zinc-400 text-sm mb-6">
        ID: {id}
      </p>
      <EditTenantForm tenant={tenant} tenantId={id} />
    </div>
  );
}
