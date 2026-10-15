import { useEffect } from "react";
import { listKeys, readRaw, writeRaw, STORAGE_KEYS } from "@/lib/storage";
const SYNC_KEYS=new Set([
  STORAGE_KEYS.dayLogs,STORAGE_KEYS.applications,STORAGE_KEYS.notes,STORAGE_KEYS.prepNotes,
  STORAGE_KEYS.prepProgress,STORAGE_KEYS.projects,STORAGE_KEYS.engineeringLog,STORAGE_KEYS.roadmap,
  STORAGE_KEYS.planBlocks,STORAGE_KEYS.goals,STORAGE_KEYS.focusSessions,STORAGE_KEYS.reasons,
  STORAGE_KEYS.celebratedOn,STORAGE_KEYS.settings,"skillBuildRoadmaps","skillStudyTimer",
]);
const BOOTSTRAP_FLAG="momentum-os:cloud-bootstrap-done";
async function requestData(method:"GET"|"PUT",body?:{key:string;value:unknown}) {
  const response=await fetch("/api/data",{method,headers:body?{"content-type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});
  if(!response.ok) throw new Error(response.status===401?"Cloud session expired.":"Cloud sync request failed.");
  return response.json();
}
export function CloudSync() {
  useEffect(()=>{
    let stopped=false,busy=false,snapshot="";
    const readLocal=()=>Object.fromEntries(listKeys().filter(key=>SYNC_KEYS.has(key)).map(key=>[key,readRaw(key)]));
    const serialise=(value:unknown)=>JSON.stringify(value);
    const bootstrap=async()=>{
      try {
        const response=await requestData("GET") as {data:Record<string,unknown>};
        if(stopped)return;
        const remote=response.data??{},hasRemote=Object.keys(remote).length>0;
        const bootstrapped=window.sessionStorage.getItem(BOOTSTRAP_FLAG)==="1";
        if(hasRemote&&!bootstrapped) {
          for(const [key,value] of Object.entries(remote)) if(SYNC_KEYS.has(key)) writeRaw(key,value);
          window.sessionStorage.setItem(BOOTSTRAP_FLAG,"1");
          window.location.reload();
          return;
        }
        const local=readLocal();
        if(!hasRemote) for(const [key,value] of Object.entries(local)) await requestData("PUT",{key,value});
        snapshot=serialise(readLocal());
        window.sessionStorage.setItem(BOOTSTRAP_FLAG,"1");
      } catch(error) { console.error("Momentum OS cloud sync did not start:",error); }
    };
    void bootstrap();
    const interval=window.setInterval(async()=>{
      if(stopped||busy||!snapshot)return;
      const local=readLocal(),nextSnapshot=serialise(local);
      if(nextSnapshot===snapshot)return;
      busy=true;
      try {
        const previous=JSON.parse(snapshot) as Record<string,unknown>;
        for(const [key,value] of Object.entries(local)) if(serialise(previous[key])!==serialise(value)) await requestData("PUT",{key,value});
        snapshot=nextSnapshot;
      } catch(error) { console.error("Momentum OS cloud sync failed:",error); }
      finally { busy=false; }
    },2000);
    return ()=>{stopped=true;window.clearInterval(interval);};
  },[]);
  return null;
}
