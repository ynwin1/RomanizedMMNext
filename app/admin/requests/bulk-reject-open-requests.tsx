"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {bulkRejectOpenRequestsAction} from "./request-actions";

export default function BulkRejectOpenRequests({count, cutoff}: {count:number;cutoff:string}) {
  const router=useRouter();
  const [expanded,setExpanded]=useState(false);
  const [confirmation,setConfirmation]=useState("");
  const [pending,setPending]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  async function reject() {
    if(pending || confirmation!=="REJECT OPEN REQUESTS")return;
    setPending(true);setError("");setMessage("");
    try {
      const response=await bulkRejectOpenRequestsAction(cutoff,confirmation);
      if(!response.ok){setError(response.message);return;}
      setMessage(`Rejected ${response.modified} open request(s). Completed and accepted requests were preserved.`);
      setExpanded(false);setConfirmation("");
      router.refresh();
    }catch{setError("Unable to reset requests. Try again.");}
    finally{setPending(false);}
  }
  return <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="font-semibold">Start a fresh request queue</h2>
        <p className="mt-1 text-sm text-zinc-400">{count} pending or reviewing request(s).
          This marks existing open requests as rejected without deleting their history.
          Accepted, completed, and previously rejected requests remain unchanged.</p>
      </div>
      {!expanded && <button type="button" disabled={!count} onClick={()=>setExpanded(true)}
        className="rounded border border-rose-600 px-4 py-2 text-sm text-rose-200 disabled:opacity-50">Reject all open requests</button>}
    </div>
    {expanded && <div className="mt-4 max-w-xl space-y-3 border-t border-zinc-700 pt-4">
      <p className="text-sm text-rose-200">This is a bulk update. Type <strong>REJECT OPEN REQUESTS</strong> to confirm. Requests submitted after you loaded this page are excluded.</p>
      <label className="block text-sm">Confirmation
        <input value={confirmation} onChange={event=>setConfirmation(event.target.value)}
          autoComplete="off" className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 p-3 text-white"/>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending || confirmation!=="REJECT OPEN REQUESTS"}
          onClick={reject} className="rounded bg-rose-800 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {pending?"Rejecting…":"Confirm bulk rejection"}
        </button>
        <button type="button" disabled={pending} onClick={()=>{setExpanded(false);setConfirmation("");}}
          className="rounded border border-zinc-600 px-4 py-2 text-white">Cancel</button>
      </div>
    </div>}
    {message && <p role="status" className="mt-3 text-sm text-emerald-300">{message}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
  </section>;
}
