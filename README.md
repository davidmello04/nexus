# Nexus

Sistema de gestão empresarial desenvolvido para centralizar clientes, produtos, preços, orçamentos, pedidos e relatórios em uma única aplicação.

O projeto utiliza uma arquitetura full-stack em monorepo, com interface em React, API REST em NestJS e persistência de dados com MySQL e Prisma ORM.

> O Nexus está em desenvolvimento e atualmente passa por uma etapa de refinamento técnico, visual e funcional. A aplicação foi projetada com a intenção de evoluir para utilização em ambiente de produção.

## Visão geral

O Nexus foi criado para atender empresas que trabalham com produtos personalizáveis, variações e diferentes condições comerciais por cliente.

Além dos preços padrão dos produtos, o sistema permite trabalhar com:

- Preços específicos para clientes terceirizados
- Preços definidos diretamente nas variações
- Valores personalizados por cliente e produto
- Orçamentos que podem ser convertidos em pedidos
- Acompanhamento das etapas de produção
- Exportação de informações em PDF e planilhas

## Funcionalidades

### Dashboard

- Visão geral das operações
- Indicadores de clientes, produtos, pedidos e orçamentos
- Informações consolidadas para acompanhamento do negócio

### Clientes

- Cadastro e atualização de clientes
- Ativação e inativação de registros
- Identificação de clientes terceirizados
- Cadastro de CPF ou CNPJ
- Telefone e e-mail
- Origem do cliente
- Observações
- Cadastro de múltiplos endereços
- Endereços principais, de entrega ou cobrança

### Categorias

- Cadastro de categorias
- Edição de informações
- Ativação e inativação
- Associação de produtos

### Produtos

- Cadastro e gerenciamento de produtos
- Descrição e categorização
- Preço base
- Preço para clientes terceirizados
- Ativação e inativação
- Upload de imagens
- Definição de imagem principal
- Cadastro de variações

### Variações de produtos

As variações podem armazenar informações como:

- Tamanho
- Cor
- Tipo
- Material
- Preço base próprio
- Preço terceirizado próprio
- Situação ativa ou inativa

Quando uma variação possui preço próprio, esse valor pode prevalecer sobre o preço cadastrado no produto.

### Preços personalizados

O Nexus permite definir diferentes condições comerciais:

- Preço padrão do produto
- Preço destinado a clientes terceirizados
- Preço específico da variação
- Preço personalizado por cliente e produto
- Preço personalizado por cliente, produto e variação

A centralização dessas regras reduz cálculos manuais e mantém consistência entre orçamentos e pedidos.

### Orçamentos

- Criação de orçamentos por cliente
- Inclusão de produtos e variações
- Cálculo de quantidade, valor unitário e total
- Aplicação de descontos
- Data de validade
- Observações
- Controle de status
- Conversão de orçamento aprovado em pedido

Status disponíveis:

- Rascunho
- Enviado
- Aprovado
- Rejeitado
- Expirado

### Pedidos

- Criação de pedidos por cliente
- Inclusão de produtos e variações
- Cálculo de subtotal, desconto e total
- Observações gerais e por item
- Associação com orçamento de origem
- Acompanhamento do fluxo de produção

Status disponíveis:

- Rascunho
- Pendente
- Em produção
- Concluído
- Cancelado

### Configurações da empresa

- Nome empresarial
- Documento
- Telefone e WhatsApp
- Instagram
- Endereço
- Logotipo
- Mensagem padrão para pedidos

### Relatórios

- Consolidação de informações operacionais
- Geração de documentos em PDF
- Exportação de dados em planilhas
- Estrutura preparada para evolução de relatórios gerenciais

## Tecnologias

### Front-end

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Radix UI
- TanStack Query
- React Hook Form
- Zod
- Axios
- React Router
- Lucide React
- Sonner
- date-fns

### Back-end

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- MySQL
- class-validator
- class-transformer
- Swagger/OpenAPI
- Multer
- PDFKit
- ExcelJS

### Infraestrutura e desenvolvimento

- npm Workspaces
- Docker Compose
- ESLint
- Prettier
- Jest
- Git
- GitHub

## Arquitetura

O projeto utiliza uma estrutura monorepo:

```text
nexus/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   └── src/
│   │       ├── categories/
│   │       ├── company-settings/
│   │       ├── customer-product-prices/
│   │       ├── customers/
│   │       ├── dashboard/
│   │       ├── orders/
│   │       ├── pricing/
│   │       ├── product-images/
│   │       ├── product-variants/
│   │       ├── products/
│   │       ├── quotes/
│   │       └── reports/
│   └── web/
│       └── src/
│           ├── app/
│           ├── components/
│           ├── features/
│           ├── hooks/
│           ├── lib/
│           └── theme/
├── docker-compose.yml
├── package.json
└── README.md
```

## Modelo de dados

Entre as principais entidades estão:

- Customer
- Address
- Category
- Product
- ProductImage
- ProductVariant
- CustomerProductPrice
- Quote
- QuoteItem
- Order
- OrderItem
- CompanySettings

O banco de dados utiliza identificadores CUID, relacionamentos explícitos e valores monetários armazenados como `Decimal`.

## Requisitos

- Node.js
- npm
- Docker e Docker Compose
- MySQL, caso o banco não seja iniciado pelo Docker

## Como executar

### 1. Clonar o repositório

```bash
git clone https://github.com/davidmello04/nexus.git
cd nexus
```

### 2. Instalar as dependências

```bash
npm install
```

O projeto utiliza npm Workspaces para gerenciar a aplicação web e a API a partir da raiz.

### 3. Configurar as variáveis de ambiente

Copie os arquivos de exemplo:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Revise os valores antes de iniciar a aplicação.

Exemplo de configuração local:

```env
DATABASE_URL="mysql://nexus_user:nexus_password@localhost:3307/nexus_db"
PORT=3333
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
VITE_API_URL="http://localhost:3333/api"
```

### 4. Iniciar o banco de dados

```bash
docker compose up -d
```

### 5. Gerar o Prisma Client

```bash
npm run prisma:generate
```

### 6. Executar as migrations

```bash
npm run prisma:migrate
```

### 7. Iniciar a aplicação

Para iniciar o front-end e a API simultaneamente:

```bash
npm run dev
```

Também é possível iniciar os projetos separadamente:

```bash
npm run dev:web
npm run dev:api
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o front-end e a API |
| `npm run dev:web` | Inicia somente a aplicação React |
| `npm run dev:api` | Inicia somente a API NestJS |
| `npm run build` | Gera o build completo |
| `npm run build:web` | Gera o build do front-end |
| `npm run build:api` | Gera o build da API |
| `npm run lint` | Executa as verificações de código |
| `npm run prisma:validate` | Valida o schema do Prisma |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate` | Executa migrations em desenvolvimento |
| `npm run prisma:studio` | Abre o Prisma Studio |

## Documentação da API

A API possui integração com Swagger/OpenAPI para consulta e teste dos endpoints.

Após iniciar a API, consulte a rota configurada para a documentação Swagger.

## Estado do projeto

O Nexus possui os principais módulos de gestão implementados, mas ainda está em desenvolvimento.

Próximas etapas planejadas:

- Refinamento da interface
- Melhorias de responsividade
- Revisão das regras de negócio
- Ampliação dos relatórios
- Cobertura de testes automatizados
- Autenticação e autorização
- Preparação do ambiente de produção
- Documentação dos endpoints
- Dados de demonstração
- Integração contínua

## Segurança

Este repositório não deve conter credenciais ou dados reais.

Antes de utilizar o projeto em produção:

- Configure variáveis de ambiente próprias
- Não reutilize os valores dos arquivos de exemplo
- Implemente autenticação e autorização
- Restrinja as origens permitidas pelo CORS
- Utilize conexão segura com o banco de dados
- Revise o upload e o acesso aos arquivos
- Mantenha as dependências atualizadas

## Licença

O projeto ainda não possui uma licença pública definida.

Antes de reutilizar ou distribuir o código, entre em contato com o autor.

## Autor

Desenvolvido por [David Mello](https://github.com/davidmello04).
