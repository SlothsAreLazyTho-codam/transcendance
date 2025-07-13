import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FortyTwoUser } from '../interfaces';
import { Strategy } from 'passport-42'; // IGNORE THIS ERROR, IT WORKS.

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
	constructor(private config: ConfigService) {
		const envID = config.get<string>('FORTYTWO_UID');
		const envSecret = config.get<string>('FORTYTWO_SECRET');
		const envRedirect = config.get<string>('FORTYTWO_REDIRECT');

		if (!envID || !envSecret || !envRedirect) {
			throw new Error('42 OAuth credentials must be defined');
		}

		super({
			clientID: envID,
			clientSecret: envSecret,
			callbackURL: envRedirect,
			scope: ['public'],
			authorizationURL: 'https://api.intra.42.fr/oauth/authorize', // or 'https://api.intra.42.fr/oauth/authorize'
			tokenURL: 'https://api.intra.42.fr/oauth/token', // or 'https://api.intra.42.fr/oauth/token'
		});
	}

	validate(
		accessToken: string,
		refreshToken: string,
		profile: FortyTwoUser,
	): FortyTwoUser {
		return profile;
	}
}
