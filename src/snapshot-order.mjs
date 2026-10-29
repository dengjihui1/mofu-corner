// IPC updates and invoke replies can arrive through different queues.
export function createSnapshotGate(){
  let latest=0;
  return value=>{
    if(!value)return false;
    if(!Number.isSafeInteger(value.sequence))return true; // Browser-only preview.
    if(value.sequence<=latest)return false;
    latest=value.sequence;return true;
  };
}
