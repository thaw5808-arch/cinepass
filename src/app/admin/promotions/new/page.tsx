import { PromotionForm } from "../promotion-form";

// No independent ADMIN check here — this page fetches no data of its own
// (the form starts blank), and createPromotionAction() checks ADMIN
// independently before writing anything. See admin/promotions/page.tsx and
// .../[id]/edit/page.tsx for pages that *do* need the check, because they
// run a real query on render.
export default function NewPromotionPage() {
  return (
    <div className="p-6">
      <h1 className="font-display text-3xl tracking-wide mb-6">Add Promotion</h1>
      <PromotionForm mode="create" />
    </div>
  );
}
