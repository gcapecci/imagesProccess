# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed - 2026-02-08 (Intro Hero Shared Styles & Layout Consistency)

#### Estilo de Hero Unificado
- Extraído o estilo de hero das páginas principais para um partial dedicado `_intro-hero.scss`, evitando misturar domínios com o `_settings-panel.scss`.
- Páginas `Background Remover`, `Image Enhancement` e `Smart Crop` passaram a usar `.intro-hero` via `@extend`, garantindo visual consistente e facilitando manutenção.

#### Alinhamento de Layout — Smart Crop
- Ajustado o `padding` do container de `SmartCropComponent` para `0 24px` (desktop) e `0 16px` (mobile), alinhando a altura útil com as demais páginas (`Image Enhancement` e `Background Remover`).

### Added - 2026-02-08 (Language Selector & i18n Infra)

#### Seletor de Idioma no Header
- Removido o link "Home" da navbar para reduzir largura e deixar o menu mais enxuto.
- Adicionado seletor de idioma fixo à direita no header usando `mat-form-field` + `mat-select`, disponível em telas desktop.
- Opções de idioma: **English (en)** e **Português (pt)**, com estado atual exibido no select.

#### Internacionalização com ngx-translate
- Adicionadas dependências `@ngx-translate/core` e `@ngx-translate/http-loader` ao frontend.
- Configurado `TranslateModule.forRoot` em `AppModule` com `TranslateHttpLoader` lendo arquivos JSON de `assets/i18n`.
- Criado `LanguageService` responsável por:
  - Registrar idiomas suportados (`en`, `pt`).
  - Ler/gravar a escolha do usuário em `localStorage` (`ai-image-language`).
  - Aplicar o idioma inicial com base no valor salvo ou padrão `en`.
- Header atualizado para usar chaves de tradução:
  - Título da aplicação (`app.title`).
  - Rótulos de navegação (`nav.backgroundRemover`, `nav.imageEnhancement`, `nav.smartCrop`, `nav.help`).
- Layout do header refinado para manter proporção entre logo/navegação e seletor de idioma (altura mínima do toolbar e alinhamento do select com fundo branco e texto na cor primária `#3F51B5`).
- Criados arquivos de tradução:
  - `assets/i18n/en.json` — textos em inglês.
  - `assets/i18n/pt.json` — equivalentes em português.
- Ajustado `angular.json` para aumentar levemente o `maximumError` do budget inicial (`1200kb`), permitindo a inclusão das bibliotecas de i18n sem quebrar o build de produção (mantendo o `maximumWarning` em `500kb`).

### Added - 2026-02-08 (Smart Crop Feature — Complete Implementation)

#### Nova Feature: Smart Crop
Implementada feature completa de crop inteligente com controle manual e detecção AI de áreas importantes.

**Componentes criados:**
- **CropControlsComponent** (`components/crop-controls/`):
  - Interface `CropOptions` (width, height, aspectRatio, autoDetect, x?, y?)
  - Presets de aspect ratio: Custom, 16:9, 4:3, 1:1, 9:16, 3:4
  - Sliders para width/height (100-2000px) com lógica de manutenção de ratio
  - Toggle "Auto-Detect" que desabilita controles manuais quando ativo (`.disabled-section { opacity: 0.4 }`)
  - Botão "Reset All" para restaurar valores padrão
  - Estrutura flex panel-content/body/footer seguindo padrão estabelecido

**CropProcessorComponent** (`components/crop-processor/`):
  - Preview da imagem com overlay visual indicando dimensões do crop (`crop-info`)
  - Badge "AI Auto-Detect Active" quando modo AI está habilitado
  - Indicadores de status (uploading → processing → downloading → complete) com progress bar integrada
  - Comparação lado a lado Original vs Cropped no próprio painel, sem necessidade de painel extra
  - Gerenciamento de memória com `URL.revokeObjectURL()` no `ngOnDestroy`

**SmartCropComponent** (`pages/smart-crop/`):
  - Intro section com gradient background e ícone crop
  - Grid side-by-side (350px controls + 1fr processor) seguindo padrão Image Enhancement
  - 4 info cards quando nenhuma imagem foi carregada (AI Auto-Detect, Multiple Aspect Ratios, Precise Control, Maintain Quality)
  - Orquestração dos componentes com state management local
  - Resultados exibidos no mesmo painel de preview, evitando scroll extra
  - Responsive com grid colapsando para 1 coluna em mobile

**Backend/AI Service:**
- **AI Service** (`ai-service/app.py`):
  - Endpoint `POST /crop` com query params: `width`, `height`, `x`, `y`, `auto_detect`
  - **Auto-detect mode**: Usa OpenCV Haar Cascade para detectar faces (`haarcascade_frontalface_default.xml`)
  - Fallback para centro da imagem quando nenhuma face é detectada ou OpenCV não está disponível
  - Calcula crop box centered no ponto detectado, com ajuste para boundaries da imagem
  - Redimensiona imagem se crop exceder tamanho original (mantém aspect ratio)
  - Retorna PNG otimizado com headers personalizados: `X-Processing-Time`, `X-Crop-Box`, `X-Original-Size`, `X-Cropped-Size`
  - Atualização de statistics (total_processed, model_usage["crop"])

- **Backend Node.js** (`backend/routes/imageRoutes.js` + `backend/services/imageService.js`):
  - Rota `POST /api/images/crop` com validação de imagem
  - Proxy para AI service com timeout de 60s
  - Método `cropImage()` no `ImageService` com tratamento de erros
  - Header `Content-Disposition` com nome de arquivo modificado (`cropped_<filename>.png`)

**Frontend Service:**
- **ImageService** (`image.service.ts`):
  - Interface `CropOptions` exportada (matching backend params)
  - Método `cropImage(file: File, options: CropOptions): Observable<ProcessingResult>`
  - Progress tracking via `HttpEventType` (Upload → Processing → Download → Complete)
  - Mensagens contextuais: "AI detecting important areas..." vs "Cropping image..."
  - Timeout de 2 minutos, error handling com mensagens customizadas

**Routing & Navegação:**
- Rota `/smart-crop` adicionada em `app-routing.module.ts`
- Link "Smart Crop" no header desktop com ícone `crop`
- Link "Smart Crop" no mobile menu (MatMenu)
- Componente registrado no `AppModule` (declarations + imports)

**Home Page Updates:**
- **Card Smart Crop ativado**:
  - Removido badge "Coming Soon"
  - Adicionado `routerLink="/smart-crop"` e botão "Try Now"
  - Feature list: AI auto-detect faces, Multiple aspect ratios, Precise manual control
  - Ícone crop com gradiente purple

- **Novos Cards "Coming Soon"**:
  1. **Face Swap & Style Transfer**:
     - Ícone `face`, descrição: "Swap faces between images and apply artistic styles with advanced neural networks"
     - Badge "Coming Soon", botão disabled

  2. **Image Restoration**:
     - Ícone `restore`, descrição: "Restore old or damaged photos, remove scratches, and colorize black & white images"
     - Badge "Coming Soon", botão disabled

**Arquitetura & Qualidade:**
- Seguiu padrão estabelecido de componentes de apresentação puros
- Comunicação via `@Input/@Output`, sem dependências diretas entre componentes
- Component composition: SmartCropComponent orquestra CropControls + CropProcessor
- Responsive design com breakpoint 768px
- Estilos encapsulados (seguiu mesma estrutura CSS dos outros componentes)
- UX consistente entre Smart Crop e Image Enhancement: botão de ação no painel de settings e resultado no mesmo card de preview

### Refactored - 2026-02-08 (ResultComparisonComponent — DRY)

#### Componente Reutilizável de Comparação de Resultados
- **Novo componente** `ResultComparisonComponent` (`components/result-comparison/`):
  - Encapsula o painel de comparação Before/After com download
  - Inputs configuráveis: `title`, `originalImage`, `resultImage`, `resultTitle`, `originalLabel`, `resultLabel`, `downloadLabel`
  - Output `download` para delegar ação ao componente pai
  - Estilos auto-contidos (comparison layout, responsive, download section)
  - Segue princípio SRP — responsabilidade única de exibir resultado comparativo

- **Remoção de código duplicado**:
  - `image-processor.component.html`: Substituído painel inline de 40 linhas por `<app-result-comparison>`
  - `image-enhancement.component.html`: Substituído painel inline de 35 linhas por `<app-result-comparison>`
  - CSS duplicado removido de `image-processor.component.scss` (~90 linhas) e `image-enhancement.component.scss` (~70 linhas)

- **Registrado** `ResultComparisonComponent` no `AppModule`

- **Auto-scroll para resultado**:
  - `ImageProcessorComponent`: Adicionado método público `scrollToResults()` e `@ViewChild('resultsPanel')`
  - `BackgroundRemoverComponent`: Implementado auto-scroll ao finalizar processamento, scroll suave até painel "Processed Result"
  - Mesma UX do Image Enhancement — após clicar em "Remove Background" e finalizar, tela rola automaticamente para o resultado

### Changed - 2026-02-08 (Image Enhancement Layout)

#### Layout Enhancement — Alinhado ao Fluxo do Smart Crop
- **Painéis lado a lado com altura igual** (`image-enhancement.component.scss`):
  - Grid com `align-items: stretch` para que "Enhancement Settings" e "AI Image Enhancement" ocupem alturas compatíveis
  - Removida altura fixa para manter responsividade
  - Layout responsivo herdado do padrão usado em Smart Crop

- **Enhancement Settings** (`enhancement-controls`):
  - Conteúdo organizado em `panel-content` > `panel-body` + `panel-footer`
  - Botão principal **"Enhance Image"** movido para o painel de settings
  - Botão "Reset All" mantido fixo na parte inferior do painel via `margin-top: auto`
  - Inputs adicionais `isProcessing` e `hasImage` controlam habilitação dos botões

- **AI Image Enhancement** (`enhancement-processor`):
  - Card único exibindo primeiro o preview e, após o processamento, a comparação Original vs Enhanced no mesmo espaço
  - Imagens usam `object-fit: contain` para se adaptar ao espaço disponível sem distorção
  - Barra de progresso e mensagens de status exibidas no footer do próprio card durante o processamento
  - Botão único **"Download Enhanced Image"** exibido apenas quando há resultado disponível

- **UX Atualizada (sem auto-scroll e sem painel extra)**:
  - O painel "Enhanced Result" separado foi removido; a comparação agora ocorre no mesmo card de preview
  - Removido o auto-scroll para o resultado; o usuário permanece no contexto do grid principal
  - Fluxo visual e de interação agora espelha o Smart Crop (ação no settings, resultado no painel da direita)

#### UX Extra — Auto-scroll após Upload
- Ao fazer upload de uma nova imagem na página de Image Enhancement, a tela realiza um scroll suave até a seção principal de enhancement (controles + preview), garantindo que o usuário já fique posicionado onde irá ajustar e processar a imagem.

### Changed - 2026-02-08 (Background Remover Layout & UX Alignment)

#### Página Background Remover — Layout em Grid
- **Reorganização da página** (`background-remover.component.html/.scss`):
  - `Upload Your Image` permanece logo abaixo do título, como primeira etapa do fluxo.
  - Após o upload, é exibido um grid de duas colunas (`remover-grid`):
    - Coluna esquerda: painel "Select AI Model Quality" (`app-model-selector`).
    - Coluna direita: painel "AI Background Removal" (`app-image-processor`).
  - Ambos os painéis ocupam a mesma altura, alinhando visualmente controles e preview/resultado, no mesmo padrão de Image Enhancement e Smart Crop.

#### Model Selector — Botão Principal de Ação
- **ModelSelectorComponent** (`components/model-selector/`):
  - Adicionados inputs `hasImage` e `isProcessing` e output `removeBackground`.
  - Template agora possui `panel-content` com corpo + `panel-footer` contendo um botão principal **"Remove Background"**.
  - O botão fica desabilitado enquanto não há imagem carregada ou enquanto o processamento está em andamento, exibindo o rótulo "Processing..." durante a execução.
  - O clique no botão emite `removeBackground`, que delega a chamada de processamento ao `BackgroundRemoverComponent`.

#### Image Processor — Preview e Resultado no Mesmo Card
- **ImageProcessorComponent** (`components/image-processor/`):
  - Refatorado o layout para usar o mesmo padrão do `EnhancementProcessorComponent`:
    - Header dinâmico que alterna entre "AI Background Removal" e "Background Removal Results" conforme exista resultado.
    - Área central que exibe apenas o preview enquanto não há resultado e, após o processamento, passa a mostrar a comparação **Original vs Background Removed** no mesmo espaço.
  - Barra de progresso, ícones de status e porcentagem agora ficam em um footer interno do card durante o processamento.
  - Botão **"Download Processed Image"** único e full-width exibido quando há resultado e não está processando.
  - Removido o uso de `ResultComparisonComponent` aqui; a comparação é feita inline.
  - Removido `scrollToResults()` e o `ViewChild` associado, já que não existe mais painel de resultados separado.

#### BackgroundRemoverComponent — Fluxo e Auto-scroll
- **BackgroundRemoverComponent** (`pages/background-remover/`):
  - Em `onImageUploaded`, além de armazenar o arquivo, os resultados anteriores do `ImageProcessorComponent` são resetados.
  - Após o upload, a página realiza **auto-scroll suave** até o grid principal (`backgroundSection`), posicionando o usuário diretamente na área com o seletor de modelo e o preview.
  - Em `onImageRemoved`, a imagem e os resultados processados são limpos e o estado `isProcessing` é resetado.
  - `onProcessingComplete` deixa de chamar `scrollToResults()`, pois o resultado já aparece no mesmo card de preview.

#### Observação — ResultComparisonComponent
- O `ResultComparisonComponent` permanece disponível como componente reutilizável de comparação para fluxos futuros, mas os módulos principais (Background Remover, Image Enhancement e Smart Crop) passaram a usar comparações inline dentro dos próprios painéis de processamento para uma experiência mais direta e consistente.

### Added - 2026-02-07 (Image Enhancement Feature)

#### Image Enhancement — Full Stack Implementation
- **AI Service** (`ai-service/app.py`):
  - Novo endpoint `POST /enhance` com parâmetros: `brightness`, `contrast`, `saturation`, `sharpness` (0.0–3.0), `auto_enhance` e `denoise`
  - **Auto Enhance**: Analisa histograma de brilho da imagem e aplica otimizações automáticas (brightness, contrast, saturation, sharpness + denoise)
  - **Manual mode**: Ajuste fino com sliders individuais
  - **Noise Reduction**: Filtro mediano (MedianFilter) para redução de ruído
  - Usa `PIL.ImageEnhance` (Brightness, Contrast, Color, Sharpness) e `PIL.ImageFilter`
  - Headers de resposta: `X-Processing-Time`, `X-Enhancements`, `X-Original-Size`, `X-Processed-Size`
  - Adicionado `opencv-python-headless` ao `requirements.txt`
  - Atualizado root endpoint para v3.0.0 com novo endpoint `/enhance`

- **Backend** (`backend/routes/imageRoutes.js` + `backend/services/imageService.js`):
  - Nova rota `POST /api/images/enhance` com query params para controles de enhancement
  - Novo método `enhanceImage()` no `imageService` para proxy ao AI service
  - Validação de imagem e error handling consistentes com rota de background removal

- **Frontend — Componentes**:
  - `EnhancementControlsComponent`: Painel colapsável com sliders (brightness, contrast, saturation, sharpness), toggle Auto Enhance, toggle Noise Reduction e botão Reset
    - Sliders desabilitados quando Auto Enhance está ativo
    - Usa `mat-slider`, `mat-slide-toggle`, `mat-expansion-panel`
  - `EnhancementProcessorComponent`: Preview da imagem, botão "Enhance Image", progress bar com status, painel de resultado com comparação Before/After e download

- **Frontend — Página e Navegação**:
  - `ImageEnhancementComponent` (page): Orquestra upload, controles e processamento
  - Rota `/image-enhancement` em `app-routing.module.ts`
  - Link de navegação no header (desktop + mobile menu)
  - Card na Home atualizado de "Coming Soon" para "Try Now" com routerLink
  - `MatSliderModule` e `MatSlideToggleModule` adicionados ao `AppModule`

- **Frontend — Service**:
  - Nova interface `EnhancementOptions` no `ImageService`
  - Novo método `enhanceImage()` com upload progress, processing status e download tracking
  - Timeout de 120s para enhancement

### Added - 2026-02-07 (Developer Experience)

#### Docker Compose Profiles (Dev/Prod)
- **Profiles system**: Adicionado suporte a profiles (`dev` e `prod`) no `docker-compose.yml` para gerenciar ambientes de desenvolvimento e produção em um único arquivo
  - `docker compose --profile dev up -d` → Sobe ambiente de desenvolvimento com live reload
  - `docker compose --profile prod up -d` → Sobe ambiente de produção com build otimizado
- **Frontend Dev Service** (`frontend-dev`): Container com `node:18-alpine` executando `ng serve` com:
  - `--poll 2000` para detecção de mudanças em volumes Docker
  - `--live-reload true` para atualização automática no browser
  - Volume mount do código-fonte (`./frontend:/app`)
  - Volume nomeado `frontend_node_modules` para persistência de dependências
- **Nginx Dev Service** (`nginx-dev`): Configuração dedicada para desenvolvimento com:
  - Upstream apontando para `frontend-dev:4200` (Angular dev server)
  - Suporte a WebSocket (`/ng-cli-ws`) para live reload
  - Proxy reverso transparente para API e AI service
- **Arquivo `nginx/default.dev.conf`**: Configuração Nginx específica para dev com proxy WebSocket
- **Removidos arquivos extras**: Eliminados `Dockerfile.dev` e `docker-compose.dev.yml` — tudo consolidado no compose principal via profiles
- **Serviços compartilhados**: `backend` e `ai-service` rodam em ambos os modos (sem profile)

### Improved - 2026-02-07 (UX Enhancement)

#### Image Uploader UX
- **Drop zone auto-hide**: A área de upload (drag & drop + botão "Choose File") agora é escondida automaticamente quando uma imagem é carregada
  - Ao carregar uma imagem, apenas o card com nome do arquivo e botão de remover (X) é exibido
  - Ao clicar no X para remover a imagem, a drop zone reaparece
  - Implementado via `*ngIf="!selectedFile"` no `<ngx-file-drop>`

### Refactored - 2026-02-07 (Frontend Architecture & Styling)

#### Component File Separation
- **AppComponent**: Extracted inline `template` and `styles` to dedicated `app.component.html` and `app.component.scss` files
- **Image Uploader Styling**: Migrated `ngx-file-drop` style overrides from component-level `::ng-deep` to global `styles.scss` for proper specificity
  - Removed duplicate `.file-drop-zone` styles from both `styles.scss` and component SCSS
  - Removed `class="file-drop-zone"` from HTML template to eliminate double border
  - Fixed upload icon being cut off by `overflow: hidden` — changed to `overflow: visible`
  - Increased upload icon size to 64px with proper centering
  - Improved "Choose File" button appearance with rounded corners and better padding
  - Added subtle background (`#fafafa`) and hover effect (`#ede7f6`) to drop zone

#### Multi-Page Navigation System
- **Angular Routing**: Created `app-routing.module.ts` with routes:
  - `/` → `HomeComponent`
  - `/background-remover` → `BackgroundRemoverComponent`
  - `/help` → `HelpComponent`
  - `**` → redirect to `/`
- **New Pages**:
  - `HomeComponent`: Landing page with feature cards, "How It Works" steps, and "Coming Soon" placeholders
  - `HelpComponent`: Documentation and FAQ page with `mat-accordion`
  - `BackgroundRemoverComponent`: Encapsulates full background removal workflow (model selection, upload, processing)
- **Header Navigation**: Refactored header with `routerLink` navigation links and responsive mobile `mat-menu`
- **AppComponent Shell**: Simplified to `<app-header>`, `<router-outlet>`, `<app-footer>`

### Fixed - 2026-02-07 (Performance & Timeout Improvements)

#### ISNet Alpha Matting Timeout Issue
- **Problem**: First request with `isnet-general-use` model took ~56 seconds (alpha matting initialization)
  - Caused 503 Service Unavailable errors on first premium quality processing
  - User experience: Appeared as endpoint error
  
- **Solution Implemented**:
  1. **Frontend Timeout Extension** (`frontend/src/app/services/image.service.ts`):
     - Added dynamic timeout based on model selection
     - Standard (u2net): 120s (2 minutes)
     - Premium (isnet-general-use): 180s (3 minutes)
     - Imported RxJS `timeout` operator for proper timeout handling
  
  2. **AI Service Alpha Matting Warm-up** (`ai-service/app.py`):
     - Added dedicated warm-up for alpha matting parameters on startup
     - Pre-initializes scipy and alpha matting algorithms
     - Eliminates 56s delay on first premium quality request
     - Warm-up runs with full alpha matting configuration:
       - `alpha_matting=True`
       - `foreground_threshold=240`
       - `background_threshold=10`
       - `erode_size=10`
       - `post_process_mask=True`
  
  3. **Enhanced Progress Feedback** (`frontend/src/app/services/image.service.ts`):
     - Added `HttpEventType.Sent` handler: Shows "Processing with Premium Quality (Alpha Matting)..." message
     - Added `HttpEventType.DownloadProgress` handler: Shows result download progress (35-100%)
     - Better user feedback during long-running premium processing
     - Model-specific messages to set user expectations

- **Performance Impact**:
  - First ISNet request: From 56s → ~1s (after warm-up)
  - Subsequent requests: Maintained at ~0.85-1.0s
  - U²-Net performance: Unchanged (~0.3-0.5s)

### Added - 2026-02-07 (feature/initial-project)

#### Core Frontend Structure
- **Header and Footer Components**: Implemented `HeaderComponent` and `FooterComponent` to provide a consistent layout and branding across the application.
  - Located: `frontend/src/app/components/header/` and `frontend/src/app/components/footer/`

#### Initial Project Setup
- **Angular Application**: Initialized the frontend application using Angular v17.
- **Angular Material**: Integrated the Angular Material library for UI components.

#### Frontend Components
- **Model Selector Component**: New component for AI model selection before image upload
  - User can choose between Standard (U²-Net) and Premium (ISNet) quality models
  - Clean Material Design interface with model descriptions
  - Radio button selection with visual feedback
  - Disabled state during processing
  - Located: `frontend/src/app/components/model-selector/`

- **Image Uploader Enhancement**
  - Added `imageRemoved` event emitter for proper cleanup
  - Improved file removal with complete state reset
  - Better notification messages

- **Image Processor Enhancement**  
  - Added `selectedModel` input parameter
  - Dynamic model selection passed to backend API
  - Processing with user-selected AI model

#### Backend Services
- **Multi-Model Support**
  - Backend routes now accept `model` query parameter
  - `POST /api/images/remove-background?model=u2net` endpoint updated
  - Model parameter passed through to AI service
  - Improved logging with model information

- **Service Layer Enhancement**
  - `imageService.js` updated to support model parameter
  - Better error handling and logging
  - Model information included in AI service requests

#### AI Service (Complete Refactoring)
- **Multi-Model Architecture**
  - Support for multiple AI models: `u2net` (standard) and `isnet-general-use` (premium)
  - Global sessions dictionary for efficient model management
  - Lazy loading and warm-up for both models
  - Model selection via query parameter: `?model=u2net` or `?model=isnet-general-use`

- **Enhanced Image Processing**
  - **ISNet Premium Quality**: Alpha matting with advanced parameters
    - `alpha_matting=True`
    - `alpha_matting_foreground_threshold=240`
    - `alpha_matting_background_threshold=10`
    - `alpha_matting_erode_size=10`
    - `post_process_mask=True`
  - **U²-Net Standard**: Fast processing for simple backgrounds
  - Automatic format detection and conversion (RGB/RGBA handling)

- **Statistics Tracking**
  - Per-model usage statistics
  - Total processing time tracking
  - Average processing time calculation
  - Error rate monitoring
  - Memory usage reporting

- **API Improvements**
  - Enhanced `/health` endpoint with loaded models list
  - Improved `/` root endpoint with model details and features
  - Better error messages with model validation
  - Processing time headers in responses

#### Dependencies
- **Frontend**
  - Added `MatRadioModule` to Angular Material imports
  - Updated module declarations with new components

- **Backend**
  - No new dependencies (using existing packages)

- **AI Service**  
  - Added `scipy` to requirements.txt for alpha matting support
  - Updated rembg configuration to support multiple models

### Fixed - 2026-02-07

#### Critical Bug Fixes
- **Nginx 500 Error (Infinite Redirect Loop)**
  - **Issue**: Nginx was combining `try_files` with `proxy_pass`, causing infinite redirects
  - **Root Cause**: `proxy_pass http://backend/;` with trailing slash was stripping `/api/` prefix
  - **Solution**: Removed trailing slash: `proxy_pass http://backend;`
  - **Impact**: Application now accessible at http://localhost without errors

- **API Routing 404**
  - **Issue**: Backend routes expecting `/api/images/remove-background` but receiving `/images/remove-background`
  - **Root Cause**: Nginx `location /api/` with `proxy_pass http://backend/` was stripping the prefix
  - **Solution**: Changed to `proxy_pass http://backend;` to preserve full path
  - **Impact**: All API endpoints now work correctly

- **Image Upload Bug (State Management)**
  - **Issue**: Clicking ❌ to remove uploaded image didn't clear AI processing results
  - **Root Cause**: No event propagation from uploader to parent component
  - **Solution**: 
    - Added `imageRemoved` EventEmitter in `ImageUploaderComponent`
    - Added `onImageRemoved()` handler in `AppComponent`
    - Properly resets `uploadedImage` and `isProcessing` state
  - **Impact**: Complete UI reset when removing image

- **OpenCV Import Error in AI Service**
  - **Issue**: `ModuleNotFoundError: No module named 'cv2'` on startup
  - **Root Cause**: Unused import statement in app.py
  - **Solution**: Removed `import cv2` (not needed by rembg)
  - **Impact**: AI service starts cleanly without OpenCV system dependencies

#### Configuration Improvements
- **Nginx Configuration**
  - Removed problematic `try_files` directive from `/` location
  - Added proper proxy headers for WebSocket support (Upgrade, Connection)
  - Maintained 50MB upload limit and 300s timeouts
  - Clean separation between frontend SPA and API proxy

### Changed - 2026-02-07

#### Architecture & Code Quality
- **Clean Architecture Implementation**
  - Separated concerns across all layers (Frontend, Backend, AI Service)
  - Single Responsibility Principle applied to all components
  - Dependency Inversion with proper abstractions
  - Event-driven communication between components

- **AI Service Refactoring**
  - Complete rewrite from single-model to multi-model architecture
  - Changed from global `rembg_session` to `rembg_sessions` dictionary
  - Improved lifespan management with proper initialization
  - Better error handling with specific HTTP status codes
  - Enhanced logging with structured information

- **Component Communication**
  - Parent-child component communication via EventEmitters
  - Proper state management in AppComponent
  - Unidirectional data flow (props down, events up)

#### Performance Optimizations
- **Model Loading**
  - Both models loaded once at startup and kept in memory
  - Warm-up process for faster first request
  - Session reuse eliminates redundant model loading
  
- **Image Processing**
  - User can choose fast (u2net) vs quality (isnet) based on needs
  - Conditional alpha matting only for premium model
  - Optimized PNG output with compression

#### User Experience
- **Visual Feedback**
  - Model selection UI with quality badges (Standard/Premium)
  - Icon indicators for each model (flash_on / auto_awesome)  
  - Detailed model descriptions for informed choice
  - Processing status with selected model information

- **Error Messages**
  - More descriptive error messages with context
  - Model validation errors specify available models
  - Clear health check status with loaded models list

### Documentation

#### Code Documentation
- Comprehensive JSDoc comments in backend services
- Type definitions and interfaces in TypeScript
- Detailed docstrings in Python AI service
- Inline comments for complex logic

#### API Documentation
- AI Service now reports available models and features
- Health endpoint shows loaded models status
- Stats endpoint includes per-model usage metrics

### Technical Debt Addressed
- ✅ Removed unused dependencies (cv2/opencv-python)
- ✅ Fixed inconsistent variable naming (rembg_session vs rembg_sessions)
- ✅ Eliminated code duplication in AI processing
- ✅ Improved error handling consistency across services
- ✅ Better separation of concerns in all layers

### Known Issues
- [ ] Frontend bundle size exceeds budget (676KB vs 500KB recommended)
  - Consider lazy loading for Material modules
  - Implement code splitting for routes
  - Optimize image assets and fonts

### Migration Notes
For developers updating from previous version:
1. Frontend: Run `npm install` to ensure dependencies are up to date
2. Backend: No changes required
3. AI Service: New models will download on first startup (~355MB total)
   - u2net.onnx: ~176MB
   - isnet-general-use.onnx: ~179MB
4. Nginx: Configuration has been updated, restart required

### Performance Metrics
- **Model Loading Time**: ~10-15 seconds on first startup
- **Standard Model (u2net)**: ~0.3-0.5 seconds per image
- **Premium Model (isnet-general-use)**: ~0.8-1.5 seconds per image
- **Memory Usage**: ~1.5-2GB with both models loaded

---

## [1.0.0] - 2026-02-07

### Added
- Initial project setup with Docker microservices architecture
- Node.js backend with Express (port 3001)
- Angular 17 frontend with Material Design (port 4200)
- Python FastAPI AI service with U²-Net model (port 5000)
- Nginx reverse proxy (port 80/443)
- Complete image background removal pipeline
- RESTful API endpoints
- File upload with validation (max 50MB)
- Streaming image processing
- Health check endpoints for all services
- Error handling and logging
- Material Design UI components
- Drag-and-drop file upload
- Image preview and comparison view
- Download processed images
- Docker Compose orchestration
- Volume persistence for AI models
- Custom Docker network for inter-service communication

### Infrastructure
- Docker containers for each service (frontend, backend, ai-service, nginx)
- Environment variables configuration
- Nginx reverse proxy with proper routing
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Security headers (Helmet.js)
- Request compression
- Health monitoring endpoints

---

## Project Information

**Repository**: imagesProccess  
**Branch**: feature/initial-project  
**Tech Stack**: 
- Frontend: Angular 17 + Material Design
- Backend: Node.js 18 + Express
- AI Service: Python 3.11 + FastAPI + rembg
- Infrastructure: Docker + Nginx
- AI Models: U²-Net, ISNet-General-Use

**Contributors**: capecci  
**Date**: February 7, 2026
