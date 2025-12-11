# Usa uma imagem oficial do Python, ideal para Fly.io
FROM python:3.11-slim

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Evita buffer
ENV PYTHONUNBUFFERED=1

# Instala dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o projeto
COPY . .

# ----------------------------------------------------------
# 🔥 CORREÇÃO OBRIGATÓRIA PARA O FLY.IO:
# Cria um usuário não-root e muda o contexto de execução
# ----------------------------------------------------------
RUN adduser --disabled-password appuser
USER appuser

# Comando correto
CMD ["gunicorn", "tammysclara_project.wsgi:application", "--bind", "0.0.0.0:8000"]
