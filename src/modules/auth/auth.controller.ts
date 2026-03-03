import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { JwtRefreshGuard } from 'src/common/guards/jwt-refresh.guard';
import { User } from 'src/common/decorators/user.decorator';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';

@Controller('auth')
export class AuthController {
   constructor(
      private readonly authService: AuthService,
      private readonly configService: ConfigService,
   ) {
   }

   @Post('register')
   async register(
      @Body() dto: CreateUserDto,
      @Req() req: Request,
      @Res({ passthrough: true }) res: Response
   ) {
      return await this.authService.register(dto, req, res)
   }

   @Post('login')
   async login(
      @Body() dto: LoginDto,
      @Req() req: Request,
      @Res({ passthrough: true }) res: Response
   ) {
      return await this.authService.login(dto, req, res)
   }

   @UseGuards(JwtRefreshGuard)
   @Post('refresh')
   async refresh(
      @User() user: Express.User,
      @Res({ passthrough: true }) res: Response
   ) {
      return this.authService.rotateTokens(user, res);
   }

   @UseGuards(GoogleAuthGuard)
   @Get("google/login")
   googleLogin() { }

   @Get("google/callback")
   @UseGuards(GoogleAuthGuard)
   async googleCallback(
      @User() user: Express.User,
      @Res() res: Response,
   ) {
      await this.authService.loginGoogle(user.id, res);

      const FRONTEND_URL = this.configService.getOrThrow<string>('FRONTEND_URL')

      return res.redirect(
         `${FRONTEND_URL}/auth/callback`
      );
   }

   @Post('logout')
   @UseGuards(JwtAuthGuard)
   async logout(
      @User() user: Express.User
   ) {
      return this.authService.logout({ userId: user.id, sid: user.sessionId })
   }
}
