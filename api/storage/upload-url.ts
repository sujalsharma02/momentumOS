import { randomUUID } from "node:crypto";
import { readSession } from "../../api-lib/auth";
import { createPresignedUrl } from "../../api-lib/s3";
export default async function handler(req: any,res: any) {
  res.setHeader("Cache-Control","no-store");
  if (req.method!=="POST") { res.setHeader("Allow","POST"); return res.status(405).json({error:"Method not allowed."}); }
  const username=readSession(req);
  if (!username) return res.status(401).json({error:"Sign in before accessing files."});
  const {fileName,contentType,action,key:requestedKey}=req.body??{};
  if (typeof fileName!=="string" || fileName.length>180 || typeof contentType!=="string") return res.status(400).json({error:"A valid fileName and contentType are required."});
  if (!["put","get"].includes(action)) return res.status(400).json({error:"action must be put or get."});
  if (action==="put" && !/^(image\/(png|jpeg|webp|gif)|application\/pdf|text\/plain|application\/json)$/.test(contentType)) return res.status(415).json({error:"Unsupported file type."});
  const safeName=fileName.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100)||"file";
  const objectKey=action==="get"
    ? (typeof requestedKey==="string" && requestedKey.startsWith(username+"/") ? requestedKey : "")
    : `${username}/${new Date().toISOString().slice(0,10)}/${randomUUID()}-${safeName}`;
  if (!objectKey) return res.status(403).json({error:"You cannot access that object."});
  try {
    const method=action==="put"?"PUT":"GET";
    const url=await createPresignedUrl({key:objectKey,method});
    return res.status(200).json({url,key:objectKey,method,expiresIn:300});
  } catch(error) {
    console.error("Object storage signing failed:",error);
    return res.status(500).json({error:"Could not create a signed URL. Check the S3-compatible storage environment variables."});
  }
}
