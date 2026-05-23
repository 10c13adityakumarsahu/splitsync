# Dockerfile for Backend
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/
# (Since we didn't export requirements.txt, let's create a minimal one during run or just install directly)
RUN pip install django djangorestframework djangorestframework-simplejwt django-cors-headers

COPY backend/ /app/

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
