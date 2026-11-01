// Usage: node scripts/evaluate-moodometer.mjs path/to/editor-reviewed-cases.json
// This analyzes saved evaluation data offline; it never calls AI or modifies MongoDB.
const fs=require("node:fs");
const path=require("node:path");
require("../test-register.cjs");
const {evaluateMoodometer}=require("../.test-dist/modules/songs/application/moodometer.evaluation.js");
const file=process.argv[2];
if(!file){console.error("Usage: npm run evaluate:moodometer -- path/to/cases.json");process.exit(1);}
try{
 const cases=JSON.parse(fs.readFileSync(path.resolve(file),"utf8"));
 const result=evaluateMoodometer(cases);
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
