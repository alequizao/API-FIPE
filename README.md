# API de Consulta FIPE

API REST para consulta de preços de veículos na tabela FIPE com rotas simplificadas e intuitivas.

## 🚀 Configuração

1. Clone o repositório
```bash
git clone https://github.com/alequizao/API-FIPE.git
cd API-FIPE
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações:
- PORT: Porta onde a API vai rodar (default: 3000)
- FIPE_API_URL: URL da API FIPE

4. Inicie o servidor
```bash
npm run dev # para desenvolvimento
npm start  # para produção
```

## 📚 Endpoints

### 1. Consultar Meses de Referência

```http
GET /api/mes                # Lista todos os meses
GET /api/mes=319           # Consulta um mês específico
```

**Exemplo de resposta:**
```json
[
  {
    "Codigo": 319,
    "Mes": "janeiro/2024"
  }
]
```

### 2. Consultar Tipos de Veículo

```http
GET /api/mes=319&tipo      # Lista todos os tipos
GET /api/mes=319&tipo=2    # Consulta tipo específico (2 = Moto)
```

**Exemplo de resposta:**
```json
[
  { "codigo": 1, "nome": "Carro" },
  { "codigo": 2, "nome": "Moto" },
  { "codigo": 3, "nome": "Caminhão" }
]
```

### 3. Consultar Marcas

```http
GET /api/mes=319&tipo=2/marca      # Lista todas as marcas
GET /api/mes=319&tipo=2/marca=80   # Consulta marca específica (80 = Honda)
```

### 4. Consultar Modelos

```http
GET /api/mes=319&tipo=2/marca=80/modelo        # Lista todos os modelos
GET /api/mes=319&tipo=2/marca=80/modelo=8071   # Consulta modelo específico
```

### 5. Consultar Anos

```http
GET /api/mes=319&tipo=2/marca=80/modelo=8071/ano          # Lista todos os anos
GET /api/mes=319&tipo=2/marca=80/modelo=8071/ano=2020-1   # Consulta ano específico
```

### 6. Consulta Completa do Veículo

```http
GET /api/mes=319&tipo=2/marca=80/modelo=8071/ano=2020-1/anomodelo=2020/combustivel=1
```

**Exemplo de resposta:**
```json
{
  "Valor": "R$ 92.345,00",
  "Marca": "Honda",
  "Modelo": "CG 160",
  "AnoModelo": 2020,
  "Combustivel": "Gasolina",
  "CodigoFipe": "811008-9",
  "MesReferencia": "janeiro/2024",
  "DataConsulta": "quinta-feira, 1 de fevereiro de 2024 21:47"
}
```

## 🔒 Limites e Cache

- Máximo de 100 requisições por IP a cada 15 minutos
- Cache de 1 hora para consultas repetidas
- Respostas em formato JSON
- Códigos de status HTTP padrão

## 🛠 Tecnologias

- Node.js
- Express
- Axios
- Helmet (Segurança)
- Compression
- CORS
- Rate Limiting
- Cache em memória

## 📝 Códigos dos Parâmetros

### Tipos de Veículo
- 1: Carro
- 2: Moto
- 3: Caminhão

### Combustível
- 1: Gasolina
- 2: Álcool
- 3: Diesel
- 4: Flex

## 🤝 Contribuindo

1. Faça o fork do projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.
