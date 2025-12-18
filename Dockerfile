FROM python:3.11-slim

WORKDIR /app

# Variáveis para evitar travamento de logs e bytecode
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Instalação de dependências de sistema essenciais
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Instalação das bibliotecas Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Cópia integral do projeto
COPY . .

# Criação do usuário e garantia de permissões em volumes e estáticos
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app /app/data

USER appuser

# ✅ EXPOSE: Informa ao Fly qual porta abrir
EXPOSE 8000

# ✅ BIND: Garante que o servidor aceite conexões de fora do container
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "tammysclara_project.wsgi:application"]