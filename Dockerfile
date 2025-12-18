FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt
COPY . .
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/data /app/staticfiles /app/data/media && \
    chown -R appuser:appuser /app /app/data
RUN python manage.py collectstatic --noinput
USER appuser
EXPOSE 8000
# ✅ BIND DIRETO: Sem variáveis, direto no 0.0.0.0
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "tammysclara_project.wsgi:application"]