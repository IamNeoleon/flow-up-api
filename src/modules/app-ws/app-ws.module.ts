import { Module } from '@nestjs/common';
import { AppWsGateway } from './app-ws.gateway';
import { AppWsEmitter } from './app-ws-emitter.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [WorkspaceModule, AuthModule],
  providers: [AppWsGateway, AppWsEmitter],
  exports: [AppWsEmitter]
})
export class AppWsModule { }
