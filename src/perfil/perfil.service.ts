import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from './entities/perfil.entity';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@Injectable()
export class PerfilService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
  ) {}

  async findOne(id: string): Promise<Perfil> {
    const perfil = await this.perfilRepository.findOne({ where: { id } });

    if (!perfil) {
      throw new NotFoundException('Perfil nao encontrado');
    }

    return perfil;
  }

  async update(id: string, dto: UpdatePerfilDto): Promise<Perfil> {
    const perfil = await this.findOne(id);
    Object.assign(perfil, dto);
    return this.perfilRepository.save(perfil);
  }
}
