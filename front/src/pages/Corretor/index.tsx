import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './styles.scss';

interface Pergunta {
  pergunta: string;
  opcoes: string[];
  arquivo: string;
}

interface StatusAvaliacao {
  rodando: boolean;
  concluida: boolean;
  progresso: string;
}

const STORAGE_KEY = 'corretor_perguntas';

function carregarPerguntas(): Pergunta[] {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignora */ }
  return [{ pergunta: '', opcoes: ['Sim', 'Não'], arquivo: '' }];
}

export function Corretor() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>(carregarPerguntas);
  const [tarFiles, setTarFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<{ type: 'loading' | 'error' | 'success' | 'info'; msg: string } | null>(null);
  const [avaliacaoStatus, setAvaliacaoStatus] = useState<StatusAvaliacao | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Salvar perguntas no localStorage sempre que mudam
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perguntas));
  }, [perguntas]);

  // Checar status da avaliacao ao carregar a pagina
  useEffect(() => {
    checarStatus();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const checarStatus = async () => {
    try {
      const res = await axios.get('/api/status');
      const data: StatusAvaliacao = res.data;
      setAvaliacaoStatus(data);

      if (data.rodando) {
        setStatus({ type: 'loading', msg: `Avaliação em andamento: ${data.progresso}` });
        iniciarPolling();
      } else if (data.concluida) {
        setStatus({ type: 'success', msg: `Avaliação concluída! ${data.progresso}` });
      }
    } catch {
      // Backend offline, sem problema
    }
  };

  const iniciarPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get('/api/status');
        const data: StatusAvaliacao = res.data;
        setAvaliacaoStatus(data);

        if (data.rodando) {
          setStatus({ type: 'loading', msg: `Avaliação em andamento: ${data.progresso}` });
        } else if (data.concluida) {
          setStatus({ type: 'success', msg: `Avaliação concluída! ${data.progresso}` });
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 3000);
  };

  const baixarExcel = async () => {
    try {
      const response = await axios.get('/api/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'avaliacao.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setStatus({ type: 'error', msg: 'Erro ao baixar o Excel.' });
    }
  };

  const adicionarPergunta = () => {
    setPerguntas([...perguntas, { pergunta: '', opcoes: ['Sim', 'Não'], arquivo: '' }]);
  };

  const removerPergunta = (index: number) => {
    setPerguntas(perguntas.filter((_, i) => i !== index));
  };

  const atualizarPergunta = (index: number, valor: string) => {
    const novas = [...perguntas];
    novas[index].pergunta = valor;
    setPerguntas(novas);
  };

  const adicionarOpcao = (perguntaIndex: number) => {
    const novas = [...perguntas];
    novas[perguntaIndex].opcoes.push('');
    setPerguntas(novas);
  };

  const removerOpcao = (perguntaIndex: number, opcaoIndex: number) => {
    const novas = [...perguntas];
    novas[perguntaIndex].opcoes = novas[perguntaIndex].opcoes.filter((_, i) => i !== opcaoIndex);
    setPerguntas(novas);
  };

  const atualizarArquivo = (index: number, valor: string) => {
    const novas = [...perguntas];
    novas[index].arquivo = valor;
    setPerguntas(novas);
  };

  const atualizarOpcao = (perguntaIndex: number, opcaoIndex: number, valor: string) => {
    const novas = [...perguntas];
    novas[perguntaIndex].opcoes[opcaoIndex] = valor;
    setPerguntas(novas);
  };

  const enviar = async () => {
    if (tarFiles.length === 0) {
      setStatus({ type: 'error', msg: 'Selecione pelo menos um arquivo .tar.gz.' });
      return;
    }

    const perguntasValidas = perguntas.filter(p => p.pergunta.trim() && p.opcoes.some(o => o.trim()));
    if (perguntasValidas.length === 0) {
      setStatus({ type: 'error', msg: 'Adicione pelo menos uma pergunta com opções.' });
      return;
    }

    setStatus({ type: 'loading', msg: `Enviando ${tarFiles.length} arquivo(s)...` });

    const formData = new FormData();
    formData.append('questions', JSON.stringify(perguntasValidas));
    for (const file of tarFiles) {
      formData.append('tar_files', file);
    }

    try {
      const response = await axios.post('/api/avaliar', formData, { timeout: 30000 });
      if (response.data.status === 'iniciado') {
        setStatus({ type: 'loading', msg: 'Avaliação iniciada! Acompanhe o progresso abaixo.' });
        iniciarPolling();
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setStatus({ type: 'error', msg: 'Já existe uma avaliação em andamento. Aguarde.' });
      } else {
        setStatus({ type: 'error', msg: 'Erro ao enviar. Verifique o backend.' });
      }
    }
  };

  const isRodando = avaliacaoStatus?.rodando ?? false;
  const isConcluida = avaliacaoStatus?.concluida ?? false;

  return (
    <div className="corretor">
      <h1>Corretor de Código com LLM</h1>

      <div className="perguntas">
        {perguntas.map((p, pIndex) => (
          <div key={pIndex} className="pergunta-card">
            <div className="pergunta-header">
              <span>#{pIndex + 1}</span>
              <input
                type="text"
                placeholder="Escreva a pergunta..."
                value={p.pergunta}
                onChange={(e) => atualizarPergunta(pIndex, e.target.value)}
              />
              <input
                type="text"
                className="input-arquivo"
                placeholder="Arquivo (ex: main.go)"
                value={p.arquivo}
                onChange={(e) => atualizarArquivo(pIndex, e.target.value)}
              />
              <button className="btn-remover" onClick={() => removerPergunta(pIndex)}>
                Remover
              </button>
            </div>

            <div className="opcoes">
              {p.opcoes.map((opcao, oIndex) => (
                <div key={oIndex} className="opcao-item">
                  <input
                    type="text"
                    placeholder={`Opção ${oIndex + 1}`}
                    value={opcao}
                    onChange={(e) => atualizarOpcao(pIndex, oIndex, e.target.value)}
                  />
                  <button className="btn-remover-opcao" onClick={() => removerOpcao(pIndex, oIndex)}>
                    ×
                  </button>
                </div>
              ))}
              <button className="btn-add-opcao" onClick={() => adicionarOpcao(pIndex)}>
                + Opção
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="acoes">
        <button className="btn-add-pergunta" onClick={adicionarPergunta}>
          + Adicionar Pergunta
        </button>

        <div className="upload-section">
          <label>Arquivos .tar.gz ({tarFiles.length} selecionado{tarFiles.length !== 1 ? 's' : ''}):</label>
          <input
            type="file"
            accept=".tar.gz,.tgz"
            multiple
            onChange={(e) => setTarFiles(e.target.files ? Array.from(e.target.files) : [])}
          />
        </div>

        <button
          className="btn-enviar"
          onClick={enviar}
          disabled={isRodando}
        >
          {isRodando ? 'Avaliando...' : 'Enviar para Avaliação'}
        </button>

        {(isConcluida || isRodando) && (
          <button className="btn-download" onClick={baixarExcel}>
            Baixar Excel {isRodando ? '(parcial)' : ''}
          </button>
        )}
      </div>

      {status && (
        <div className={`status ${status.type}`}>
          {status.msg}
        </div>
      )}
    </div>
  );
}
