const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('mofuPostoffice',{
 config:()=>ipcRenderer.invoke('mofu:postoffice-config'),
 connect:url=>ipcRenderer.invoke('mofu:postoffice-connect',url),
 configure:()=>ipcRenderer.invoke('mofu:postoffice-configure'),
 notify:data=>ipcRenderer.send('mofu:postoffice-notify',data),
});
