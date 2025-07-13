export interface DirectMessage {
	receiverId: number;
	value: string;
}

export interface DirectMessageResponse {
	user: number;
	username: string;
	channelId: number[];
	message: string;
}

export interface DirectMessageError {
	error: string;
}
