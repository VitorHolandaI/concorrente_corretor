# Corretor de Código com LLM

Corretor automático de trabalhos. O professor define perguntas, sobe os
trabalhos dos alunos em `.tar.gz`, e um LLM local (via [Ollama](https://ollama.com))
lê o código, responde cada pergunta e gera uma planilha Excel com notas e
comentários.

- **Backend:** FastAPI + LangChain + Ollama (`back/`)
- **Frontend:** React + Vite (`front/`)

## Requisitos

- Python 3.13
- Node.js 18+ / npm
- Um servidor [Ollama](https://ollama.com) rodando, com o modelo já baixado
  (ex: `ollama pull gpt-oss:latest`)

## Configuração

Edite `back/config.py` e aponte para o seu Ollama:

```python
OLLAMA_BASE_URL = "http://localhost:11434"  # URL do servidor Ollama
OLLAMA_MODEL    = "gpt-oss:latest"             # modelo a usar
```

Ou sobrescreva por variável de ambiente, sem editar o arquivo:

```bash
export OLLAMA_BASE_URL="http://localhost:11434"
export OLLAMA_MODEL="qwen2.5-coder:latest"
```

## Como rodar

Tudo de uma vez (cria venv, instala deps do back e do front, sobe os dois):

```bash
./run.sh
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

`Ctrl+C` derruba os dois.

### Rodar manualmente (opcional)

Backend:

```bash
cd back
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend (em outro terminal):

```bash
cd front
npm install
npm run dev
```

> O Vite faz proxy de `/api/*` para `http://localhost:8000` (ver `front/vite.config.ts`).

## Como usar

1. Abra o frontend no navegador.
2. Para cada **pergunta**:
   - escreva a pergunta;
   - informe o **arquivo** alvo — é tratado como **regex/substring** do nome
     (ex: `main.go`, `\.c$`, `relatorio`);
   - defina as **opções** de resposta (padrão `Sim` / `Não`).
3. Selecione um ou mais `.tar.gz` (um por aluno — o nome do arquivo vira a
   "matrícula").
4. Clique **Enviar para Avaliação**. A avaliação roda em background; o progresso
   aparece na tela (polling a cada 3s).
5. Clique **Baixar Excel** (parcial enquanto roda, completo no fim).

### Saída

Planilha `back/avaliacao.xlsx`:

| Matricula | Pergunta 1 | Pergunta 2 | ... | Comentários |
|-----------|------------|------------|-----|-------------|

- `N/A` — nenhum arquivo bateu com o filtro.
- `[MULTI-ARQUIVO] ...` — o filtro bateu em mais de um arquivo.
- **Comentários** — resumo dos motivos das respostas que não foram `Sim`.

## API (backend)

| Método | Rota        | Descrição                                         |
|--------|-------------|---------------------------------------------------|
| POST   | `/avaliar`  | Recebe perguntas + `.tar.gz` e inicia avaliação. |
| GET    | `/status`   | Estado atual (rodando / concluída / progresso).  |
| GET    | `/download` | Baixa o Excel (parcial ou completo).             |

Só uma avaliação roda por vez (retorna `409` se já há uma em andamento).
