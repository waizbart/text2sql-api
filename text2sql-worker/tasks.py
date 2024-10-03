import os
import sys
import torch
import redis
from celery import Celery
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import logging

# Configuração do logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Celery('tasks')
app.config_from_object('celeryconfig')

redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_client = redis.Redis(host=redis_host, port=6379, db=0)

model_path = os.getenv('MODEL_PATH', '../models/Chat2DB-SQL-7B')

try:
    logger.info("Carregando modelo e tokenizer...")

    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        trust_remote_code=True,
        device_map="auto",
        offload_folder='offload_folder',
        torch_dtype=torch.float16, 
        max_memory={
		0: '10GB',
		"cpu": '12GB'
	} 
    )
    tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)

    text_pipeline = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=100,
        return_full_text=False
    )

    logger.info("Modelo carregado com sucesso.")
except Exception as e:
    logger.error(f"Erro ao carregar o modelo ou tokenizer: {str(e)}")
    sys.exit(1)
    
@app.task(bind=True, name='tasks.process_prompt')
def process_prompt(self, taskId, prompt):
    try:
        logger.info(f"Task {taskId}: Iniciando processamento.")
        redis_client.hset(f'task:{taskId}', 'status', 'processing')

        logger.info(f"Task {taskId}: Gerando texto com o modelo.")
        generated_text = text_pipeline(
            prompt, pad_token_id=text_pipeline.tokenizer.eos_token_id
        )[0]['generated_text']

        select_index = generated_text.upper().find("SELECT")
        if select_index != -1:
            formatted_text = generated_text[select_index:]
            logger.info(f"Task {taskId}: Texto gerado com sucesso: {formatted_text}.")
        else:
            formatted_text = generated_text
            logger.warning(f"Task {taskId}: SQL gerado invalido.")

        redis_client.hset(
            f'task:{taskId}',
            mapping={'status': 'completed', 'generatedSQL': formatted_text}
        )
        logger.info(f"Task {taskId}: Status atualizado para 'completed'.")
    except Exception as e:
        redis_client.hset(
            f'task:{taskId}',
            mapping={'status': 'error', 'error': str(e)}
        )
        logger.error(f"Erro ao processar taskId {taskId}: {str(e)}")
