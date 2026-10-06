import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase/config';
import { testConnection, createRoom, joinRoom, subscribeToRoom, startGame, rollDice, restartGame, leaveRoom } from './firebase/roomService';
import { RoomState } from './types/game';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { sounds } from './utils/audio';

function getOrCreateUserId(): string {
  let uid = localStorage.getItem('boardgame_user_id');
  if (!uid) {
    uid = 'player_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('boardgame_user_id', uid);
  }
  return uid;
}

export default function App() {
  const [userId, setUserId] = useState<string>(() => getOrCreateUserId());
  const [currentRoomCode, setCurrentRoomCode] = useState<string>('');
  const [inviteRoomCode, setInviteRoomCode] = useState<string>('');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize auth & check invitation URL
  useEffect(() => {
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        signInAnonymously(auth).catch((err) => {
          console.warn('Anonymous auth fallback:', err);
        });
      }
    });

    // Check URL params for room invitation
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      const code = roomParam.trim().toUpperCase();
      setInviteRoomCode(code);
      setCurrentRoomCode(code);
    } else {
      const cachedRoom = localStorage.getItem('boardgame_current_room');
      if (cachedRoom) {
        setCurrentRoomCode(cachedRoom.toUpperCase());
      }
    }

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to real-time room changes
  useEffect(() => {
    if (!currentRoomCode) return;

    const unsubscribe = subscribeToRoom(currentRoomCode, (updatedRoom) => {
      if (updatedRoom) {
        setRoom(updatedRoom);
        localStorage.setItem('boardgame_current_room', currentRoomCode);
      } else {
        setRoom(null);
        setCurrentRoomCode('');
        localStorage.removeItem('boardgame_current_room');
        setErrorMessage('Phòng không tồn tại hoặc đã kết thúc.');
      }
    });

    return () => unsubscribe();
  }, [currentRoomCode]);

  // Handle Room Creation
  const handleCreateRoom = async (playerName: string, hostIsPlayer: boolean = false) => {
    const activeUid = userId || getOrCreateUserId();
    setIsCreating(true);
    setErrorMessage(null);
    try {
      const code = await createRoom(playerName, activeUid, hostIsPlayer);
      setCurrentRoomCode(code);
      const newUrl = `${window.location.pathname}?room=${code}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (err: any) {
      console.error('Create room error:', err);
      setErrorMessage(err?.message || 'Không thể tạo phòng. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Room Join
  const handleJoinRoom = async (code: string, playerName: string) => {
    const activeUid = userId || getOrCreateUserId();
    setIsJoining(true);
    setErrorMessage(null);
    try {
      const res = await joinRoom(code, playerName, activeUid);
      if (res.success) {
        setCurrentRoomCode(code);
        const newUrl = `${window.location.pathname}?room=${code}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      } else {
        setErrorMessage(res.message || 'Không thể tham gia phòng.');
      }
    } catch (err: any) {
      console.error('Join room error:', err);
      setErrorMessage(err?.message || 'Lỗi tham gia phòng.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Game Start by Host
  const handleStartGame = async () => {
    if (!room || !userId) return;
    setIsStarting(true);
    try {
      await startGame(room.roomCode, userId);
    } catch (err: any) {
      console.error('Start game error:', err);
      setErrorMessage(err?.message || 'Không thể bắt đầu trò chơi.');
    } finally {
      setIsStarting(false);
    }
  };

  // Handle Dice Roll
  const handleRollDice = async () => {
    if (!room || !userId) return;
    try {
      await rollDice(room.roomCode, userId);
    } catch (err: any) {
      console.error('Roll error:', err);
    }
  };

  // Handle Restart Game by Host
  const handleRestartGame = async () => {
    if (!room || !userId) return;
    setIsRestarting(true);
    try {
      await restartGame(room.roomCode, userId);
    } catch (err: any) {
      console.error('Restart error:', err);
    } finally {
      setIsRestarting(false);
    }
  };

  // Handle Leave Room
  const handleLeaveRoom = async () => {
    sounds.playClick();
    if (room && userId) {
      try {
        await leaveRoom(room.roomCode, userId);
      } catch (err) {
        console.error('Leave error:', err);
      }
    }
    setRoom(null);
    setCurrentRoomCode('');
    setInviteRoomCode('');
    localStorage.removeItem('boardgame_current_room');
    const newUrl = window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  // Check if current user is actively in the room as Host or Player
  const isUserMemberOfRoom = room && (room.hostId === userId || room.players.some((p) => p.id === userId));

  // If not in room, show HomeScreen
  if (!room || !currentRoomCode || !isUserMemberOfRoom) {
    return (
      <HomeScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        isCreating={isCreating}
        isJoining={isJoining}
        errorMessage={errorMessage}
        initialRoomCode={inviteRoomCode || currentRoomCode}
      />
    );
  }

  if (room.status === 'lobby') {
    return (
      <LobbyScreen
        room={room}
        myPlayerId={userId}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
        isStarting={isStarting}
      />
    );
  }

  if (room.status === 'finished') {
    return (
      <ResultScreen
        room={room}
        myPlayerId={userId}
        onRestartGame={handleRestartGame}
        onGoHome={handleLeaveRoom}
        isRestarting={isRestarting}
      />
    );
  }

  // Active Game screen (status: 'playing', 'rolling', 'moving', 'evaluating')
  return (
    <GameScreen
      room={room}
      myPlayerId={userId}
      onRollDice={handleRollDice}
      onLeaveRoom={handleLeaveRoom}
    />
  );
}
