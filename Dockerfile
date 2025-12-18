FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Instala dependências de sistema
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código completo
COPY . .

# Cria usuário e garante permissões
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app /app/data

USER appuser

# ✅ EXPOSE: Porta 8000 para Django e 8081 para Health Check
EXPOSE 8000
EXPOSE 8081

# ✅ CMD: Inicia o servidor de saúde em background e o Gunicorn em foreground
CMD sh -c "python health.py & gunicorn tammysclara_project.wsgi:application --bind 0.0.0.0:8000 --workers 2 --threads 4 --timeout 120"