# AluguelQuadra Backend

API REST em .NET 8 para gerenciamento de reservas de quadras de areia seguindo Clean Architecture.

## Estrutura da Solu��o

- `AluguelQuadra.Domain`: Entidades de dom�nio e enumera��es.
- `AluguelQuadra.Application`: DTOs, contratos de reposit�rios/servi�os e regras de neg�cio.
- `AluguelQuadra.Infrastructure`: Entity Framework Core, DbContext e implementa��es de reposit�rio com PostgreSQL.
- `AluguelQuadra.Api`: Web API com controllers, inje��o de depend�ncia e configura��o de infraestrutura.

## Pr�-requisitos

- .NET SDK 8.0+
- PostgreSQL (por padr�o usa `aluguelcampodb`, usu�rio `postgres`, senha `dono`).

## Configura��o

1. Ajuste a connection string em `AluguelQuadra.Api/appsettings*.json` conforme seu ambiente.
2. Instale depend�ncias: `dotnet restore AluguelQuadra.sln`.
3. Compile para conferir: `dotnet build AluguelQuadra.sln`.

> **Observa��o:** Migrations do Entity Framework Core ainda n�o foram criadas. Execute `dotnet ef migrations add InitialCreate` (ap�s referenciar a CLI de ferramentas) quando desejar versionar o banco.

## Execu��o

Execute a API com:

```bash
 dotnet run --project AluguelQuadra.Api
```

A API exp�e por padr�o:

- `GET /api/quadras`
- `GET /api/quadras/{id}/horarios-disponiveis?data=2025-10-25`
- `POST /api/reservas`
- `GET /api/reservas/minhas-reservas/{clienteId}`
- `PATCH /api/reservas/{id}/cancelar`

A documenta��o interativa (Swagger) fica dispon�vel em `/swagger` quando `ASPNETCORE_ENVIRONMENT=Development`.

## Pr�ximos Passos Sugeridos

- Implementar migrations iniciais e seed de dados de exemplo.
- Adicionar autentica��o/autoriza��o se necess�rio.
- Criar testes automatizados para os servi�os de aplica��o.

