import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

const MULTER_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: 'A imagem excede o tamanho máximo permitido (5MB)',
  LIMIT_FILE_COUNT: 'Apenas uma imagem pode ser enviada por pedido',
  LIMIT_UNEXPECTED_FILE: 'Campo de ficheiro inválido',
};

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const message =
      MULTER_MESSAGES[exception.code] ?? `Erro no upload do ficheiro: ${exception.code}`;

    response.status(400).json(new BadRequestException(message).getResponse());
  }
}