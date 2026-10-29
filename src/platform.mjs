import {win32,posix} from 'node:path';
export function capabilities(platform=process.platform){return {platform,desktop:['win32','darwin'].includes(platform),windowFollowing:platform==='win32'?'available':platform==='darwin'?'experimental':'unavailable',clickThrough:platform==='darwin'?'pointer-regions':'native-shape',coordinates:platform==='win32'?'physical':'dip'};}
export function npmCandidates({platform=process.platform,execPath=process.execPath,path=process.env.PATH||'',npmExecPath=process.env.npm_execpath}={}){
 const p=platform==='win32'?win32:posix,dirs=[p.dirname(execPath),...path.split(platform==='win32'?';':':').filter(Boolean).map(d=>d.replace(/^"|"$/g,''))];
 return [...new Set([npmExecPath,...dirs.flatMap(d=>[p.join(d,'node_modules/npm/bin/npm-cli.js'),p.resolve(d,'../lib/node_modules/npm/bin/npm-cli.js')])].filter(Boolean))];
}
export function interactivePoint(point,bounds,rectangles){const x=point.x-bounds.x,y=point.y-bounds.y;return rectangles.some(r=>x>=r.x&&y>=r.y&&x<r.x+r.width&&y<r.y+r.height);}
