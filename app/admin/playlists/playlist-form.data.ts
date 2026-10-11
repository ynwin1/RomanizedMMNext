export interface PlaylistFormState {
  message?: string;
  errors?: Record<string, string[]>;
}

export function playlistFormInput(form: FormData) {
  const optional = (field: string) => {
    const value = form.get(field);
    return typeof value === "string" && value.trim() ? value : undefined;
  };
  return {
    platform: "spotify",
    url: form.get("url"),
    title: form.get("title"),
    description: optional("description"),
    imageUrl: optional("imageUrl"),
    curator: optional("curator"),
    genres: form.getAll("genres"),
    sortOrder: Number(form.get("sortOrder")),
  };
}
