import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyGameAction, type GameAction } from '../src/game/engine';
import { isAnswerCorrect } from '../src/utils/answerChecker';
import { BOARD_SQUARES } from '../src/questions/boardData';
import { room, player } from './fixtures';
import type { RoomState } from '../src/types/game';

let sequence = 0;
const ctx = (now = 100_000, random = .45) => ({ now, random: () => random, newId: () => `new-turn-${++sequence}` });
function act(state: RoomState, actor: string, action: GameAction, now = 100_000) {
  const result = applyGameAction(state, actor, action, ctx(now));
  assert.equal(result.success, true, result.message);
  return result.room || state;
}
function questionRoom() {
  let state = act(room(), 'a', { type:'roll', turnId:'turn-1' });
  return act(state, 'a', { type:'open', turnId:'turn-1' });
}
function answer(state: RoomState, actor = 'a', text = state.currentQuestion!.officialAnswer, now = 100_000) {
  return act(state, actor, { type:'answer', turnId:state.turnId, phase:state.currentQuestion!.phase, answer:text }, now);
}
function close(state: RoomState, now = 100_000) {
  return act(state, 'host', { type:'close', turnId:state.turnId, phase:state.currentQuestion!.phase }, now);
}

test('exactly seven players can join; host cannot play; used colors are not reassigned', () => {
  let state = room({ status:'lobby', players:[] });
  for (let n = 0; n < 7; n++) state = act(state, `p${n}`, { type:'join', name:`P${n}` });
  assert.equal(state.players.length, 7);
  assert.equal(new Set(state.players.map(p => p.color)).size, 7);
  assert.equal(applyGameAction(state,'p7',{type:'join',name:'8th'},ctx()).success,false);
  assert.equal(applyGameAction(state,'host',{type:'join',name:'host'},ctx()).success,false);
  state = act(state,'p1',{type:'leave'});
  state = act(state,'p7',{type:'join',name:'new'});
  assert.equal(new Set(state.players.map(p => p.color)).size,7);
});
test('ready updates are independent, idempotent, and only legal in lobby', () => {
  let state = room({status:'lobby'});
  state = act(state,'a',{type:'ready',ready:true});
  state = act(state,'b',{type:'ready',ready:true});
  state = act(state,'a',{type:'ready',ready:true});
  assert.deepEqual(state.players.map(p => p.isReady),[true,true,false]);
  state = act(state,'host',{type:'start'});
  assert.equal(applyGameAction(state,'a',{type:'ready',ready:true},ctx()).success,false);
});
test('duplicate bonus completion and delayed commands cannot skip a player or erase the next question', () => {
  let state = close(answer(questionRoom()));
  state = act(state,'a',{type:'roll',turnId:'turn-1'});
  assert.equal(state.status,'moving');
  state = act(state,'host',{type:'finish_bonus',turnId:'turn-1'});
  assert.equal(state.players[state.currentPlayerIndex].id,'b');
  assert.equal(applyGameAction(state,'a',{type:'finish_bonus',turnId:'turn-1'},ctx()).success,false);
  state = act(state,'b',{type:'roll',turnId:state.turnId});
  assert.equal(applyGameAction(state,'c',{type:'close',turnId:'turn-1',phase:'showing_result'},ctx()).success,false);
  assert(state.currentQuestion);
});
test('late stealing-window closure cannot interrupt the accepted stealer', () => {
  let state = answer(questionRoom(),'a','zzz');
  state = act(state,'b',{type:'buzz',turnId:state.turnId},110_000);
  const result = applyGameAction(state,'host',{type:'close',turnId:state.turnId,phase:'stealing_open'},ctx(113_000));
  assert.equal(result.success,false);
  assert.equal(state.currentQuestion!.phase,'stealer_answering');
});
test('every remaining member can resolve main/stealer timeouts, but never early or for an old turn', () => {
  const source = questionRoom();
  assert.equal(applyGameAction(source,'b',{type:'timeout',turnId:source.turnId,phase:'active_answering'},ctx(159_999)).success,false);
  let state = act(source,'c',{type:'timeout',turnId:source.turnId,phase:'active_answering'},160_000);
  state = act(state,'b',{type:'buzz',turnId:state.turnId},161_000);
  state = act(state,'a',{type:'timeout',turnId:state.turnId,phase:'stealer_answering'},191_000);
  assert.equal(state.currentQuestion!.phase,'showing_result');
  assert.equal(state.currentQuestion!.result,'incorrect');
  assert.equal(applyGameAction(source,'outsider',{type:'timeout',turnId:source.turnId,phase:'active_answering'},ctx(160_000)).success,false);
});
test('wrong sender, late answers, duplicate answers and stale phases are rejected', () => {
  const source = questionRoom();
  assert.equal(applyGameAction(source,'b',{type:'answer',turnId:source.turnId,phase:'active_answering',answer:source.currentQuestion!.officialAnswer},ctx()).success,false);
  assert.equal(applyGameAction(source,'a',{type:'answer',turnId:source.turnId,phase:'active_answering',answer:source.currentQuestion!.officialAnswer},ctx(160_000)).success,false);
  let state = answer(source,'a','zzz');
  state = act(state,'b',{type:'buzz',turnId:state.turnId});
  assert.equal(applyGameAction(state,'a',{type:'answer',turnId:state.turnId,phase:'stealer_answering',answer:state.currentQuestion!.officialAnswer},ctx()).success,false);
  state = answer(state,'b');
  assert.equal(state.players[1].position,1);
  state = close(state);
  assert.equal(state.players[1].position,4);
  assert.equal(state.currentPlayerIndex,1);
  assert.equal(applyGameAction(state,'b',{type:'close',turnId:'turn-1',phase:'showing_result'},ctx()).success,false);
});
test('leaving before active player preserves identity; active departure cancels pending bonus safely', () => {
  let state = act(room({currentPlayerIndex:1}),'a',{type:'leave'});
  assert.equal(state.players[state.currentPlayerIndex].id,'b');
  state = act(room({status:'bonus_roll',isBonusRoll:true,bonusPlayerId:'a'}),'a',{type:'leave'});
  assert.equal(state.status,'playing');
  assert.equal(state.bonusPlayerId,null);
  assert.equal(state.players[state.currentPlayerIndex].id,'b');
  assert(act(state,'b',{type:'roll',turnId:state.turnId}).currentQuestion);
});
test('last-player departure returns to a joinable lobby; departed stealer ends their question', () => {
  let state = act(room({players:[player('a')]}),'a',{type:'leave'});
  assert.equal(state.status,'lobby');
  assert.equal(state.currentPlayerIndex,0);
  assert.equal(state.currentQuestion,null);
  state = answer(questionRoom(),'a','zzz');
  state = act(state,'b',{type:'buzz',turnId:state.turnId});
  state = act(state,'b',{type:'leave'});
  assert.equal(state.currentQuestion!.phase,'showing_result');
  assert.equal(state.currentQuestion!.result,'incorrect');
});
test('hints charge once per question and never exceed two per game', () => {
  let state = questionRoom();
  state = act(state,'a',{type:'hint',turnId:state.turnId});
  state = act(state,'a',{type:'hint',turnId:state.turnId});
  assert.equal(state.players[0].hintsRemaining,1);
  state = {...state,players:state.players.map(p=>({...p,hintsRemaining:0})),currentQuestion:{...state.currentQuestion!,hintUsedByPlayerIds:[]}};
  assert.equal(applyGameAction(state,'a',{type:'hint',turnId:state.turnId},ctx()).success,false);
});
test('normal/bonus/steal victories cross the finish line once for all dice boundaries', () => {
  for (let position=19;position<=24;position++) for (const r of [0,.16,.41,.66,.81,.91]) {
    let state = room({players:[player('a',position),player('b',position)]});
    let res = applyGameAction(state,'a',{type:'roll',turnId:state.turnId},ctx(100_000,r));
    state = res.room!;
    const dice = state.diceValue!;
    state = act(state,'a',{type:'open',turnId:state.turnId});
    const target=state;
    state = close(answer(state));
    assert.equal(state.players[0].position,((position+dice-1)%24)+1);
    assert.equal(state.status,position+dice>24?'finished':'bonus_roll');
    let steal = answer(target,'a','zzz');
    steal = act(steal,'b',{type:'buzz',turnId:steal.turnId});
    steal = close(answer(steal,'b'));
    assert.equal(steal.status,position+dice>24?'finished':'playing');
    if(steal.status==='finished') assert.equal(steal.winner!.id,'b');
  }
});
test('answer checker rejects false positives and preserves all curated alternatives', () => {
  assert.equal(isAnswerCorrect('con mèo','Con người'),false);
  assert.equal(isAnswerCorrect('xã hội','Xã hội, chính trị, lịch sử'),false);
  assert.equal(isAnswerCorrect('Không phải kinh tế','Kinh tế'),false);
  assert.equal(isAnswerCorrect('lịch sử, xã hội và chính trị','Xã hội, chính trị, lịch sử'),true);
  assert.equal(isAnswerCorrect('từ cao đến thấp','Thấp đến cao'),false);
  assert.equal(isAnswerCorrect('dcs vn','Đảng Cộng sản Việt Nam'),true);
  for (const square of BOARD_SQUARES) for(const q of square.questions) {
    for (const acceptable of [q.answer,...(q.acceptedAnswers||[])]) assert.equal(isAnswerCorrect(acceptable,q.answer,q.acceptedAnswers),true,`${q.id}: ${acceptable}`);
  }
});
test('host can recover abandoned roll/open/bonus phases, others cannot skip', () => {
  let state = room();
  assert.equal(applyGameAction(state,'b',{type:'skip',turnId:state.turnId},ctx()).success,false);
  state = act(state,'host',{type:'skip',turnId:state.turnId});
  assert.equal(state.players[state.currentPlayerIndex].id,'b');
  state = act(state,'b',{type:'roll',turnId:state.turnId});
  state = act(state,'host',{type:'open',turnId:state.turnId});
  assert.equal(state.status,'question');
});
