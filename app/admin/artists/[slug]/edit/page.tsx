import { notFound } from "next/navigation";
import { requireAdmin } from "@/infrastructure/auth";
import { artistService, ArtistSlugSchema } from "@/modules/artists";
import { NotFoundError } from "@/shared/errors/not-found.error";
import ArtistForm from "../../artist-form";
import { AdminAuditMeta } from "../../../admin-audit-meta";

export default async function EditArtistPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const parsed = ArtistSlugSchema.safeParse(slug);
  if (!parsed.success) notFound();

  const artist = await artistService.getArtistForEdit(parsed.data).catch(error => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const { saved } = await searchParams;

  return <section>
    <h1 className="text-3xl font-bold">Edit artist</h1>
    {saved === "1" && <p role="status" className="mt-4 text-emerald-300">Artist saved successfully.</p>}
    <AdminAuditMeta createdAt={artist.createdAt} updatedAt={artist.updatedAt} updatedBy={artist.updatedBy} />
    <ArtistForm key={artist.slug + ":" + artist.revision} artist={artist} />
  </section>;
}
