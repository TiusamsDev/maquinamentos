const express = require('express');
const fs = require('fs');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const ACCESS_TOKEN = 'APP_USR-943508943095141-042522-e13991c3eaf93796da8201ae8fb2596f-764241686';

app.use(express.json());

// Webhook do Mercado Pago
app.post('/webhook', async (req, res) => {
  const { data, type } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;
    try {
      const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
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
        await axios.get('http://IP_DO_ESP32/acionar'); // <-- você troca isso pelo IP real do ESP
      }
    } catch (err) {
      console.error("Erro ao consultar pagamento:", err.message);
    }
  }

  res.sendStatus(200);
});

// Endpoint opcional pro ESP32 checar manualmente
app.get('/status', (req, res) => {
  const data = JSON.parse(fs.readFileSync('pagamentos.json'));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
