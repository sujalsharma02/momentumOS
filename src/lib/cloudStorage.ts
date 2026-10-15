/** Upload a supported file to the private Neon Object Storage bucket. */
export async function uploadMomentumFile(file: File): Promise<{ key: string }> {
  const contentType=file.type||"application/octet-stream";
  const ticketResponse=await fetch("/api/storage/upload-url",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({fileName:file.name,contentType,action:"put"})});
  const ticket=await ticketResponse.json().catch(()=>({}));
  if(!ticketResponse.ok) throw new Error(ticket.error??"Could not prepare the upload.");
  const uploadResponse=await fetch(ticket.url,{method:"PUT",headers:{"content-type":contentType},body:file});
  if(!uploadResponse.ok) throw new Error("Object storage rejected the upload.");
  return {key:ticket.key};
}
export async function getMomentumFileUrl(key: string): Promise<string> {
  const response=await fetch("/api/storage/upload-url",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({fileName:key.split("/").pop()??"file",contentType:"application/octet-stream",action:"get",key})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(result.error??"Could not create a download link.");
  return result.url as string;
}
