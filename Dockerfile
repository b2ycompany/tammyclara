FROM python:3.11-slim

WORKDIR /app

# Variáveis de ambiente críticas
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

# Instala dependências do sistema para bibliotecas de imagem e banco de dados
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Instala dependências Python (pandas, sklearn, etc)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o projeto integralmente
COPY . .

# Cria utilizador de segurança e garante permissões nos volumes e estáticos
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app /app/data

USER appuser

# ✅ EXPOSE e CMD corrigidos para escuta global obrigatória em 0.0.0.0
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "tammysclara_project.wsgi:application"]