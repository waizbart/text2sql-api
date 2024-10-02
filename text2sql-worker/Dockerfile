FROM nvidia/cuda:11.7.1-cudnn8-runtime-ubuntu20.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir --upgrade pip

RUN pip3 install --no-cache-dir \
    torch==2.0.1+cu117 \
    torchvision \
    torchaudio \
    --extra-index-url https://download.pytorch.org/whl/cu117

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ./ /app

ENV MODEL_PATH=/models/Chat2DB-SQL-7B

CMD ["celery", "-A", "tasks", "worker", "--loglevel=info"]
