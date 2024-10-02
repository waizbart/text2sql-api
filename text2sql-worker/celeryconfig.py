import os

broker_url = f'amqp://{os.getenv("RABBITMQ_HOST", "localhost")}'
result_backend = f'redis://{os.getenv("REDIS_HOST", "localhost")}'

task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'UTC'
enable_utc = True
