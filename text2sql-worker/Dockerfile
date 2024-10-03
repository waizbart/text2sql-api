FROM nvidia/cuda:12.4.0-runtime-ubuntu22.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir --upgrade pip

RUN pip3 install --no-cache-dir \
    torch==2.4.1+cu124 \
    torchvision \
    torchaudio \
    --extra-index-url https://download.pytorch.org/whl/cu124

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ./ /app

RUN mkdir -p /app/offload_folder

ENV MODEL_PATH=/models/Chat2DB-SQL-7B

CMD ["celery", "-A", "tasks", "worker", "--loglevel=info", "--pool=solo"]
