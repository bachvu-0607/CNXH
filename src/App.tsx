import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase/config';
import { createRoom, joinRoom, subscribeToRoom, startGame, rollDice, restartGame, leaveRoom } from './firebase/roomService';
import { RoomState } from './types/game';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { sounds } from './utils/audio';

export default function App() {
  const [userId, setUserId] = useState<string>('');
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
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId('');
        signInAnonymously(auth).catch((err) => {
          setErrorMessage('Không thể đăng nhập để chơi. Vui lòng tải lại trang và kiểm tra kết nối.');
        });
      }
    });

    // Check URL params for room invitation
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      const code = roomParam.trim().toUpperCase();
      if (/^[A-Z0-9]{5}$/.test(code)) {
        setInviteRoomCode(code);
        setCurrentRoomCode(code);
      } else setErrorMessage('Liên kết chứa mã phòng không hợp lệ.');
    } else {
      const cachedRoom = localStorage.getItem('boardgame_current_room');
      if (cachedRoom && /^[A-Z0-9]{5}$/i.test(cachedRoom)) {
        setCurrentRoomCode(cachedRoom.toUpperCase());
      }
    }

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to real-time room changes
  useEffect(() => {
    if (!currentRoomCode || !userId) return;

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
    }, setErrorMessage);

    return () => unsubscribe();
  }, [currentRoomCode, userId]);

  // Handle Room Creation
  const handleCreateRoom = async (playerName: string, hostIsPlayer: boolean = false) => {
    const activeUid = userId;
    if (!activeUid) { setErrorMessage('Đang đăng nhập, vui lòng thử lại sau vài giây.'); return; }
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
    const activeUid = userId;
    if (!activeUid) { setErrorMessage('Đang đăng nhập, vui lòng thử lại sau vài giây.'); return; }
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
    setErrorMessage(null);
    setIsStarting(true);
    try {
      const result = await startGame(room.roomCode, userId);
      if (!result.success) throw new Error(result.message);
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
      const result = await rollDice(room.roomCode, userId, room.turnId || 'legacy');
      if (!result.success) throw new Error(result.message);
    } catch (err: any) {
      throw err;
    }
  };

  // Handle Restart Game by Host
  const handleRestartGame = async () => {
    if (!room || !userId) return;
    setErrorMessage(null);
    setIsRestarting(true);
    try {
      const result = await restartGame(room.roomCode, userId);
      if (!result.success) throw new Error(result.message);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể bắt đầu ván mới.');
    } finally {
      setIsRestarting(false);
    }
  };

  // Handle Leave Room
  const handleLeaveRoom = async () => {
    sounds.playClick();
    if (room && userId) {
      try {
        const result = await leaveRoom(room.roomCode, userId);
        if (!result.success) throw new Error(result.message);
      } catch (err) {
        setErrorMessage('Chưa rời được phòng. Vui lòng kiểm tra kết nối và thử lại.');
        return;
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
        isCreating={isCreating || !userId}
        isJoining={isJoining || !userId}
        errorMessage={errorMessage}
        initialRoomCode={inviteRoomCode || currentRoomCode}
      />
    );
  }

  const withError = (content: React.ReactNode) => <>
    {content}
    {errorMessage && <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] bg-rose-50 text-rose-800 border border-rose-200 rounded-xl p-3 text-sm shadow">{errorMessage}</div>}
  </>;

  if (room.status === 'lobby') {
    return withError(
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
    return withError(
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
  return withError(
    <GameScreen
      room={room}
      myPlayerId={userId}
      onRollDice={handleRollDice}
      onLeaveRoom={handleLeaveRoom}
    />
  );
}
