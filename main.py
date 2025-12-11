from langchain_ollama import ChatOllama
llm = ChatOllama(
    model="qwen3:14b",
    temperature=0,
    base_url="http://localhost:11434",
)

messages = [
    (
        "system",
        "You are a helpful assistant that translates English to French. Translate the user sentence.",
    ),
    ("human", "I love programming."),
]


codigo = "path_to_codigo"  # global


def ler_arquivo():
    with open("arquivo.java", "r") as file:
        text = file.read()
    file.close()
    return text


def avaliador(lista_avaliar: list, codigo: str):
    avalicao_final = []
    contador = 0
    for string in lista_avaliar:
        print("enter question")
        prompt = (f"SYSTEM--OBS NAO MELHORE O CODIGO NAO DE EXEMPLOS DE CODIGO-> AVALIE e RETORNE CURTA MENSAGEM E RETORNE UMA MENSAGEM E COLOQUE ENUMERADO COM MARKDOWN ANALISANDO O CODIGO DADO COMFORME AS DIRETIVAS DADAS DIRETIVAS QUERO CURTO ALGO COMO SIM OU NAO!!!!! QUERO O MAIS CURTO POSSIVEL!!!!!!!!!!!!1 {
                  string} NAO QUERO EXEMPLOS DE CODIGOS! CODIGO: \n {codigo} QUERO SOMENTE OS TRECHOS DO CODIGO ORIGINAL MOSTRANDO O ERRO")
        current_msg = llm.invoke(prompt)
        complet = (
            f"{current_msg.content}\n")
        avalicao_final.append(complet)
        contador += 1
        print(f"contador esta em {contador}")
    avalicao_final.append(f"\nCODIGO{codigo}")
    return avalicao_final


def main():
    arquivo = ler_arquivo()
    # numero_coisas = int(input("Quantidade de coisas a avaliar "))
    coisas_avaliar = []

   # for i in range(numero_coisas):
   #     coisa = input("oque avaliar? ")
   #     coisas_avaliar.append(coisa)
    coisas_avaliar = [
        "oque avaliar? codigo compila e executa",
        "oque avaliar? como a tarefa a ser executada pela thread foi implementada implemtns runnable Extends thread outro.",
        "oque avaliar? como concorrencia foi implementada ? uma thread para cada arquivo, thread para grupo de arquivos, outro",
        "oque avaliar? as threads são inicializadas adequadamente isto eh atraves do t.start()",
        "oque avaliar? as threads executam de fato concorrentemente? por exemplo se fizer o t.join logo apos o t.start a solucao tera a execucao serializada",
        "oque avaliar? existe condicao de corrida ao contabilizar a quantidade de vezes que o padrao ocorre? por exemplo variavel global para contagem e acesso ao contador sem mutex",
        "oque avaliar? a thread principal aguarda a finalizacao de todas as threads filhas antes de exibir o resultado?",
        "oque avaliar? a thread principal aguarda a finalizacao das threads filhas atraves de espera ocupada?",
        "oque avaliar? a finalizacao das threads filhas eh sincronizada adequadamente? t.join eh usado? se sim no trecho de codigo certo?"
    ]

    avaliacao = avaliador(coisas_avaliar, arquivo)
    estructured = "\n".join(avaliacao)

    with open("file.txt", "w") as file:
        file.write(estructured)


if __name__ == '__main__':
    main()
