import { z } from "zod";

export interface WriteValidationFailure {
  ok: false;
  kind: "validation";
  errors: Record<string, string[]>;
}

export interface WriteValidationSuccess<T, TPrincipal> {
  ok: true;
  value: T;
  principal: TPrincipal;
}

export type ValidatedWriteResult<T, TPrincipal> =
  | WriteValidationSuccess<T, TPrincipal>
  | WriteValidationFailure;

export interface AdminWritePrincipal {
  userId: string;
}

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    (fields[field] ??= []).push(issue.message);
  }
  return fields;
}

export async function prepareValidatedWrite<
  TSchema extends z.ZodTypeAny,
  TPrincipal,
>(options: {
  parse: () => unknown;
  schema: TSchema;
  authorize: () => Promise<TPrincipal>;
}): Promise<ValidatedWriteResult<z.infer<TSchema>, TPrincipal>> {
  const parsed = options.schema.safeParse(options.parse());
  if (!parsed.success) {
    return { ok: false, kind: "validation", errors: zodFieldErrors(parsed.error) };
  }

  const principal = await options.authorize();
  return { ok: true, value: parsed.data, principal };
}
