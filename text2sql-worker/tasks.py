from celery import Celery
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import redis
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Celery('tasks')
app.config_from_object('celeryconfig')

redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_client = redis.Redis(host=redis_host, port=6379, db=0)

model_path = os.getenv('MODEL_PATH', '../models/Chat2DB-SQL-7B')

logger.info("Carregando o modelo e o tokenizer")
tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True, legacy=False)
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    trust_remote_code=True,
    torch_dtype=torch.float16,
    device_map='auto',
    offload_folder='offload'
)
text_pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=100
)
logger.info("Modelo e tokenizer carregados com sucesso")

@app.task(bind=True, name='tasks.process_prompt')
def process_prompt(self, taskId, prompt):
    try:
        logger.info(f"Processando task: {taskId}")
        
        redis_client.hset(f'task:{taskId}', 'status', 'processing')
        generated_text = text_pipeline(prompt, pad_token_id=tokenizer.eos_token_id)[0]['generated_text']

        redis_client.hset(f'task:{taskId}', mapping={'status': 'completed', 'generatedSQL': generated_text})

        logger.info(f"Tarefa {taskId} concluída")
    except Exception as e:
        redis_client.hset(f'task:{taskId}', mapping={'status': 'error', 'error': str(e)})
        logger.error(f"Erro ao processar tarefa {taskId}: {str(e)}")
