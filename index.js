const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3456;
const FIPE_API = process.env.FIPE_API_URL || "https://veiculos.fipe.org.br/api/veiculos";

// Middlewares
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000 // limite de 10.000 requisições por IP
});
app.use(limiter);

// Cache em memória simples
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

function getCacheKey(path, params) {
  return `${path}_${JSON.stringify(params)}`;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

// Função helper para gerar o manual
function getManual() {
  return {
    contato: {
      instagram: "https://instagram.com/alequizao",
      whatsapp: "https://wa.me/5582988717072",
      autor: "@alequizao",
      email: "alexjuniorcalado@gmail.com",
      versao: "1.0.0"
    },
    exemplos: {
      "1. Consultar Meses": {
        "Listar todos": "/api/mes",
        "Consultar específico": "/api/mes=319"
      },
      "2. Consultar Tipos de Veículo": {
        "Listar todos": "/api/mes=319&tipo",
        "Consultar específico": "/api/mes=319&tipo=2 (1:Carro, 2:Moto, 3:Caminhão)"
      },
      "3. Consultar Marcas": {
        "Listar todas": "/api/mes=319&tipo=2/marca",
        "Consultar específica": "/api/mes=319&tipo=2/marca=80"
      },
      "4. Consultar Modelos": {
        "Listar todos": "/api/mes=319&tipo=2/marca=80/modelo",
        "Consultar específico": "/api/mes=319&tipo=2/marca=80/modelo=8071"
      },
      "5. Consultar Anos": {
        "Listar todos": "/api/mes=319&tipo=2/marca=80/modelo=8071/ano",
        "Consultar específico": "/api/mes=319&tipo=2/marca=80/modelo=8071/ano=2020-1"
      },
      "6. Consulta Completa": {
        "Exemplo": "/api/mes=319&tipo=2/marca=80/modelo=8071/ano=2020-1/anomodelo=2020/combustivel=1"
      }
    },
    guiaDeUso: {
      "Como usar": "Siga o passo a passo abaixo para consultar um veículo:",
      "Passo 1": "Consulte o mês de referência usando /api/mes",
      "Passo 2": "Escolha o tipo de veículo usando /api/mes=XXX&tipo",
      "Passo 3": "Selecione a marca usando /api/mes=XXX&tipo=Y/marca",
      "Passo 4": "Escolha o modelo usando /api/mes=XXX&tipo=Y/marca=ZZ/modelo",
      "Passo 5": "Selecione o ano usando /api/mes=XXX&tipo=Y/marca=ZZ/modelo=WWWW/ano",
      "Passo 6": "Faça a consulta completa usando o exemplo em '6. Consulta Completa'",
      "Códigos Úteis": {
        "Tipos de Veículo": {
          "1": "Carro",
          "2": "Moto",
          "3": "Caminhão"
        },
        "Combustível": {
          "1": "Gasolina",
          "2": "Álcool",
          "3": "Diesel",
          "4": "Flex"
        }
      }
    }
  };
}

// Modificar o middleware de erro para ser mais abrangente
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Se for erro do Axios
  if (err.isAxiosError) {
    return res.status(500).json({
      error: "Erro ao consultar a FIPE",
      message: "Não foi possível obter os dados da tabela FIPE. Tente novamente mais tarde.",
      detalhes: err.message,
      ...getManual()
    });
  }

  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message || 'Ocorreu um erro inesperado',
    ...getManual()
  });
};

// Rota raiz da API
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    message: "Bem-vindo à API de Consulta FIPE",
    descricao: "Esta API permite consultar preços de veículos na tabela FIPE de forma simples e intuitiva.",
    autor: "@alequizao",
    versao: "1.0.0",
    ...getManual()
  });
});

// Rota raiz geral
app.get('/', (req, res) => {
  res.json({
    message: "Bem-vindo à API de Consulta FIPE",
    descricao: "Use o prefixo /api para acessar os endpoints da API.",
    autor: "@alequizao",
    versao: "1.0.0",
    email: "alexjuniorcalado@gmail.com",
    whatsapp: "https://wa.me/5582988717072",
    instagram: "https://instagram.com/alequizao",               
    ...getManual()
  });
});

// Rotas simplificadas
// 1. Meses de referência
app.get('/api/mes', async (req, res, next) => {
  try {
    const cacheKey = getCacheKey('referencias', {});
    const cachedData = getCache(cacheKey);
    
    if (cachedData) return res.json(cachedData);

    const { data } = await axios.post(`${FIPE_API}/ConsultarTabelaDeReferencia`);
    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/mes=:mes', async (req, res, next) => {
  try {
    const { mes } = req.params;
    const { data } = await axios.post(`${FIPE_API}/ConsultarTabelaDeReferencia`);
    const mesEspecifico = data.find(item => item.Codigo.toString() === mes);
    
    if (!mesEspecifico) {
      return res.status(404).json({
        error: "Dados não encontrados",
        message: "O mês de referência solicitado não existe. Consulte os exemplos abaixo.",
        ...getManual()
      });
    }
    
    res.json(mesEspecifico);
  } catch (error) {
    next(error);
  }
});

// 2. Tipos de veículo
app.get('/api/mes=:mes&tipo', async (req, res, next) => {
  res.json([
    { codigo: 1, nome: "Carro" },
    { codigo: 2, nome: "Moto" },
    { codigo: 3, nome: "Caminhão" }
  ]);
});

// 3. Marcas
app.get('/api/mes=:mes&tipo=:tipo/marca', async (req, res, next) => {
  try {
    const { mes, tipo } = req.params;
    const cacheKey = getCacheKey('marcas', { mes, tipo });
    const cachedData = getCache(cacheKey);
    
    if (cachedData) return res.json(cachedData);

    const form = new URLSearchParams();
    form.append('codigoTabelaReferencia', mes);
    form.append('codigoTipoVeiculo', tipo);

    const { data } = await axios.post(`${FIPE_API}/ConsultarMarcas`, form);
    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/mes=:mes&tipo=:tipo/marca=:marca', async (req, res, next) => {
  try {
    const { mes, tipo, marca } = req.params;
    const { data } = await axios.post(`${FIPE_API}/ConsultarMarcas`, new URLSearchParams({
      codigoTabelaReferencia: mes,
      codigoTipoVeiculo: tipo
    }));
    
    const marcaEspecifica = data.find(item => item.Value === marca);
    if (!marcaEspecifica) {
      return res.status(404).json({
        error: "Dados não encontrados",
        message: "A marca solicitada não existe. Consulte os exemplos abaixo.",
        ...getManual()
      });
    }
    
    res.json(marcaEspecifica);
  } catch (error) {
    next(error);
  }
});

// 4. Modelos
app.get('/api/mes=:mes&tipo=:tipo/marca=:marca/modelo', async (req, res, next) => {
  try {
    const { mes, tipo, marca } = req.params;
    const cacheKey = getCacheKey('modelos', { mes, tipo, marca });
    const cachedData = getCache(cacheKey);
    
    if (cachedData) return res.json(cachedData);

    const form = new URLSearchParams();
    form.append('codigoTabelaReferencia', mes);
    form.append('codigoTipoVeiculo', tipo);
    form.append('codigoMarca', marca);

    const { data } = await axios.post(`${FIPE_API}/ConsultarModelos`, form);
    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// 5. Anos
app.get('/api/mes=:mes&tipo=:tipo/marca=:marca/modelo=:modelo/ano', async (req, res, next) => {
  try {
    const { mes, tipo, marca, modelo } = req.params;
    const form = new URLSearchParams({
      codigoTabelaReferencia: mes,
      codigoTipoVeiculo: tipo,
      codigoMarca: marca,
      codigoModelo: modelo
    });

    const { data } = await axios.post(`${FIPE_API}/ConsultarAnoModelo`, form);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// 6. Consulta final do veículo
app.get('/api/mes=:mes&tipo=:tipo/marca=:marca/modelo=:modelo/ano=:ano/anomodelo=:anomodelo/combustivel=:combustivel', 
async (req, res, next) => {
  try {
    const { mes, tipo, marca, modelo, ano, anomodelo, combustivel } = req.params;
    
    const form = new URLSearchParams();
    form.append('codigoTabelaReferencia', mes);
    form.append('codigoTipoVeiculo', tipo);
    form.append('codigoMarca', marca);
    form.append('codigoModelo', modelo);
    form.append('ano', ano);
    form.append('anoModelo', anomodelo);
    form.append('codigoTipoCombustivel', combustivel);
    form.append('tipoConsulta', 'tradicional');

    const { data } = await axios.post(`${FIPE_API}/ConsultarValorComTodosParametros`, form);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Modificar o middleware de rotas não encontradas para ser mais abrangente
app.all('*', (req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    message: "A URL solicitada não existe ou está incorreta. Siga o passo a passo abaixo:",
    contato: {
      instagram: "https://instagram.com/alequizao",
      whatsapp: "https://wa.me/5582988717072"
    },
    guiaDeUso: {
      "Como usar": "Siga o passo a passo abaixo para consultar um veículo:",
      "Passo 1": "Consulte o mês de referência usando /api/mes",
      "Passo 2": "Escolha o tipo de veículo usando /api/mes=XXX&tipo",
      "Passo 3": "Selecione a marca usando /api/mes=XXX&tipo=Y/marca",
      "Passo 4": "Escolha o modelo usando /api/mes=XXX&tipo=Y/marca=ZZ/modelo",
      "Passo 5": "Selecione o ano usando /api/mes=XXX&tipo=Y/marca=ZZ/modelo=WWWW/ano",
      "Passo 6": "Faça a consulta completa usando o exemplo em '6. Consulta Completa'"
    },
    exemplos: {
      "1. Consultar Meses": {
        "Listar todos": "/api/mes",
        "Consultar específico": "/api/mes=319"
      },
      "2. Consultar Tipos de Veículo": {
        "Listar todos": "/api/mes=319&tipo",
        "Consultar específico": "/api/mes=319&tipo=2 (1:Carro, 2:Moto, 3:Caminhão)"
      },
      "3. Consultar Marcas": {
        "Listar todas": "/api/mes=319&tipo=2/marca",
        "Consultar específica": "/api/mes=319&tipo=2/marca=80"
      },
      "4. Consultar Modelos": {
        "Listar todos": "/api/mes=319&tipo=2/marca=80/modelo",
        "Consultar específico": "/api/mes=319&tipo=2/marca=80/modelo=8071"
      },
      "5. Consultar Anos": {
        "Listar todos": "/api/mes=319&tipo=2/marca=80/modelo=8071/ano",
        "Consultar específico": "/api/mes=319&tipo=2/marca=80/modelo=8071/ano=2020-1"
      },
      "6. Consulta Completa": {
        "Exemplo": "/api/mes=319&tipo=2/marca=80/modelo=8071/ano=2020-1/anomodelo=2020/combustivel=1"
      }
    },
    codigosUteis: {
      "Tipos de Veículo": {
        "1": "Carro",
        "2": "Moto",
        "3": "Caminhão"
      },
      "Combustível": {
        "1": "Gasolina",
        "2": "Álcool",
        "3": "Diesel",
        "4": "Flex"
      }
    }
  });
});

// Middleware de erro deve ser o último
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

module.exports = app; 