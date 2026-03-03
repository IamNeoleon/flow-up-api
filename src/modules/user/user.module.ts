import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { R2Module } from '../r2/r2.module';

@Module({
  imports: [R2Module],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule { }
