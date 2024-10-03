# Text2SQL API

## Sumário

1. [Introdução](#introdução)
2. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
3. [Componentes do Sistema](#componentes-do-sistema)
   - [1. Camada de Aplicação (API)](#1-camada-de-aplicação-api)
   - [2. Fila de Tarefas (Celery e RabbitMQ)](#2-fila-de-tarefas-celery-e-rabbitmq)
   - [3. Worker](#3-worker)
   - [4. Modelo de Linguagem Natural](#4-modelo-de-linguagem-natural)
   - [5. Banco de Dados](#5-banco-de-dados)
   - [6. Cache e Estado (Redis)](#6-cache-e-estado-redis)
4. [Detalhes da Implementação](#detalhes-da-implementação)
   - [Estrutura de Diretórios](#estrutura-de-diretórios)
   - [Descrição dos Módulos](#descrição-dos-módulos)
5. [Instalação e Configuração](#instalação-e-configuração)
   - [Pré-requisitos](#pré-requisitos)
   - [Configuração do Ambiente](#configuração-do-ambiente)
   - [Instruções de Instalação](#instruções-de-instalação)
6. [Uso](#uso)
   - [Execução da Aplicação](#execução-da-aplicação)
   - [Testando a Aplicação](#testando-a-aplicação)
7. [Referência da API](#referência-da-api)

---

## Introdução

Este projeto integra uma aplicação web com um modelo de linguagem natural para geração de consultas SQL. A aplicação permite que usuários façam perguntas em linguagem natural, que são transformadas em consultas SQL e executadas em um banco de dados. O sistema utiliza uma arquitetura modular que facilita a escalabilidade, manutenção e integração de componentes de IA.

---

## Visão Geral da Arquitetura

A arquitetura do sistema é composta pelos seguintes componentes principais:

- **Camada de Aplicação (API)**: Desenvolvida em **NestJS**, responsável por receber solicitações dos usuários e interagir com os demais componentes.
- **Fila de Tarefas**: Utiliza o **Celery** com **RabbitMQ** como broker para gerenciar tarefas assíncronas.
- **Worker**: Processos que consomem as tarefas da fila e executam a geração de consultas SQL utilizando um modelo de linguagem natural.
- **Modelo de Linguagem Natural**: Um modelo de larga escala utilizado para transformar perguntas em linguagem natural em consultas SQL.
- **Banco de Dados**: Gerenciado pelo **Prisma ORM**, com um esquema definido.
- **Cache e Estado**: O **Redis** é utilizado para armazenar o status das tarefas e resultados intermediários.

---

## Componentes do Sistema

### 1. Camada de Aplicação (API)

- **Tecnologia**: NestJS
- **Descrição**: Serviço que expõe endpoints para que os usuários possam enviar perguntas e receber os resultados correspondentes.
- **Principais Responsabilidades**:
  - Receber solicitações de geração de consultas SQL.
  - Enfileirar tarefas para processamento assíncrono.
  - Consultar o status das tarefas e retornar resultados ao usuário.
  - **Autenticação**: Requer que as requisições sejam autenticadas através de um token secreto passado no header `Authorization` como Bearer Token.

### 2. Fila de Tarefas (Celery e RabbitMQ)

- **Tecnologia**: Celery (Python), RabbitMQ
- **Descrição**: Gerencia o processamento assíncrono de tarefas, permitindo que a aplicação responda rapidamente às solicitações dos usuários.
- **Principais Responsabilidades**:
  - Enfileirar tarefas de geração de consultas.
  - Distribuir tarefas para os workers disponíveis.

### 3. Worker

- **Tecnologia**: Python, Celery
- **Descrição**: Processos que executam as tarefas de geração de consultas SQL usando o modelo de linguagem natural.
- **Principais Responsabilidades**:
  - Processar tarefas da fila.
  - Carregar o modelo de linguagem natural.
  - Gerar consultas SQL com base no prompt fornecido.

### 4. Modelo de Linguagem Natural

- **Descrição**: Modelo pré-treinado especializado em gerar consultas SQL a partir de descrições em linguagem natural.
- **Modelo Utilizado**: **[Chat2DB-SQL-7B](https://huggingface.co/Chat2DB/Chat2DB-SQL-7B)**

### 5. Banco de Dados

- **Tecnologia**: MySQL, Prisma ORM
- **Descrição**: Armazena os dados necessários para a aplicação e fornece o esquema utilizado pelo modelo de linguagem natural.
- **Principais Responsabilidades**:
  - Armazenar dados dos clientes, pedidos, produtos, etc.
  - Executar as consultas SQL geradas pelo modelo.
  - Fornecer o esquema do banco de dados para ser incluído nos prompts.

### 6. Cache e Estado (Redis)

- **Tecnologia**: Redis
- **Descrição**: Armazena temporariamente o status das tarefas e resultados intermediários para comunicação entre a API e os workers.
- **Principais Responsabilidades**:
  - Armazenar o status das tarefas (`pending`, `processing`, `completed`, `error`).
  - Armazenar resultados intermediários, como consultas SQL geradas e resultados de consultas.

---

## Detalhes da Implementação

### Estrutura de Diretórios

```
/
├── api/                      # Código da API NestJS
├── text2sql-worker/          # Código do worker em Python
├── models/                   # Modelos de linguagem natural
├── docker-compose.yml        # Configuração do Docker Compose
```

### Descrição dos Módulos

#### **API NestJS (`api/`)**

- **`app.module.ts`**: Módulo principal da aplicação.
- **`app.controller.ts`**: Controladores que definem os endpoints.
- **`app.service.ts`**: Serviços que contêm a lógica de negócios.
- **`services/`**: Serviços auxiliares como `DatabaseService`, `PromptService`, `QueueService`.
- **`guards/`**: Implementação de guards para verificar o token secreto nas requisições.

#### **Worker Python (`text2sql-worker/`)**

- **`tasks.py`**: Define as tarefas Celery e carrega o modelo de linguagem natural.
- **`celeryconfig.py`**: Configurações do Celery.
- **`requirements.txt`**: Dependências Python.

#### **Modelos (`models/`)**

- **`Chat2DB-SQL-7B/`**: Diretório contendo o modelo pré-treinado.

#### **Prisma (`prisma/`)**

- **`schema.prisma`**: Definição do esquema do banco de dados.

---

## Instalação e Configuração

### Pré-requisitos

- **Docker** e **Docker Compose** instalados na máquina.
- **NVIDIA Container Toolkit** instalado se for utilizar GPU.
- **GPU NVIDIA** compatível (opcional, mas recomendado para desempenho).
- **Hugging Face CLI** instalado para download do modelo.

### Configuração do Ambiente

1. **Clonar o Repositório**

   ```bash
   git clone https://github.com/waizbart/text2sql-api.git
   cd text2sql-api
   ```

2. **Configurar Variáveis de Ambiente**

   Crie uma cópia do arquivo `.env.example` como `.env` na raiz do projeto e defina as variáveis necessárias.

### Instruções de Instalação

1. **Baixar o Modelo de Linguagem Natural**

   Antes de iniciar os contêineres, é necessário baixar o modelo **Chat2DB-SQL-7B** do Hugging Face. Certifique-se de ter o **Hugging Face CLI** instalado:

   ```bash
   pip install huggingface-hub
   ```

   Baixe o modelo:

   ```bash
   huggingface-cli download Chat2DB/Chat2DB-SQL-7B --local-dir ./models/Chat2DB-SQL-7B
   ```

2. **Construir e Iniciar os Contêineres**

   ```bash
   docker-compose up --build -d
   ```

---

## Uso

### Execução da Aplicação

Com os contêineres em execução, a API estará disponível na porta configurada (por padrão, 3000).

### Testando a Aplicação

1. **Enviar uma Pergunta**

   Faça uma requisição **POST** para o endpoint `/api/query` com o corpo:

   ```json
   {
     "prompt": "Quais são os produtos mais populares entre os clientes corporativos?"
   }
   ```

   **Cabeçalho da Requisição**:

   ```
   Authorization: Bearer sua_chave_secreta
   ```

2. **Receber o ID da Tarefa**

   A API retornará um `taskId` que pode ser usado para verificar o status.

3. **Verificar o Status da Tarefa**

   Faça uma requisição **GET** para `/api/status/{taskId}` para obter o status e o resultado.

   **Cabeçalho da Requisição**:

   ```
   Authorization: Bearer sua_chave_secreta
   ```

---

## Referência da API

### **Autenticação**

Todas as requisições à API devem incluir um token secreto no header `Authorization` no formato `Bearer <SECRET_KEY>`.

### **POST** `/api/query`

- **Descrição**: Enfileira uma nova tarefa de geração de consulta SQL.
- **Cabeçalhos**:

  ```
  Authorization: Bearer sua_chave_secreta
  ```

- **Corpo da Requisição**:

  ```json
  {
    "prompt": "Sua pergunta em linguagem natural"
  }
  ```

- **Resposta**:

  ```json
  {
    "taskId": "UUID da tarefa"
  }
  ```

### **GET** `/api/status/{taskId}`

- **Descrição**: Retorna o status da tarefa e o resultado, se disponível.
- **Cabeçalhos**:

  ```
  Authorization: Bearer sua_chave_secreta
  ```

- **Parâmetros**:
  - `taskId`: ID da tarefa retornado na requisição POST.
- **Resposta**:

  ```json
  {
    "status": "pending | processing | completed | error",
    "generatedSQL": "Consulta SQL gerada",
    "queryResult": "Resultado da consulta",
    "error": "Mensagem de erro, se houver"
  }
  ```
