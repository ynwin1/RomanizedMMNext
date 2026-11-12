import { requireAdmin } from "@/infrastructure/auth";
import { songRequestService, SongRequestIdSchema } from "@/modules/requests";
import SongForm from "../song-form";

export default async function NewSongPage({searchParams}:{
  searchParams:Promise<{requestId?:string}>;
}) {
  await requireAdmin();
  const {requestId}=await searchParams;
  const requests=await songRequestService.listAcceptedForFulfillment();
  const selected=requestId&&SongRequestIdSchema.safeParse(requestId).success
    ? requests.find(item=>item.id===requestId):undefined;
  return <section><h1 className="text-3xl font-bold">Create song</h1>
    <SongForm acceptedRequests={requests} initialRequestId={selected?.id}/>
  </section>;
}
