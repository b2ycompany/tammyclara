# Usa uma imagem oficial do Python, ideal para Fly.io
FROM python:3.11-slim

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Evita buffer
ENV PYTHONUNBUFFERED 1

# Instala dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o projeto (como root)
COPY . .

# Cria o utilizador 'appuser'
RUN adduser --disabled-password appuser

# ✅ CORREÇÃO CRÍTICA FINAL: Concede ao 'appuser' a propriedade sobre o diretório /app.
# Isso permite que o collectstatic e uploads de media (em /app/data) funcionem.
RUN chown -R appuser:appuser /app

# Muda para o utilizador não-root
USER appuser

# Comando Gunicorn
CMD ["gunicorn", "tammysclara_project.wsgi:application", "--bind", "0.0.0.0:8000"]