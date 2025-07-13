export interface TextMessage {
	channelId: number;
	value: string;
}

export interface TextMessageResponse {
	id: number;
	user: number;
	username: string;
	channelId: number;
	value: string;
}

export interface TextMessageError {
	error: string;
}

export interface newTextMessage {
	receiverId: number; // the id of the user or channel
	receiverType: 'CHANNEL' | 'USER'; // the type of the receiver
	value: string; // The message content
}

export interface newTextMessageResponse {
	id: number; // The id of the message
	receiverId: number; // The id of the user or channel.
	receiverType: 'CHANNEL' | 'USER'; // The type of the receiver
	senderId: number; // The id of the sender
	senderName: string; // The name of the sender
	value: string; // The message content
}
// if its a dm , get the channel using the senderId and receiverId.
