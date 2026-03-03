import { Module } from '@nestjs/common';
import { ColumnService } from './column.service';
import { ColumnController } from './column.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { BoardModule } from '../board/board.module';

@Module({
  imports: [WorkspaceModule, BoardModule],
  controllers: [ColumnController],
  providers: [ColumnService],
})
export class ColumnModule { }
