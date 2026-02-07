# 🖼️ Processamento de Imagens - Clean Architecture

Uma aplicação web para processamento de imagens desenvolvida seguindo os princípios da **Arquitetura Limpa (Clean Architecture)**.

## 📋 Sobre o Projeto

Este projeto demonstra a implementação de um sistema de processamento de imagens utilizando os princípios da Clean Architecture proposta por Robert C. Martin (Uncle Bob). A aplicação permite upload, processamento e gerenciamento de imagens através de uma interface web intuitiva.

## 🏗️ Arquitetura Limpa

A Clean Architecture organiza o código em camadas concêntricas, onde as dependências apontam sempre para dentro (das camadas externas para as internas).

### Camadas do Projeto

```
┌─────────────────────────────────────────┐
│      Presentation Layer (Controllers)   │  ← Interface com usuário
├─────────────────────────────────────────┤
│      Application Layer (Use Cases)      │  ← Regras de negócio da aplicação
├─────────────────────────────────────────┤
│      Domain Layer (Entities)            │  ← Regras de negócio fundamentais
├─────────────────────────────────────────┤
│      Infrastructure Layer               │  ← Detalhes técnicos (BD, APIs, etc)
└─────────────────────────────────────────┘
```

### Estrutura de Diretórios

```
src/
├── domain/                    # Camada de Domínio (núcleo)
│   ├── entities/             # Entidades de negócio
│   │   └── Image.ts          # Entidade Image e interfaces
│   └── repositories/         # Interfaces (contratos)
│       ├── ImageRepository.ts
│       └── ImageProcessingService.ts
│
├── application/               # Camada de Aplicação
│   └── useCases/             # Casos de uso (regras de negócio)
│       ├── UploadImageUseCase.ts
│       ├── ProcessImageUseCase.ts
│       ├── GetImageUseCase.ts
│       ├── ListImagesUseCase.ts
│       └── DeleteImageUseCase.ts
│
├── infrastructure/            # Camada de Infraestrutura
│   ├── repositories/         # Implementações concretas
│   │   ├── FileSystemImageRepository.ts
│   │   └── SharpImageProcessingService.ts
│   └── server.ts            # Configuração do servidor Express
│
├── presentation/              # Camada de Apresentação
│   ├── controllers/          # Controladores HTTP
│   │   └── ImageController.ts
│   └── routes.ts            # Definição de rotas
│
└── index.ts                  # Ponto de entrada (Composition Root)
```

## ✨ Funcionalidades

- ✅ Upload de imagens (JPEG, PNG, WEBP, GIF)
- ✅ Redimensionamento de imagens
- ✅ Conversão de formatos
- ✅ Aplicação de filtros (preto e branco)
- ✅ Ajuste de qualidade
- ✅ Rotação de imagens
- ✅ Aplicação de desfoque
- ✅ Listagem de imagens
- ✅ Exclusão de imagens
- ✅ Interface web responsiva

## 🚀 Como Executar

### Pré-requisitos

- Node.js (v14 ou superior)
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/gcapecci/imagesProccess.git

# Entre no diretório
cd imagesProccess

# Instale as dependências
npm install
```

### Executar em Desenvolvimento

```bash
npm run dev
```

### Build e Execução em Produção

```bash
# Compilar TypeScript
npm run build

# Executar
npm start
```

A aplicação estará disponível em `http://localhost:3000`

## 📡 API Endpoints

### Upload de Imagem
```
POST /api/upload
Content-Type: multipart/form-data
Body: { image: <file> }
```

### Processar Imagem
```
POST /api/process/:id
Content-Type: application/json
Body: {
  width?: number,
  height?: number,
  format?: 'jpeg' | 'png' | 'webp',
  quality?: number,
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside',
  grayscale?: boolean,
  blur?: number,
  rotate?: number
}
```

### Listar Imagens
```
GET /api/images
```

### Obter Imagem
```
GET /api/images/:id
```

### Deletar Imagem
```
DELETE /api/images/:id
```

### Health Check
```
GET /health
```

## 🧪 Princípios da Clean Architecture Aplicados

### 1. **Dependency Rule (Regra da Dependência)**
- As dependências sempre apontam para dentro
- As camadas internas não conhecem as camadas externas
- O domínio não depende de nada

### 2. **Dependency Inversion (Inversão de Dependência)**
- Use cases dependem de interfaces (abstrações)
- Implementações concretas estão na camada de infraestrutura
- Exemplo: `ImageRepository` é uma interface no domínio, implementada como `FileSystemImageRepository` na infraestrutura

### 3. **Single Responsibility (Responsabilidade Única)**
- Cada classe tem uma única responsabilidade
- Controllers: lidar com HTTP
- Use Cases: lógica de negócio
- Repositories: persistência

### 4. **Open/Closed (Aberto/Fechado)**
- Fácil adicionar novos casos de uso sem modificar código existente
- Fácil trocar implementações (ex: trocar Sharp por outra biblioteca)

### 5. **Interface Segregation (Segregação de Interface)**
- Interfaces específicas para cada necessidade
- `ImageRepository` e `ImageProcessingService` são interfaces separadas

## 🛠️ Tecnologias Utilizadas

- **TypeScript**: Linguagem principal
- **Express**: Framework web
- **Sharp**: Processamento de imagens
- **Multer**: Upload de arquivos
- **UUID**: Geração de IDs únicos

## 📝 Benefícios da Clean Architecture

1. **Testabilidade**: Fácil criar testes unitários para use cases
2. **Manutenibilidade**: Código organizado e fácil de entender
3. **Flexibilidade**: Fácil trocar implementações (ex: mudar de Sharp para outra lib)
4. **Independência de Framework**: Lógica de negócio não depende do Express
5. **Escalabilidade**: Fácil adicionar novos recursos

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ seguindo os princípios da Clean Architecture
