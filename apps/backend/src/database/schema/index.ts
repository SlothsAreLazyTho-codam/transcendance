import * as Users from './Users';
import * as BlockedUsers from './BlockedUsers';
import * as FollowedUsers from './FollowedUsers';
import * as Channels from './Channels';
import * as ChannelMembers from './ChannelMembers';
import * as MutedMembers from './MutedMembers';
import * as BannedMembers from './BannedMembers';
import * as ChannelMessages from './ChannelMessages';
import * as DirectMessageChannels from './DirectMessageChannels';
import * as DirectMessages from './DirectMessages';
import * as Avatars from './Avatars';
import * as Matches from './Matches';

// Import other schema files
// Combine all schemas into a single object
export const schema = {
	...Users,
	...BlockedUsers,
	...FollowedUsers,
	...Channels,
	...ChannelMembers,
	...MutedMembers,
	...BannedMembers,
	...ChannelMessages,
	...DirectMessageChannels,
	...DirectMessages,
	...Avatars,
	...Matches,
	// ...other tables
};

// You can also export individual schemas if needed
export * from './Users';
export * from './BlockedUsers';
export * from './FollowedUsers';
export * from './Channels';
export * from './ChannelMembers';
export * from './BannedMembers';
export * from './MutedMembers';
export * from './ChannelMessages';
export * from './DirectMessageChannels';
export * from './DirectMessages';
export * from './Avatars';
export * from './Matches';
// ...export other schemas
