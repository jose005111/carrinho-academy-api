import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TurmasService } from './turmas.service';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';

@UseGuards(JwtAuthGuard)
@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Post()
  create(@Body() dto: CreateTurmaDto) {
    return this.turmasService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.turmasService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.turmasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTurmaDto) {
    return this.turmasService.update(id, dto);
  }

  @Post(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.turmasService.cancelar(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.turmasService.remove(id);
  }
}
