# Usa uma imagem oficial do Python, ideal para Fly.io
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ----------------------------------------------------------
# Criar usuário não-root
# ----------------------------------------------------------
RUN adduser --disabled-password appuser

# ----------------------------------------------------------
# Ajustar permissões do projeto inteiro
# ----------------------------------------------------------
RUN mkdir -p /app/staticfiles && \
    mkdir -p /app/data/media && \
    chown -R appuser:appuser /app

USER appuser

CMD ["gunicorn", "tammysclara_project.wsgi:application", "--bind", "0.0.0.0:8000"]
