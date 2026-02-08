# 🤖 AI Image Processing Platform

**Sistema completo de processamento de imagens com foco em remoção de fundo usando IA**

---

## 🏗️ Arquitetura

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Angular   │    │   Nginx     │    │   Node.js   │    │   Python    │
│  Frontend   │◄──►│ Proxy       │◄──►│  Backend    │◄──►│ AI Service  │
│   (Port     │    │ Reverso     │    │   (API)     │    │  (rembg)    │
│   4200)     │    │ (Port 80)   │    │ (Port 3001) │    │ (Port 5000) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🚀 Funcionalidades

- ✅ **Upload de Imagens**: Drag & drop com auto-hide da drop zone ao carregar imagem
- ✅ **IA Avançada**: Remoção de fundo usando U²-Net (Standard) e ISNet (Premium com Alpha Matting)
- ✅ **Image Enhancement**: Ajuste de brilho, contraste, saturação e nitidez com auto-enhance AI
- ✅ **Smart Crop**: Crop inteligente com AI auto-detect de faces ou controle manual preciso
- ✅ **Fluxo Unificado**: Em Background Remover, Image Enhancement e Smart Crop o botão de ação fica no painel de configurações/modelo e o resultado aparece no mesmo card de preview
- ✅ **Seleção de Modelo**: Escolha entre qualidade Standard e Premium antes do processamento
- ✅ **Preview em Tempo Real**: Comparação antes/depois com resultado em tempo real
- ✅ **Download Otimizado**: PNG com transparência
- ✅ **Multi-Page SPA**: Navegação entre Home, Background Remover, Image Enhancement, Smart Crop e Help
- ✅ **Seções Colapsáveis**: Toggle expand/collapse em cada seção (mat-expansion-panel)
- ✅ **Menu Responsivo**: Navegação adaptável para desktop e mobile
- ✅ **API RESTful**: Integração com outros sistemas
- ✅ **Containerizado**: Deploy simplificado com Docker (profiles dev/prod)
- ✅ **Live Reload**: Desenvolvimento com hot reload sem rebuild de containers
- ✅ **Escalável**: Microserviços independentes
- ✅ **Monitoramento**: Health checks e estatísticas

## 📋 Tecnologias Utilizadas

### Frontend
- **Angular 17** + Angular Material
- **TypeScript** para type safety
- **RxJS** para programação reativa
- **NgX File Drop** para upload intuitivo
- **Angular Router** para navegação multi-page
- **Mat Expansion Panel** para seções colapsáveis

### Backend  
- **Node.js** + Express + TypeScript
- **Multer** para upload de arquivos
- **Rate Limiting** e segurança
- **Health checks** automáticos

### AI Service
- **Python 3.11** + FastAPI
- **rembg** para remoção de fundo
- **Pillow (ImageEnhance/ImageFilter)** para image enhancement
- **OpenCV** para face detection e smart crop
- **U²-Net** model (SOTA quality)
- **Haar Cascade** para detecção de faces

### Infraestrutura
- **Docker & Docker Compose** com **profiles** (dev/prod)
- **Nginx** como proxy reverso (config separada para dev com WebSocket)
- **Live Reload** via `ng serve` + polling no modo dev
- **Volume persistente** para modelos AI e node_modules
- **Network isolation** entre containers

## 🔧 Execução Rápida

### 🚀 Produção
```bash
# Clonar e executar em modo produção
git clone <repo-url>
cd imagesProccess
docker compose --profile prod up -d --build

# Acessar aplicação
# http://localhost (Frontend + API)
```

### 🛠️ Desenvolvimento (Live Reload)
```bash
# Executar em modo desenvolvimento com live reload
docker compose --profile dev up -d

# Acessar aplicação (auto-reload ao editar código)
# http://localhost (via Nginx proxy)
# http://localhost:4201 (direto no Angular dev server)

# Parar ambiente
docker compose --profile dev down
```

> **Nota**: O modo dev monta o código-fonte como volume e usa `ng serve` com polling.
> Alterações em arquivos `.ts`, `.html` e `.scss` são detectadas automaticamente e o browser atualiza sozinho.

**📖 Documentação completa**: [README_EXECUTION.md](README_EXECUTION.md)

## 🤖 Opções de IA Implementadas

### Atual: Python + rembg
- **Modelos**: U²-Net (Standard) e ISNet General Use (Premium)
- **Premium**: Alpha Matting com warm-up automático
- **Performance**: ~0.3-0.5s (Standard), ~1s (Premium)
- **Formato de saída**: PNG com transparência

### Alternativas Documentadas
- **Node.js + TensorFlow.js**: Stack unificado
- **Java + DJL**: Enterprise ready
- **C# + ML.NET**: Microsoft ecosystem  
- **Go + TensorFlow**: Performance máxima
- **Rust + Candle**: Zero-cost abstractions

**📊 Comparação detalhada**: [AI_LANGUAGES_COMPARISON.md](AI_LANGUAGES_COMPARISON.md)

## 📁 Estrutura do Projeto

```
imagesProccess/
├── 🐳 docker-compose.yml          # Orquestração dos containers
├── 📖 README_EXECUTION.md         # Guia de execução
├── 📊 AI_LANGUAGES_COMPARISON.md  # Comparação de tecnologias AI
│
├── 🖥️ frontend/                   # Angular Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── src/app/
│   │   ├── app.component.{ts,html,scss}
│   │   ├── app.module.ts
│   │   ├── app-routing.module.ts     # Roteamento (/, /background-remover, /image-enhancement, /smart-crop, /help)
│   │   ├── components/
│   │   │   ├── header/               # Navegação responsiva
│   │   │   ├── footer/
│   │   │   ├── model-selector/        # Seleção de modelo AI + botão Remove Background
│   │   │   ├── image-uploader/        # Upload com drag & drop
│   │   │   ├── image-processor/       # Remoção de fundo (preview + comparação inline)
│   │   │   ├── enhancement-controls/  # Sliders de ajuste de imagem + botão Enhance
│   │   │   ├── enhancement-processor/ # Preview + comparação inline de enhancement
│   │   │   ├── crop-controls/         # Controles de crop (aspect ratio, dimensões)
│   │   │   ├── crop-processor/        # Preview e resultado de crop
│   │   │   └── result-comparison/     # Componente reutilizável de comparação
│   │   ├── pages/
│   │   │   ├── home/                  # Landing page
│   │   │   ├── background-remover/    # Página de remoção de fundo
│   │   │   ├── image-enhancement/     # Página de enhancement
│   │   │   ├── smart-crop/            # Página de crop inteligente
│   │   │   └── help/                  # Documentação e FAQ
│   │   └── services/
│   └── nginx.conf
│
├── 🔧 backend/                    # Node.js API
│   ├── Dockerfile  
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   ├── services/
│   └── middleware/
│
├── 🤖 ai-service/                 # Python AI Service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py (FastAPI)
│   └── NODEJS_ALTERNATIVE.md
│
└── 🌐 nginx/                      # Proxy Reverso
    ├── Dockerfile
    ├── default.dev.conf            # Config Nginx para dev (WebSocket + port 4200)
    └── conf.d/default.conf         # Config Nginx para produção
```

## 📈 Performance & Escalabilidade

### Métricas Atuais
- **Throughput**: ~50 imagens/minuto
- **Latência média**: 2-5 segundos por imagem
- **Suporte**: Imagens até 50MB
- **Concorrência**: Múltiplas requisições simultâneas

### Otimizações Implementadas
- ✅ **Caching de modelos** AI
- ✅ **Compressão** nginx 
- ✅ **Rate limiting** inteligente
- ✅ **Health checks** automáticos
- ✅ **Error handling** robusto

## 🔒 Segurança

- **Helmet.js**: Headers de segurança
- **CORS** configurado adequadamente  
- **Input validation** rigorosa
- **File type** verification
- **Rate limiting** anti-abuse
- **Error handling** sem vazamento de dados

## 🚧 Roadmap

### Em Desenvolvimento
- [ ] **Face Swap & Style Transfer**: Troca de rostos e transferência de estilo artístico
- [ ] **Image Restoration**: Restauração de fotos antigas, remoção de arranhões, colorização

### Próximas Funcionalidades
- [ ] **Autenticação JWT** 
- [ ] **Cache Redis** para resultados
- [ ] **Batch processing** otimizado
- [ ] **WebSocket** para real-time progress
- [ ] **Modelos AI customizados**
- [ ] **Dashboard analytics**
- [ ] **API versioning**
- [ ] **CI/CD pipeline**

### Otimizações Planejadas  
- [ ] **GPU acceleration** (CUDA)
- [ ] **CDN integration** 
- [ ] **Load balancing** 
- [ ] **Kubernetes** deployment
- [ ] **Monitoring** avançado (Prometheus/Grafana)

## 🏆 Vantagens Competitivas

### Técnicas
- **Microserviços**: Easy scaling e manutenção
- **containerização**: Deploy consistente
- **API-first**: Integração com qualquer frontend
- **Multi-formato**: JPG, PNG, WEBP, BMP, TIFF

### Negócio
- **Custo baixo**: Open source stack
- **Time-to-market**: Rápido desenvolvimento  
- **Escalabilidade**: Cloud-native architecture
- **Flexibilidade**: Múltiplas opções de deploy

---

## 📞 Suporte

- **Issues**: Use GitHub Issues para bugs
- **Features**: Use GitHub Discussions para ideias
- **Documentation**: Consulte os arquivos .md do projeto

---

**🎯 Objetivo**: Democratizar o processamento de imagens com IA, oferecendo uma solução completa, escalável e fácil de usar para remoção de fundo em imagens.

**⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!**
