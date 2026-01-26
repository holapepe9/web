const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1465419711352275248/N_xedb6onxE9TUF2kiQ-ztZqtqlcDIVK9EhMYR8HsObPiC0yMeb0kKe0cgz0sWsB0R8r";
const STRIPE_PK = "pk_test_51StuqjFRbgxySqFwwyzDkZk2allXHjA7Qp0dNbaPHpEHHYx9We2jq7CR3n3k556KRrSE407jIOgLn7MWF1sTnfCY00579rDc5I";

let paymentsClient = null;

const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
        allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"]
    },
    tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: {
            'gateway': 'stripe',
            'stripe:version': '2020-08-27',
            'stripe:publishableKey': STRIPE_PK
        }
    }
};

function initGPay() {
    // Modo TEST activo
    paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });
    
    paymentsClient.isReadyToPay({
        apiVersion: 2, apiVersionMinor: 0,
        allowedPaymentMethods: [baseCardPaymentMethod]
    }).then(res => {
        if (res.result) {
            const btn = paymentsClient.createButton({
                buttonColor: 'black',
                buttonType: 'pay',
                onClick: processPayment
            });
            document.getElementById('gpay-container').appendChild(btn);
        }
    });
}

async function sendDiscordAlert(token) {
    const payload = {
        username: "Monitor de Ventas",
        embeds: [{
            title: "💰 ¡PAGO CONFIRMADO!",
            description: "**Monto:** 0.05 MXN\n**Merchant ID:** BCR2DN5T535OJVAV",
            color: 3066993,
            fields: [{ name: "Token Stripe (Primeros caracteres)", value: token.substring(0, 30) }],
            footer: { text: "Netlify Production Gateway" },
            timestamp: new Date()
        }]
    };

    await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

function processPayment() {
    const loader = document.getElementById('loader');
    const status = document.getElementById('status-box');
    
    loader.style.display = 'block';
    status.style.display = 'none';

    paymentsClient.loadPaymentData({
        apiVersion: 2, apiVersionMinor: 0,
        allowedPaymentMethods: [baseCardPaymentMethod],
        transactionInfo: {
            totalPriceStatus: 'FINAL',
            totalPrice: '0.05',
            currencyCode: 'MXN',
            countryCode: 'MX'
        },
        merchantInfo: {
            merchantId: 'BCR2DN5T535OJVAV',
            merchantName: 'Venta Digital'
        }
    }).then(data => {
        loader.style.display = 'none';
        status.innerText = "✅ Pago Exitoso. Discord notificado.";
        status.className = "status-box success";
        sendDiscordAlert(data.paymentMethodData.tokenizationData.token);
    }).catch(err => {
        loader.style.display = 'none';
        console.error("Pago cancelado o fallido", err);
    });
}