# Usa uma imagem oficial do Python, ideal para Fly.io
FROM python:3.11-slim

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Define a variável de ambiente para que o Python não armazene cache
ENV PYTHONUNBUFFERED 1

# Copia e instala as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código do projeto
COPY . .

# Comando que será executado quando o contêiner iniciar
CMD ["gunicorn", "tammysclara_project.wsgi:application", "--bind", "0.0.0.0:8000"]