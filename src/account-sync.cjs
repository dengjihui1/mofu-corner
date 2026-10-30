// The bridge accepts only known wearable IDs, never markup, asset URLs or executable recipes.
const SPECIES = new Set(['rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig','otter']);
const WEARABLES = Object.freeze({headwear:new Set(['wear-bow','wear-daisy','wear-beret']),neckwear:new Set(['wear-bandana','wear-bowtie']),carry:new Set(['wear-satchel'])});
function accountIdentity(value){
 if(value===null)return null;
 if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(value.id)||!SPECIES.has(value.species))return undefined;
 if(!value.outfit||typeof value.outfit!=='object'||Array.isArray(value.outfit))return undefined;
 const outfit={};for(const [slot,id]of Object.entries(value.outfit)){if(!Object.hasOwn(WEARABLES,slot)||!WEARABLES[slot].has(id))return undefined;outfit[slot]=id;}
 return {id:value.id,species:value.species,outfit};
}
function acceptIdentity(current,incoming){
 const next=accountIdentity(incoming);if(next===undefined)return current;
 // A bound account cannot change its zodiac, even if a stale or compromised renderer asks.
 if(current&&next&&current.id===next.id&&current.species!==next.species)return current;
 return next;
}
function accountCharacter(character,account,createCharacter){
 if(!account||character.species===account.species)return character;
 return createCharacter({species:account.species,size:character.size,personality:character.personality});
}
function canSaveCharacter(character,account){return !account||character?.species===account.species;}
module.exports={accountIdentity,acceptIdentity,accountCharacter,canSaveCharacter};
