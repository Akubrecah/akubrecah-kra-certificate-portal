import { redirect } from "next/navigation";

export default function LegacyCvBuilderRedirect() {
  redirect("/dashboard?notice=cv_builder_decommissioned");
}
