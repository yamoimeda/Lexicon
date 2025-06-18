// src/app/rooms/[roomId]/play/page.tsx
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import RealtimeGamePage from './RealtimeGamePage';

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return <RealtimeGamePage roomId={roomId} />;
}
