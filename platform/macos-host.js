/* macOS JXA /usr/bin/osascript. Geometry only: no window names, screenshots,
   System Events, Accessibility APIs, account tokens or chat contents. */
ObjC.import('AppKit');
ObjC.import('CoreGraphics');
function text(value){return value?String(ObjC.unwrap(value)):'';}
function emit(value){var line=$(JSON.stringify(value)+'\n').dataUsingEncoding($.NSUTF8StringEncoding);$.NSFileHandle.fileHandleWithStandardOutput.writeData(line);}
function probe(companionPid){
 var workspace=$.NSWorkspace.sharedWorkspace,apps=workspace.runningApplications,clients=[];
 var front=workspace.frontmostApplication,frontPid=front?Number(front.processIdentifier):0;
 for(var i=0;i<Number(apps.count);i++){
  var app=apps.objectAtIndex(i),id=text(app.bundleIdentifier).toLowerCase(),name=text(app.localizedName).toLowerCase();
  var brand=name==='飞书'||name==='feishu'||/(^|\.)feishu$/.test(id)?'feishu':name==='lark'||/(^|\.)lark$/.test(id)?'lark':null;
  if(brand)clients.push({pid:Number(app.processIdentifier),brand:brand,hidden:Boolean(app.hidden)});
 }
 if(!clients.length)return {status:'missing'};
 var windows=ObjC.deepUnwrap($.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly,$.kCGNullWindowID))||[],candidates=[];
 for(var j=0;j<windows.length;j++){
  var w=windows[j],client=null;for(var k=0;k<clients.length;k++)if(clients[k].pid===Number(w.kCGWindowOwnerPID)){client=clients[k];break;}
  if(!client||Number(w.kCGWindowLayer)!==0)continue;
  var b=w.kCGWindowBounds;if(!b||Number(b.Width)<250||Number(b.Height)<160)continue;
  candidates.push({status:'ready',brand:client.brand,pid:client.pid,active:frontPid===client.pid||frontPid===companionPid,bounds:{x:Number(b.X),y:Number(b.Y),width:Number(b.Width),height:Number(b.Height)}});
 }
 candidates.sort(function(a,b){return Number(b.active)-Number(a.active)||b.bounds.width*b.bounds.height-a.bounds.width*a.bounds.height;});
 if(candidates.length)return candidates[0];
 // A running client with no on-screen main window stays hidden in the tray.
 return {status:'minimized',brand:clients[0].brand,pid:clients[0].pid,active:false,bounds:{x:0,y:0,width:1,height:1}};
}
function run(argv){
 if(argv.indexOf('--self-check')!==-1){var metadata=ObjC.deepUnwrap($.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly,$.kCGNullWindowID));if(!Array.isArray(metadata))throw Error('WINDOW_METADATA_UNAVAILABLE');emit({status:'ok',windowMetadataReadable:true});return;}
 var once=argv.indexOf('--once')!==-1,companionPid=Number(argv[0])||0;
 do{try{emit(probe(companionPid));}catch(error){if(once)throw error;emit({status:'error'});}if(!once)$.NSThread.sleepForTimeInterval(1);}while(!once);
}
