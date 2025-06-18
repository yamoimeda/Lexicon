// src/app/rooms/[roomId]/lobby/page.tsx
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import RealtimeLobby from './RealtimeLobby';

export default function LobbyPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return <RealtimeLobby roomId={roomId} />;
}
