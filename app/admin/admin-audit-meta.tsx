import { adminTimestamp } from "./admin-list-view";

export function AdminAuditMeta({ createdAt, updatedAt, updatedBy }: {
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}) {
  return (
    <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
      <div><dt className="inline font-medium text-zinc-300">Created:</dt> <dd className="inline">{adminTimestamp(createdAt)}</dd></div>
      <div><dt className="inline font-medium text-zinc-300">Updated:</dt> <dd className="inline">{adminTimestamp(updatedAt)}</dd></div>
      <div><dt className="inline font-medium text-zinc-300">Updated by:</dt> <dd className="inline">{updatedBy ?? "Unknown"}</dd></div>
    </dl>
  );
}
