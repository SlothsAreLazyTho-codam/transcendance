import { io } from 'socket.io-client';

const token =
	'REPLACE WITH TOKEN FROM[http://localhost:3001/api/v1/auth/42/callback]';

const socket = io('ws://localhost:3001/ws/v1/chat', {
	auth: {
		token: `Bearer ${token}`,
	},
	transports: ['websocket'],
	reconnection: true,
});

socket.on('connect', () => {
	console.log('Connected!');

	// Test sending a message
	socket.emit('channelMe');
	// console.log('Ik kom hier!');
});

socket.on('info', (data) => {
	console.log('Received info:', data);
});

socket.on('connect_error', (error) => {
	console.error('Connection failed:', error);
});

socket.on('disconnect', (reason) => {
	console.log('Disconnected:', reason);
});

// Add more debug events
socket.on('error', (error) => {
	console.error('Socket error:', error);
});

socket.io.on('reconnect_attempt', () => {
	console.log('Attempting to reconnect...');
});

// Keep the process alive
process.stdin.resume();
