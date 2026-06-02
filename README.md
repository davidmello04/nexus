# Nexus

Sistema para controle de pedidos, clientes, produtos, preços, variações e imagens.

## Stack

### Front-end

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- MySQL

## Módulos iniciais

- Clientes
- Produtos
- Categorias
- Variações de produtos
- Pedidos
- Upload de imagens

## Regras iniciais

- Clientes podem ser marcados como terceirizados.
- Produtos possuem preço base e preço terceirizado.
- Variações podem possuir preço base e preço terceirizado próprios.
- Se a variação tiver preço próprio, ele prevalece sobre o preço do produto.
- Se o cliente for terceirizado, o sistema usa o preço terceirizado.
- Se o cliente não for terceirizado, o sistema usa o preço base.

## Estrutura

```txt
nexus/
  apps/
    web/
    api/
  docker-compose.yml
  README.md
```