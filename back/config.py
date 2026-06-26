"""Configuracao do backend.

Ajuste a URL e o modelo do Ollama aqui. Pode sobrescrever via variavel de
ambiente (OLLAMA_BASE_URL / OLLAMA_MODEL) sem editar o arquivo.
"""

import os

# URL base do servidor Ollama a ser usado
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Modelo carregado no Ollama
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gpt-oss:latest")
