import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, serverTimestamp, Timestamp, type Firestore } from 'firebase/firestore';
import type { GameAction } from '../../src/game/engine';
import { transactRoomAction } from '../../src/firebase/roomTransactions';
import type { RoomState } from '../../src/types/game';
import { room, player } from '../fixtures';
let env: RulesTestEnvironment;
before(async()=>{ env=await initializeTestEnvironment({projectId:'demo-cnxh',firestore:{rules:readFileSync('firestore.rules','utf8')}}); });
beforeEach(async()=>{ await env.clearFirestore(); });
after(async()=>{ await env?.cleanup(); });
const ref = (_uid: string) => doc(env.unauthenticatedContext().firestore(),'rooms','TEST1');
async function seed(state: RoomState) {
  const data={...state,createdAt:Timestamp.fromMillis(1),updatedAt:Timestamp.fromMillis(1)};
  await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),'rooms','TEST1'),data);});
}
async function read(uid='host') { return (await getDoc(ref(uid))).data() as RoomState; }
async function action(uid: string, action: GameAction) {
  const db=env.unauthenticatedContext().firestore();
  return transactRoomAction(db as unknown as Firestore, 'TEST1', uid, action);
}
async function must(uid: string, command: GameAction) {
  const result=await assertSucceeds(action(uid,command)).catch(error=>{ throw new Error(`${uid}: ${command.type}: ${error.message}`); });
  assert.equal(result.success,true,result.message);
  return read();
}
async function startQuestion() {
  await seed(room());
  let state=await must('a',{type:'roll',turnId:'turn-1'});
  return must('host',{type:'open',turnId:state.turnId});
}
async function answer(uid:string, text?:string) {
  const state=await read();
  return must(uid,{type:'answer',turnId:state.turnId,phase:state.currentQuestion!.phase,answer:text??state.currentQuestion!.officialAnswer});
}
async function close() {
  const state=await read();
  return must('host',{type:'close',turnId:state.turnId,phase:state.currentQuestion!.phase});
}

test('guest creation, exact lookup, and all seven slots work; listing is denied',async()=>{
  await assertSucceeds(setDoc(ref('host'),{...room({status:'lobby',players:[]}),createdAt:serverTimestamp(),updatedAt:serverTimestamp(),lastAction:{type:'create',actorId:'host'}}));
  await assertSucceeds(getDoc(ref('invitee')));
  await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(),'rooms','TEST1')));
  await assertFails(getDocs(collection(env.authenticatedContext('a').firestore(),'rooms')));
  await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(),'rooms')));
  for(let i=0;i<7;i++) await must(`p${i}`,{type:'join',name:`P${i}`});
  assert.equal((await action('p7',{type:'join',name:'8th'})).success,false);
  const state=await read();
  await assertFails(updateDoc(ref('p7'),{players:[...state.players,player('p7')],updatedAt:serverTimestamp(),lastAction:{type:'join',actorId:'p7'}}));
});
test('room transitions cannot forge the host, another player, or a winner; room deletion is denied',async()=>{
  await seed(room());
  for(const uid of ['outsider','a']) {
    await assertFails(updateDoc(ref(uid),{winner:{id:uid},status:'finished',updatedAt:serverTimestamp(),lastAction:{type:'close',actorId:uid}}));
    await assertFails(deleteDoc(ref(uid)));
  }
  await assertFails(updateDoc(ref('a'),{hostId:'a',updatedAt:serverTimestamp(),lastAction:{type:'join',actorId:'a'}}));
  await assertFails(deleteDoc(ref('host')));
});
test('simultaneous readiness and joins survive transaction retries; all seven players can start/restart',async()=>{
  await seed(room({status:'lobby'}));
  const concurrent = await Promise.allSettled([must('a',{type:'ready',ready:true}),must('b',{type:'ready',ready:true}),must('d',{type:'join',name:'D'})]);
  for (const outcome of concurrent) if (outcome.status === 'rejected') throw outcome.reason;
  let state=await read();
  assert.equal(state.players.find(p=>p.id==='a')!.isReady,true);
  assert.equal(state.players.find(p=>p.id==='b')!.isReady,true);
  assert(state.players.some(p=>p.id==='d'));
  for(const id of ['e','f','g']) await must(id,{type:'join',name:id});
  state=await must('host',{type:'start'});
  assert.equal(state.players.length,7);
  assert.equal(state.status,'playing');
  await seed({...state,status:'finished',winner:{id:'a',name:'a'}});
  state=await must('host',{type:'restart'});
  assert.equal(state.winner,null);
});
test('normal answer, hint, bonus roll and two concurrent finish requests advance once',async()=>{
  let state=await startQuestion();
  state=await must('a',{type:'hint',turnId:state.turnId});
  assert.equal(state.players[0].hintsRemaining,1);
  state=await answer('a');
  state=await close();
  assert.equal(state.status,'bonus_roll');
  state=await must('a',{type:'roll',turnId:state.turnId});
  const turnId=state.turnId;
  const outcomes=await Promise.all([action('host',{type:'finish_bonus',turnId}),action('a',{type:'finish_bonus',turnId})]);
  assert.equal(outcomes.filter(r=>r.success).length,1);
  state=await read();
  assert.equal(state.currentPlayerIndex,1);
});
test('steal, incorrect response and main/stealer timeouts are permitted to all members at the correct deadline',async()=>{
  let state=await startQuestion();
  state=await answer('a','zzz');
  state=await must('b',{type:'buzz',turnId:state.turnId});
  state=await answer('b');
  state=await close();
  assert.equal(state.currentPlayerIndex,1);
  state=await startQuestion();
  await seed({...state,currentQuestion:{...state.currentQuestion!,questionStartTime:Date.now()-61_000}});
  state=await must('c',{type:'timeout',turnId:state.turnId,phase:'active_answering'});
  state=await must('b',{type:'buzz',turnId:state.turnId});
  await seed({...state,currentQuestion:{...state.currentQuestion!,stealStartTime:Date.now()-31_000}});
  state=await must('a',{type:'timeout',turnId:state.turnId,phase:'stealer_answering'});
  assert.equal(state.currentQuestion!.result,'incorrect');
  await close();
});
test('stale-phase close, another sender and premature timeout writes fail even if the client reducer is bypassed',async()=>{
  let state=await startQuestion();
  await assertFails(updateDoc(ref('c'),{'currentQuestion.phase':'stealing_open','currentQuestion.phaseStartedAt':Date.now(),'currentQuestion.stealStartTime':Date.now(),updatedAt:serverTimestamp(),lastAction:{type:'timeout',actorId:'c'}}));
  state=await answer('a','zzz');
  state=await must('b',{type:'buzz',turnId:state.turnId});
  await assertFails(updateDoc(ref('a'),{'currentQuestion.phase':'showing_result','currentQuestion.result':'correct','currentQuestion.resultWinnerId':'a','currentQuestion.phaseStartedAt':Date.now(),updatedAt:serverTimestamp(),lastAction:{type:'answer',actorId:'a'}}));
  await assertFails(updateDoc(ref('host'),{status:'playing',currentQuestion:null,diceValue:null,targetPosition:null,currentPlayerIndex:1,turnId:'forged',updatedAt:serverTimestamp(),lastAction:{type:'close',actorId:'host'}}));
});
test('leaving before active player, during bonus and as stealer retains a playable room',async()=>{
  await seed(room({currentPlayerIndex:1}));
  let state=await must('a',{type:'leave'});
  assert.equal(state.players[state.currentPlayerIndex].id,'b');
  await seed(room({status:'bonus_roll',isBonusRoll:true,bonusPlayerId:'a'}));
  state=await must('a',{type:'leave'});
  assert.equal(state.status,'playing');
  state=await startQuestion();
  state=await answer('a','zzz');
  state=await must('b',{type:'buzz',turnId:state.turnId});
  state=await must('b',{type:'leave'});
  assert.equal(state.currentQuestion!.result,'incorrect');
  await close();
  await seed(room({players:[player('a')]}));
  state=await must('a',{type:'leave'});
  assert.equal(state.status,'lobby');
});
test('normal and stolen answers plus bonus rolls can finish a lap with the correct winner only',async()=>{
  for(const mode of ['normal','steal','bonus']) {
    await seed(room({players:[player('a',24),player('b',24)]}));
    let state=await read();
    if(mode==='bonus') {
      await seed({...state,status:'bonus_roll',isBonusRoll:true,bonusPlayerId:'a'});
      state=await must('a',{type:'roll',turnId:state.turnId});
    } else {
      state=await must('a',{type:'roll',turnId:state.turnId});
      state=await must('a',{type:'open',turnId:state.turnId});
      if(mode==='steal') { state=await answer('a','zzz'); state=await must('b',{type:'buzz',turnId:state.turnId}); }
      await answer(mode==='steal'?'b':'a');
      state=await close();
    }
    assert.equal(state.status,'finished');
    assert.equal(state.winner!.id,mode==='steal'?'b':'a');
  }
});
test('unused buzz window can expire; host can recover an abandoned roll',async()=>{
  let state=await startQuestion();
  state=await answer('a','zzz');
  await seed({...state,currentQuestion:{...state.currentQuestion!,stealStartTime:Date.now()-13_000}});
  state=await must('c',{type:'close',turnId:state.turnId,phase:'stealing_open'});
  state=await must('host',{type:'skip',turnId:state.turnId});
  assert.equal(state.currentPlayerIndex,2);
});

test('all seven players can ready, move, use hints, answer, and restart with validated reset values',async()=>{
  await seed(room({status:'lobby',players:['a','b','c','d','e','f','g'].map(id=>player(id))}));
  for(const id of ['a','b','c','d','e','f','g']) await must(id,{type:'ready',ready:true});
  let state=await must('host',{type:'start'});
  for(const id of ['a','b','c','d','e','f','g']) {
    state=await read();
    assert.equal(state.players[state.currentPlayerIndex].id,id);
    state=await must(id,{type:'roll',turnId:state.turnId});
    state=await must(id,{type:'open',turnId:state.turnId});
    state=await must(id,{type:'hint',turnId:state.turnId});
    await answer(id);
    state=await close();
    state=await must(id,{type:'roll',turnId:state.turnId});
    state=await must('host',{type:'finish_bonus',turnId:state.turnId});
  }
  await seed({...state,status:'finished',winner:{id:'a',name:'a'}});
  state=await must('host',{type:'restart'});
  for(const p of state.players) { assert.equal(p.position,1); assert.equal(p.hintsRemaining,2); }
});
test('UID mapping, uniqueness, readiness types, positions and hint bounds stay protected',async()=>{
  await seed(room({status:'lobby'}));
  const state=await read();
  const forged = [
    {players:state.players.map((p,i)=>i===0?{...p,position:24}:p),lastAction:{type:'ready',actorId:'a'}},
    {players:state.players.map((p,i)=>i===0?{...p,isReady:'yes'}:p),lastAction:{type:'ready',actorId:'a'}},
    {playerIds:['a','a','c'],lastAction:{type:'ready',actorId:'a'}},
    {playerIds:['a','c','b'],lastAction:{type:'ready',actorId:'a'}},
    {players:state.players.map((p,i)=>i===1?{...p,isReady:true}:p),lastAction:{type:'ready',actorId:'a'}},
  ];
  for(const patch of forged) await assertFails(updateDoc(ref('a'),{...patch,updatedAt:serverTimestamp()}));
  for(const bad of [{position:0},{position:25},{hintsRemaining:3},{id:'a'},{name:''},{isReady:'yes'}]) {
    const p={...player('outsider'),...bad};
    await assertFails(updateDoc(ref('outsider'),{players:[...state.players,p],playerIds:[...state.playerIds,p.id],lastAction:{type:'join',actorId:'outsider'},updatedAt:serverTimestamp()}));
  }
});
