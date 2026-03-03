import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';
import { User } from 'src/common/decorators/user.decorator';
import { CompleteAvatarUploadDto, PresignAvatarUploadDto } from './dto/avatar.dto';
import { VerifiedGuard } from 'src/common/guards/verified.guard';
import { ChangeNameDto } from './dto/change-name.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
   constructor(private readonly userService: UserService) { }

   @Get('me')
   async getMe(@User() user: Express.User) {
      return await this.userService.getMe(user.id)
   }

   @Patch('me')
   async changeName(
      @User() user: Express.User,
      @Body() dto: ChangeNameDto
   ) {
      return this.userService.changeName({ userId: user.id, dto })
   }

   @Patch('me/change-password')
   async changePassword(
      @User() user: Express.User,
      @Body() dto: ChangePasswordDto
   ) {
      return this.userService.changePassword({ userId: user.id, dto })
   }

   @UseGuards(VerifiedGuard)
   @Post('me/avatar/presign-upload')
   presignAvatarUpload(@User() user: Express.User, @Body() dto: PresignAvatarUploadDto) {
      return this.userService.presignAvatarUpload(user.id, dto.mimeType);
   }

   @UseGuards(VerifiedGuard)
   @Post('me/avatar/complete')
   completeAvatar(@User() user: Express.User, @Body() dto: CompleteAvatarUploadDto) {
      return this.userService.completeAvatarUpload(user.id, dto.key);
   }

}
