import type { SongService } from "@/modules/songs/application/song.service";
import { CreateSongSchema, UpdateSongCommandSchema } from "@/modules/songs/application/song.validation";
import { CanonicalLyricsRequiredError, DuplicateSongError, SongConflictError } from "@/modules/songs/application/song-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { prepareValidatedWrite, type AdminWritePrincipal } from "@/shared/write/validated-write";
import { songFormInput, type SongFormState } from "./song-form.data";
import {SongRequestIdSchema} from "@/modules/requests/application/song-request.validation";

export async function runOptionalMoodDraft(
  requested: boolean,
  songId: number,
  generate: ((id: number) => Promise<void>) | undefined,
  logFailure: (error: unknown) => void,
): Promise<"ready" | "failed" | undefined> {
  if (!requested || !generate) return undefined;
  try {
    await generate(songId);
    return "ready";
  } catch (error) {
    logFailure(error);
    return "failed";
  }
}

export function createSongActionHandler(dependencies: {
  authorize: () => Promise<AdminWritePrincipal>;
  songs: Pick<SongService, "createSong" | "updateSong">;
  saved: (id: number, moodStatus?: "ready" | "failed", fulfillmentFailed?:boolean) => never;
  afterCreate?: (id: number) => Promise<void>;
  verifyRequest?: (requestId:string)=>Promise<void>;
  fulfillRequest?: (requestId:string,mmid:number,actor:string)=>Promise<void>;
  logFailure: (error: unknown) => void;
}) {
  function failure(error: unknown): SongFormState {
    if (
      error instanceof CanonicalLyricsRequiredError
      || error instanceof DuplicateSongError
      || error instanceof SongConflictError
      || error instanceof NotFoundError
    ) return { message: error.message };
    dependencies.logFailure(error);
    return { message: "Unable to save the song. Please try again." };
  }

  return {
    async create(_previous: SongFormState, form: FormData): Promise<SongFormState> {
      const prepared = await prepareValidatedWrite({
        parse: () => songFormInput(form, true),
        schema: CreateSongSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Please correct the highlighted fields.", errors: prepared.errors };

      const selected=form.get("fulfillRequestId");
      const requestId=selected==null||selected===""?null:SongRequestIdSchema.safeParse(selected).data;
      if(selected&&(!requestId||form.get("isRequested")!=="on"))
        return {message:"Select a valid accepted request.",errors:{fulfillRequestId:["Invalid request selection."]}};
      if(requestId){
        if(!dependencies.verifyRequest||!dependencies.fulfillRequest)
          return {message:"Request fulfillment is not configured."};
        try { await dependencies.verifyRequest(requestId); }
        catch {return {message:"This request is no longer available. Reload and choose another.",errors:{fulfillRequestId:["Request unavailable."]}};}
      }
      let id: number;
      try {
        id = (await dependencies.songs.createSong(prepared.value, prepared.principal.userId)).mmid;
      } catch (error) {
        return failure(error);
      }
      // The song now exists. Do not retry creation if request fulfillment fails.
      let fulfillmentFailed=false;
      if(requestId){
        try {await dependencies.fulfillRequest!(requestId,id,prepared.principal.userId);}
        catch(error){dependencies.logFailure(error);fulfillmentFailed=true;}
      }
      const moodStatus = await runOptionalMoodDraft(form.get("generateMoodDraft") === "on", id, dependencies.afterCreate, dependencies.logFailure);
      return dependencies.saved(id,moodStatus,fulfillmentFailed);
    },

    async update(id: number, revision: number, _previous: SongFormState, form: FormData): Promise<SongFormState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ id, revision, input: songFormInput(form, false) }),
        schema: UpdateSongCommandSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Please correct the highlighted fields.", errors: prepared.errors };

      try {
        await dependencies.songs.updateSong(prepared.value.id, prepared.value.revision, prepared.value.input, prepared.principal.userId);
      } catch (error) {
        return failure(error);
      }
      return dependencies.saved(prepared.value.id);
    },
  };
}
