export interface ArtistFormState {
  message?: string;
  errors?: Record<string, string[]>;
}

const optionalFields = ["bannerLink", "biography", "biographyMy", "unknownFact"] as const;
const listFields = ["origin", "labels", "musicGenre", "songs"] as const;
const socialFields = ["facebook", "instagram", "youtube", "spotify", "appleMusic"] as const;

function optional(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function lines(value: FormDataEntryValue | null): string[] {
  return typeof value === "string"
    ? value.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
    : [];
}

export function artistFormInput(form: FormData, create: boolean): Record<string, unknown> {
  const input: Record<string, unknown> = {
    name: form.get("name"),
    imageLink: form.get("imageLink"),
    type: form.get("type"),
  };

  for (const field of optionalFields) input[field] = optional(form.get(field));
  for (const field of listFields) input[field] = lines(form.get(field));

  const membersValue = form.get("members");
  if (typeof membersValue === "string" && membersValue.trim()) {
    try { input.members = JSON.parse(membersValue); }
    catch { input.members = null; }
  } else {
    input.members = undefined;
  }

  const socials = Object.fromEntries(
    socialFields
      .map(field => [field, optional(form.get(field))] as const)
      .filter(([, value]) => value !== undefined),
  );
  input.socials = Object.keys(socials).length ? socials : undefined;

  if (create) input.slug = form.get("slug");
  return input;
}
