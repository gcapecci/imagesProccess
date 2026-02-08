FROM python:3.11-slim

# Instalar dependências básicas
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar requirements
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fonte
COPY . .

# Criar diretório para modelos
RUN mkdir -p models

# Expor porta
EXPOSE 5000

# Comando para iniciar aplicação
CMD ["python", "app.py"]