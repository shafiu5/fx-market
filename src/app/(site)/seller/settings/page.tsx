import { redirect } from "next/navigation";

export default function SellerSettingsPage() {
  redirect("/settings?tab=account");
}
