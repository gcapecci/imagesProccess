# 🚀 Como Executar o Projeto

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Git (para clonar o repositório)
- Pelo menos 4GB de RAM livre
- Conexão com internet (para download de modelos AI)

## ⚡ Execução Rápida

```bash
# 1. Navegar para o diretório do projeto
cd /home/capecci/ImagesProcess/imagesProccess

# 2. Executar todos os serviços
docker-compose up --build

# 3. Aguardar inicialização (primeira vez demora mais para baixar modelos)
# Logs indicarão quando todos os serviços estiverem prontos

# 4. Acessar a aplicação
# Frontend: http://localhost
# Backend API: http://localhost/api
# AI Service: http://localhost/ai
# Direct AI Service: http://localhost:5000
```

## 🔧 Configuração Detalhada

### 1. Estrutura de Portas
- **Nginx (Proxy)**: `80` e `443`
- **Frontend Angular**: `4200` (interno)
- **Backend Node.js**: `3001` (interno)  
- **AI Service Python**: `5000` (interno + externa)

### 2. Variáveis de Ambiente

#### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
AI_SERVICE_URL=http://ai-service:5000
FRONTEND_URL=http://localhost:4200
```

#### AI Service
```bash
PORT=5000
MODEL=u2net
ENVIRONMENT=production
```

### 3. Volumes Docker
- `ai-models`: Cache de modelos AI (evita re-download)
- Código fonte montado para desenvolvimento

## 📊 Testando a API

### Health Checks
```bash
# Backend
curl http://localhost/api/health

# AI Service  
curl http://localhost/ai/health

# Stats do AI Service
curl http://localhost/ai/stats
```

### Upload de Imagem
```bash
# Via curl (teste)
curl -X POST \
  http://localhost/api/images/remove-background \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/your/image.jpg"
```

## 🐳 Comandos Docker Úteis

```bash
# Parar todos os serviços
docker-compose down

# Rebuild apenas um serviço  
docker-compose up --build ai-service

# Ver logs de um serviço específico
docker-compose logs -f backend

# Limpar volumes (re-download modelos)
docker-compose down -v

# Executar em background
docker-compose up -d
```

## 🔍 Debugging

### Logs dos Serviços
```bash
# Todos os logs
docker-compose logs -f

# Apenas AI Service
docker-compose logs -f ai-service

# Apenas Backend
docker-compose logs -f backend
```

### Problemas Comuns

**1. AI Service demora para inicializar**
- Primeira execução baixa modelos (~1-2GB)
- Aguardar mensagem "Model loaded successfully!"

**2. Out of Memory**
- Aumentar RAM disponível para Docker
- Ou usar modelo menor: `u2netp` ao invés de `u2net`

**3. Permissões de arquivo**
```bash
sudo chown -R $USER:$USER .
```

**4. Porta em uso**
```bash
# Verificar portas ocupadas
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :5000
```

## 🚀 Deploy em Produção

### 1. Configurações de Produção
- Configurar domínio no Nginx
- Adicionar certificados SSL
- Ajustar limites de upload
- Configurar monitoring

### 2. Variáveis de Ambiente Produção
```bash
# .env.production
NODE_ENV=production
AI_SERVICE_URL=http://ai-service:5000
FRONTEND_URL=https://yourdomain.com
```

### 3. Docker Compose Produção
```bash
# docker-compose.prod.yml
version: '3.8'
services:
  nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl
  # ... outros serviços
```

## 📈 Monitoramento

### Métricas Disponíveis
- `/api/stats` - Estatísticas do backend
- `/ai/stats` - Estatísticas do serviço AI
- Logs estruturados para análise

### Health Checks
- `/api/health` - Saúde do backend
- `/ai/health` - Saúde do AI service
- Verificação automática entre serviços

## 🎯 Próximos Passos

1. **Implementar autenticação** (JWT tokens)
2. **Adicionar cache Redis** para resultados
3. **Configurar CI/CD pipeline**  
4. **Implementar rate limiting** avançado
5. **Adicionar modelos AI customizados**
6. **Dashboard de analytics**
7. **API documentation** com Swagger

---

## 💡 Dicas de Performance 

- **GPU**: Para máxima performance, configurar GPU NVIDIA
- **Caching**: Implementar cache de imagens processadas
- **CDN**: Usar CDN para arquivos estáticos
- **Load Balancer**: Multiple instâncias do AI service
- **Compression**: Gzip habilitado no Nginx

---

**🎉 Projeto pronto para uso!** 

O sistema está configurado para escalabilidade e pode processar múltiplas imagens simultaneamente com boa performance.