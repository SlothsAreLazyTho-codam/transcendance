import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { NewMatchDto } from './dto/match.dto';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { Match } from '@/database/schema';

@ApiTags('Matches')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
	constructor(private readonly matchesService: MatchesService) {}

	@ApiOperation({ summary: 'Create a new match' })
	@ApiResponse({
		status: 201,
		description: 'Match created successfully',
		type: Object,
	})
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@Post()
	async create(@Body() createMatchDto: NewMatchDto): Promise<Match> {
		// TODO: validate the match data
		// if invalid data is provided, throw a BadRequestException

		return await this.matchesService.create(createMatchDto);
	}

	@ApiOperation({ summary: 'Get all matches' })
	@ApiResponse({
		status: 200,
		description: 'Returns all matches',
		type: Object,
		isArray: true,
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@Get()
	@Get('/all')
	async findAll() {
		return await this.matchesService.getAll();
	}

	@ApiOperation({ summary: 'Get match by ID' })
	@ApiResponse({
		status: 200,
		description: 'Returns a match by ID',
		type: Object,
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@Get(':id')
	async findOne(@Param('id', ParseIntPipe) id: number) {
		return await this.matchesService.getById(id);
	}

	@ApiOperation({ summary: 'Delete match by ID' })
	@ApiResponse({
		status: 200,
		description: 'Match deleted successfully',
		type: Object,
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@Delete(':id')
	async remove(@Param('id', ParseIntPipe) id: number) {
		return await this.matchesService.remove(id);
	}
}
