FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

# Instala dependências de sistema
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia o código completo
COPY . .

# Garante permissões e usuário
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app /app/data

# Estáticos no Build
RUN python manage.py collectstatic --noinput

USER appuser

# ✅ EXPOSE explícito
EXPOSE 8000

# ✅ COMANDO DE FORÇA BRUTA: Bind em todas as interfaces (0.0.0.0)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "120", "tammysclara_project.wsgi:application"]