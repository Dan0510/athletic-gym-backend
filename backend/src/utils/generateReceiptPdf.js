const PDFDocument = require('pdfkit');
const fetch = require('node-fetch');

async function getLogoBuffer(url) {
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Error al cargar logo: ${res.status}`);
    }

    return await res.buffer();
}

exports.generateReceiptPdf = async (data) => {

    return new Promise(async (resolve) => {

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // 🎨 COLORES
        const primary = '#1f2a44';
        const red = '#d32f2f';
        const gray = '#888';

        // ===============================
        // 🖼️ LOGO
        // ===============================
        try {
            const logo = await getLogoBuffer(
                'https://storage.googleapis.com/athletic-gym/logo_athletic_transparente.png'
            );

            doc.image(logo, 40, 40, { width: 90 });

        } catch (e) {
            console.log('Error cargando logo:', e.message);
        }

        // ===============================
        // 🧾 TÍTULO (DERECHA)
        // ===============================
        doc
            .fontSize(20)
            .fillColor(primary)
            .text('RECIBO DE PAGO', 300, 40, { align: 'right' });

        // ===============================
        // 💰 RESUMEN DERECHA
        // ===============================
        const rightX = 300;
        let y = 80;

        doc.fontSize(11).fillColor('black');

        doc.text(`FECHA: ${data.date}`, rightX, y, { align: 'right' });
        y += 15;
        doc.text(`TOTAL $: ${data.total}`, rightX, y, { align: 'right' });
        y += 15;
        doc.text(`DESCUENTO $: ${data.discount}`, rightX, y, { align: 'right' });
        y += 15;

        const net = Number(data.total) - Number(data.discount);

        doc
            .fillColor(primary)
            .text(`BUENO POR $: ${net}`, rightX, y, { align: 'right' });

        doc.fillColor('black');

        // ===============================
        // 🧍 DATOS
        // ===============================
        let startY = 160;

        const label = (text, x, y) => {
            doc.font('Helvetica-Bold').text(text, x, y);
        };

        const value = (text, x, y) => {
            doc.font('Helvetica').text(text, x, y);
        };

        // RECIBI DE
        label('RECIBÍ DE:', 40, startY);
        value(` ${data.members}`, 140, startY);

        startY += 25;

        // CONCEPTO
        label('POR CONCEPTO DE:', 40, startY);
        value(` ${data.concept}`, 180, startY);

        startY += 25;

        // FORMA PAGO + TIPO
        label('FORMA DE PAGO:', 40, startY);
        value(` ${data.payment_methods}`, 160, startY);

        label('TIPO DE PAGO:', 350, startY);
        value(` ${data.payment_type}`, 480, startY);

        startY += 25;

        // PRÓXIMA FECHA
        label('PRÓXIMA FECHA DE PAGO:', 40, startY);

        doc
            .fillColor(red)
            .font('Helvetica-Bold')
            .text(` ${data.next_payment_date}`, 260, startY);

        doc.fillColor('black').font('Helvetica');

        startY += 25;

        // ATENDIÓ
        label('ATENDIÓ:', 40, startY);
        value(` ${data.attended_by}`, 120, startY);

        // ===============================
        // 🔻 LÍNEA
        // ===============================
        doc
            .moveTo(40, startY + 40)
            .lineTo(550, startY + 40)
            .strokeColor('#ccc')
            .stroke();

        // ===============================
        // 📍 FOOTER IZQUIERDA
        // ===============================
        doc
            .fontSize(9)
            .fillColor(gray)
            .text('PASEO DE LA ESTANCIA NO. 501 11', 40, startY + 50);

        doc.text('LOCAL 6 PLANTA ALTA', 40, startY + 65);

        // ===============================
        // 🔢 FOLIO DERECHA
        // ===============================
        doc
            .fontSize(12)
            .fillColor(primary)
            .text(`FOLIO ${data.folio}`, 350, startY + 55, {
                align: 'right'
            });

        // ===============================
        // ❌ CANCELADO
        // ===============================
        if (data.is_cancelled) {
            doc
                .fontSize(60)
                .fillColor('red')
                .rotate(-20, { origin: [300, 400] })
                .text('CANCELADO', 100, 300, {
                    align: 'center',
                    width: 400
                });

            doc.rotate(20, { origin: [300, 400] });
        }

        doc.end();
    });
};