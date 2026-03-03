import { Inject, Injectable } from "@nestjs/common";
import { ConfigService, type ConfigType } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "../auth.service";
import type { Profile } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
   constructor(
      private readonly authService: AuthService,
      private readonly configService: ConfigService
   ) {
      const clientId = configService.getOrThrow<string>('GOOGLE_CLIENT_ID')
      const clientSecret = configService.getOrThrow<string>('GOOGLE_SECRET')
      const callbackURL = configService.getOrThrow<string>('GOOGLE_CALLBACK_URL')

      if (!clientId || !clientSecret || !callbackURL) {
         throw new Error("Google OAuth env vars missing");
      }

      super({
         clientID: clientId,
         clientSecret: clientSecret,
         callbackURL: callbackURL,
         scope: ["email", 'profile']
      })
   }

   async validate(accessToken, refreshToken, profile: Profile, done: VerifyCallback) {
      try {
         const providerAccountId = profile.id;
         const email = profile.emails?.[0]?.value;

         if (!email) {
            return done(new Error("Google account has no email"), false);
         }

         const user = await this.authService.validateGoogleUser({
            providerAccountId,
            email,
            displayName: profile.displayName ?? email.replace(/^.*$/, ""),
         });

         done(null, {
            id: user.id,
            sessionId: ''
         });
      } catch (err) {
         done(err, false);
      }
   }
}