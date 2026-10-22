import { Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import typeormConfig from "./config/typeorm.config";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PerfilModule } from "./perfil/perfil.module";
import { EmpresasModule } from "./empresas/empresas.module";
import { EnderecoModule } from "./endereco/endereco.module";
import { FormandosModule } from "./formandos/formandos.module";
import { FormacoesModule } from "./formacoes/formacoes.module";
import { FormandoFormacaoModule } from "./formando-formacao/formando-formacao.module";
import { FormadoresModule } from "./formadores/formadores.module";
import { FormadorFormacaoModule } from "./formador-formacao/formador-formacao.module";
import { RootModule } from "./root/root.module";
import { DashboardModule } from "./dashboard/dashboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(typeormConfig)],
      inject: [typeormConfig.KEY],
      useFactory: (config: ConfigType<typeof typeormConfig>) => config,
    }),
    AuthModule,
    UsersModule,
    PerfilModule,
    EmpresasModule,
    EnderecoModule,
    FormandosModule,
    FormacoesModule,
    FormandoFormacaoModule,
    FormadoresModule,
    FormadorFormacaoModule,
    RootModule,
    DashboardModule,
  ],
})
export class AppModule {}
