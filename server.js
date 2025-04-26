const express = require('express');
const fs = require('fs');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const ACCESS_TOKEN = 'TEST-943508943095141-042522-efe74dbbc4d0dad5ff0042078e88f997-764241686';

app.use(express.json());

// Webhook do Mercado Pago
app.post('/webhook', async (req, res) => {
  // Adicionando o log para ver o conteúdo do webhook
  console.log("Webhook recebido:", JSON.stringify(req.body, null, 2));

  const { data, type } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;  // O ID do pagamento que será usado para consulta
    console.log("ID do pagamento:", paymentId);  // Log do ID para checar se está certo

    try {
      // Fazendo a consulta ao Mercado Pago
      const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`  // Token de acesso ao Mercado Pago
        }
      });

      const pagamento = response.data;

      if (pagamento.status === 'approved') {
        const valor = pagamento.transaction_amount;
        const hora = pagamento.date_approved;

        console.log(`Pagamento recebido: R$${valor} em ${hora}`);

        // Marca como "último pagamento"
        fs.writeFileSync('pagamentos.json', JSON.stringify({ ultimoPagamento: hora }));

        // Aqui você pode enviar um aviso pro ESP32
        await axios.get('http://IP_DO_ESP32/acionar'); // <-- Você troca isso pelo IP real do ESP32
      }
    } catch (err) {
      console.error("Erro ao consultar pagamento:", err.message);
    }
  }

  res.sendStatus(200);  // Responde ao Mercado Pago que o webhook foi recebido
});

// Endpoint opcional pro ESP32 checar manualmente
app.get('/status', (req, res) => {
  const data = JSON.parse(fs.readFileSync('pagamentos.json'));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
