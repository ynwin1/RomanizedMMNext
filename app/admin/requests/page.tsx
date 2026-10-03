import Link from "next/link";
import { adminReads } from "../admin.data";
import { parseAdminSearchParams, type AdminSearchParams } from "../admin-query";
import { AdminListView, EmptyAdminRow, adminDate } from "../admin-list-view";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const query = parseAdminSearchParams(await searchParams);
  const page = await adminReads.listRequests(query);
  return <AdminListView title="Requests" base="/admin/requests" query={query} page={page} requestStatus
    headers={["Song", "Artist", "Status", "Requested (UTC)", "Actions"]}
    rows={page.items.length ? page.items.map(request => <tr key={request.id}>
      <td className="p-4">{request.songName}</td><td className="p-4">{request.artist}</td>
      <td className="p-4">{request.status}</td><td className="p-4">{adminDate(request.createdAt)}</td>
      <td className="p-4"><Link className="underline" href={"/admin/requests/" + request.id}>Review<span className="sr-only"> {request.songName}</span></Link></td>
    </tr>) : <EmptyAdminRow columns={5} />} />;
}
