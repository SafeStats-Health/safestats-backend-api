# safestats-backend-api
This repository contains our backend from the SafeStats application. SafeStats is an application developed to help citizens to find the nearby hospital based on his current location or any location that it's inserted, there is also another cool features

## Rodando o servidor
- Instale as dependências do projeto:
	- "npm install"

- Mude as variáveis de ambiente para o ambiente de desenvolvimento:
	1. Crie um arquivo chamado ".env" na raiz do projeto
	2. Adicione as variáveis de ambiente de exemplo do arquivo ".env.example"
	3. Altere a variável "ENVIRONMENT" para o ambiente desejado
	4. Altere a variávels "PORT" para a porta que deseja disponibilizar a aplicação

- Crie o database com o nome de "safestats" no ambiente escolhido:
	- Exemplo:
		- Se estiver na universidade, é preciso acessar o MySQL e criar o database.
			- As credenciais do MySQL da escola são: root@puc2022
		- Se estiver rodando com Docker, basta iniciar o container.
			- Para iniciar o container, rode o comando docker "docker compose ./src/environment/docker-compose.yml"

- Rode o servidor:
	. "npm run dev"
	
## Rodando os testes
- Instale a dependência win-node-env:
	. "npm install win-node-env"

- Rode os testes:
	. "npm run test"