import { redirect } from "next/navigation";

export default function LegacyLyricsMigrationPage() {
  redirect("/admin/lyrics-health");
}
