// src/pages/api/socket.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { Server as NetServer, Socket } from 'net';
import { initializeGameServer } from '@/lib/socket-server';

interface SocketServer extends HTTPServer {
  io?: any;
}

interface SocketWithServer extends Socket {
  server: NetServer & {
    io?: any;
  };
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithServer;
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    console.log('Socket.IO already running');
  } else {
    console.log('Initializing Socket.IO');
    const httpServer: SocketServer = res.socket.server as any;
    initializeGameServer(httpServer);
    res.socket.server.io = true;
  }
  res.end();
}