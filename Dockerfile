# Usa uma imagem oficial do Python, ideal para Fly.io
FROM python:3.11-slim

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Evita buffer
ENV PYTHONUNBUFFERED 1

# Instala dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o projeto
COPY . .

# CORREÇÃO CRÍTICA: Cria e muda para o utilizador não-root 'appuser'
# Isso resolve o problema de o Fly.io matar o processo que está a correr como root.
RUN adduser --disabled-password appuser
USER appuser

# Comando Gunicorn
CMD ["gunicorn", "tammysclara_project.wsgi:application", "--bind", "0.0.0.0:8000"]