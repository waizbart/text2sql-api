import os
import sys
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import logging

# Configuração do logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model_path = os.getenv('MODEL_PATH', '../models/Chat2DB-SQL-7B')

try:
    logger.info("Carregando modelo e tokenizer...")

    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        trust_remote_code=True,
        device_map="auto",
        torch_dtype=torch.float16, 
        use_cache=True,
        offload_folder='offload_folder'
    )
    tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True, legacy=False)

    text_pipeline = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=50,
        return_full_text=False
    )

    logger.info("Modelo carregado com sucesso.")
except Exception as e:
    logger.error(f"Erro ao carregar o modelo ou tokenizer: {str(e)}")
    sys.exit(1)

prompt = "Quais são os produtos mais populares entre os clientes corporativos?"

try:
    logger.info(f"Task: Iniciando processamento.")

    logger.info(f"Task: Gerando texto com o modelo.")
    generated_text = text_pipeline(prompt, pad_token_id=text_pipeline.tokenizer.eos_token_id)[0]['generated_text']
    logger.info(f"Task: Texto gerado com sucesso.")
except Exception as e:
    logger.error(f"Erro ao processar task: {str(e)}")
