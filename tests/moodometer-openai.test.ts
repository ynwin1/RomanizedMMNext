import test from "node:test";
import assert from "node:assert/strict";
import {createMoodometerOpenAIGenerator} from "@/modules/songs/infrastructure/moodometer.openai";

test("provider uses structured JSON, private credentials, and disables response storage",async()=>{
 let request: RequestInit | undefined;
 const generator = createMoodometerOpenAIGenerator({
   apiKey:"test-secret",
   fetcher: async (_url, init) => {
     request = init;
     return new Response(JSON.stringify({
       status:"completed", output:[{type:"message",content:[{type:"output_text",text:JSON.stringify({
         moods:[{moodId:"romantic",score:9.1},{moodId:"longing",score:7.5},{moodId:"hopeful",score:4.2}],
         summary:"Affection and anticipation.",
       })}]}],
     }),{status:200});
   },
 });
 const result = await generator("Test lyrical analysis");
 assert.equal((result as {summary:string}).summary,"Affection and anticipation.");
 const body = JSON.parse(request?.body as string);
 assert.equal(body.store,false);
 assert.equal(body.text.format.type,"json_schema");
 assert.equal(body.text.format.strict,true);
 assert.equal(body.model,"gpt-5");
 assert.equal(body.reasoning.effort,"minimal");
 assert.equal(body.max_output_tokens,1400);
 assert.equal((request?.headers as Record<string,string>).Authorization,"Bearer test-secret");
 assert.doesNotMatch(JSON.stringify(body),/test-secret/);
});

test("provider fails closed for no key, response failure, malformed or incomplete results", async()=>{
 assert.throws(()=>createMoodometerOpenAIGenerator({apiKey:" "}),/OPENAI_API_KEY/);
 for(const response of [
   new Response("Unavailable",{status:503}),
   new Response(JSON.stringify({status:"incomplete",output:[]}),{status:200}),
   new Response(JSON.stringify({status:"completed",output:[]}),{status:200}),
 ]) {
   const generator = createMoodometerOpenAIGenerator({apiKey:"secret",fetcher:async()=>response});
   await assert.rejects(()=>generator("analyze"));
 }
});

test("API errors include a safe provider error code without leaking response text",async()=>{
 const generator = createMoodometerOpenAIGenerator({apiKey:"secret",fetcher:async()=>new Response(JSON.stringify({
  error:{code:"model_not_found",message:"Do not expose internal credentials"}
 }),{status:403})});
 await assert.rejects(()=>generator("analyze"),error=>{
  assert.match(String(error),/HTTP 403, model_not_found/);
  assert.doesNotMatch(String(error),/internal credentials/);
  return true;
 });
});
