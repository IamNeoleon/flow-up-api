import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { BoardService } from './services/board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';
import { WorkspaceGuard } from 'src/common/guards/workspace.guard';
import { User } from 'src/common/decorators/user.decorator';
import { WorkspaceContext } from 'src/common/decorators/workspace-context.decorator';
import { type IWorkspaceContext } from 'src/common/types/workspace-context';
import { VerifiedGuard } from 'src/common/guards/verified.guard';
import { BoardImageService } from './services/board-image.service';
import {
    CompleteImageUploadDto,
    PresignImageUploadDto,
} from './dto/upload-image.dto';

@Controller('workspaces/:workspaceId/boards')
@UseGuards(JwtAuthGuard, WorkspaceGuard, VerifiedGuard)
export class BoardController {
    constructor(
        private readonly boardService: BoardService,
        private readonly boardImageService: BoardImageService,
    ) {}

    @Post()
    create(
        @Param('workspaceId') workspaceId: string,
        @Body() createBoardDto: CreateBoardDto,
        @WorkspaceContext() workspace: IWorkspaceContext,
        @User() user: Express.User,
    ) {
        return this.boardService.create(
            workspaceId,
            createBoardDto,
            workspace.workspaceRole,
            user.id,
        );
    }

    @Get(':boardId')
    findOne(@Param('boardId') boardId: string) {
        return this.boardService.findOne(boardId);
    }

    @Patch(':boardId')
    update(
        @Param('boardId') id: string,
        @Body() updateBoardDto: UpdateBoardDto,
        @WorkspaceContext() workspace: IWorkspaceContext,
    ) {
        return this.boardService.update(
            id,
            updateBoardDto,
            workspace.workspaceRole,
        );
    }

    @Delete(':boardId')
    remove(
        @Param('boardId') id: string,
        @WorkspaceContext() workspace: IWorkspaceContext,
    ) {
        return this.boardService.remove(id, workspace.workspaceRole);
    }

    @Post(':boardId/image/presign-upload')
    presignImageUpload(
        @Param('boardId') boardId: string,
        @Body() dto: PresignImageUploadDto,
    ) {
        return this.boardImageService.presignImageUpload(boardId, dto.mimeType);
    }

    @Post(':boardId/image/complete')
    completeImageUpload(
        @Param('boardId') boardId: string,
        @Body() dto: CompleteImageUploadDto,
    ) {
        return this.boardImageService.completeImageUpload(boardId, dto.key);
    }

    @Get(':boardId/task-list')
    getTaskLists(@Param('boardId') boardId: string) {
        return this.boardService.getAllTaskList(boardId);
    }
}
