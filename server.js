const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Permite acessar arquivos na pasta "public" pela URL
app.use(express.static('public'));

// Rota para baixar boleto e gerar link
app.post('/baixar-boleto', async (req, res) => {
  const { costumer_id, uidParcela, boleto, cryptKey, tokenApi } = req.body;

  // Monta a URL da API Ceape Brasil
  const url = `https://api.ceapebrasil.org.br/orders/${costumer_id}/ticket/${uidParcela}/download/${boleto}`;

  try {
    // Faz a requisição para pegar o PDF
    const response = await axios.get(url, {
      params: { cryptKey, tokenApi },
      responseType: 'arraybuffer' // importante para PDF
    });

    // Tenta extrair o nome do arquivo do Header
    let filename = 'boleto.pdf';
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) filename = match[1];
    }

    // Caminho onde o arquivo será salvo
    const filePath = path.join(__dirname, 'public', filename);

    // Salva o PDF no servidor
    fs.writeFileSync(filePath, response.data);

    // Gera o link de acesso (localhost para testes)
    const fileUrl = `https://boleto-cybn.onrender.com//${encodeURIComponent(filename)}`;

    // Retorna o link para o Typebot usar
    res.json({ link: fileUrl });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      error: 'Erro ao baixar boleto',
      detalhes: error.response?.data || error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
