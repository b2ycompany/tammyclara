FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Dependências do sistema
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia projeto
COPY . .

# Permissões
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app /app/data

USER appuser

EXPOSE 8000

# ✅ COMANDO CORRIGIDO: Garante bind em 0.0.0.0 (rede externa) na porta 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "tammysclara_project.wsgi:application"]