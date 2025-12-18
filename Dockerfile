FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Instala dependências de sistema essenciais
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Instala bibliotecas Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código completo respeitando a estrutura do print
COPY . .

# Cria usuário e garante permissões em volumes e estáticos
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app /app/data

USER appuser

# ✅ EXPOSE E CMD CORRIGIDOS: Aponta para tammysclara_project.wsgi
EXPOSE 8000
CMD ["gunicorn", "tammysclara_project.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "120"]