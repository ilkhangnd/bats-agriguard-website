import { redirect } from "next/navigation";

// Legacy route: the Operations Console is the only admin workspace.
export default function AdminRedirect() {
  redirect("/app/dashboard");
}
