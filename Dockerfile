# Imagem base
FROM python:3.11-slim

# Variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 8000

# Diretório de trabalho
WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código
COPY . .

# Configurações de usuário e permissões
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app && \
    chown -R appuser:appuser /app/data

# Troca para o usuário seguro
USER appuser

# Expondo a porta
EXPOSE 8000

# Comando para rodar o servidor
CMD ["gunicorn", "tammysclara_project.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]