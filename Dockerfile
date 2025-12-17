FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Instala dependências do sistema
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o projeto
COPY . .

# Cria utilizador e pastas com permissões corretas
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app /app/data

USER appuser

# ✅ GUNICORN COM TIMEOUT: Evita que a app seja reiniciada por lentidão no pandas/sklearn
CMD ["gunicorn", "tammysclara_project.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]