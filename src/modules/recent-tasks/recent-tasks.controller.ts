import { Body, Controller, DefaultValuePipe, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { RecentTasksService } from './recent-tasks.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-access.guard';
import { User } from 'src/common/decorators/user.decorator';
import { TrackOpenDto } from './dto/track-open.dto';

@Controller('recent-tasks')
@UseGuards(JwtAuthGuard)
export class RecentTasksController {
	constructor(private readonly recentTasksService: RecentTasksService) { }

	@Post()
	async trackOpen(
		@User() user: Express.User,
		@Body() dto: TrackOpenDto
	) {
		return this.recentTasksService.trackOpen(user.id, dto.taskId)
	}

	@Get()
	async getRecent(
		@User() user: Express.User,
		@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
	) {
		return this.recentTasksService.listRecent(user.id, limit)
	}
}
