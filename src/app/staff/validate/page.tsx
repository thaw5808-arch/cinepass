import { TicketValidator } from "./ticket-validator";

// Auth/role gating now happens once in src/app/staff/layout.tsx for
// everything under /staff — no need to re-check getCurrentUser() here.
export default function StaffValidatePage() {
  return <TicketValidator />;
}
