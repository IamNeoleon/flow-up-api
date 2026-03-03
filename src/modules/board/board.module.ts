import { Module } from '@nestjs/common';
import { BoardService } from './services/board.service';
import { BoardImageService } from './services/board-image.service';
import { BoardController } from './board.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { R2Module } from '../r2/r2.module';

@Module({
  imports: [WorkspaceModule, R2Module],
  controllers: [BoardController],
  providers: [BoardService, BoardImageService],
  exports: [BoardService]
})
export class BoardModule { }
