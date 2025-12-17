FROM python:3.11-slim

WORKDIR /app

# Variáveis de ambiente para Python
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PORT 8000

# Instala dependências do sistema necessárias para o psycopg2 e pillow
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código completo
COPY . .

# Cria utilizador e garante permissões no volume de dados e pasta de estáticos
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app /app/data

# Muda para o utilizador de segurança
USER appuser

# Expondo a porta correta
EXPOSE 8000

# ✅ CORREÇÃO DEFINITIVA: Bind explícito para aceitar tráfego do Fly Proxy
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "tammysclara_project.wsgi:application"]