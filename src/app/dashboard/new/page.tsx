import { NewTenantForm } from "./NewTenantForm";

export const dynamic = "force-dynamic";

export default function NewTenantPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Create tenant</h1>
      <NewTenantForm />
    </div>
  );
}
