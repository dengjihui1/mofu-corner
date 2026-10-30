import {WEARABLES} from './wear-catalog.mjs';
import {avatar} from './postoffice-avatars.mjs';
import {accessoryBody,accessoryPlacements} from './pet-accessories.mjs';

export function wearArt(item){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
 svg.innerHTML=accessoryBody(item);return svg;
}
export function dressedAvatar(species,size,equipped={},catalog=WEARABLES){
 const pet=avatar(species,size),host=pet.querySelector('.avatar-crop')||pet;
 host.classList.add('is-dressed');
 for(const placement of accessoryPlacements(species,equipped)){
  const item=catalog.find(x=>x.id===placement.id);if(!item)continue;
  const {slot,x,y,width,height,rotation}=placement;
  const piece=document.createElement('span');piece.className='pet-wear wear-'+slot;
  piece.dataset.item=item.id;piece.title=item.name;
  Object.assign(piece.style,{left:(x+width/2)*100+'%',top:(y+height/2)*100+'%',width:width*100+'%',height:height*100+'%',transform:`translate(-50%,-50%) rotate(${rotation}deg)`});
  piece.append(wearArt(item));host.append(piece);
 }
 return pet;
}
