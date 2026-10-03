import { z } from "zod";

export interface WriteValidationFailure {
  ok: false;
  kind: "validation";
  errors: Record<string, string[]>;
}

export interface WriteValidationSuccess<T> {
  ok: true;
  value: T;
}

export type ValidatedWriteResult<T> = WriteValidationSuccess<T> | WriteValidationFailure;

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    (fields[field] ??= []).push(issue.message);
  }
  return fields;
}

export async function prepareValidatedWrite<TSchema extends z.ZodTypeAny>(options: {
  parse: () => unknown;
  schema: TSchema;
  authorize: () => Promise<unknown>;
}): Promise<ValidatedWriteResult<z.infer<TSchema>>> {
  const parsed = options.schema.safeParse(options.parse());
  if (!parsed.success) {
    return { ok: false, kind: "validation", errors: zodFieldErrors(parsed.error) };
  }

  await options.authorize();
  return { ok: true, value: parsed.data };
}
