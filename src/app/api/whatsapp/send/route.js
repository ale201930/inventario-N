import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, text, pdfDataUri, cliente_nombre } = body;

    if (!phone) {
      return NextResponse.json({ error: 'El número de teléfono del cliente es requerido' }, { status: 400 });
    }

    // Clean phone number for Venezuela (58)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '58' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('58') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
      if (cleanPhone.length === 10) cleanPhone = '58' + cleanPhone;
    }

    // Check if an external WhatsApp API Gateway is configured in env
    const waGatewayUrl = process.env.WHATSAPP_GATEWAY_URL;
    const waApiKey = process.env.WHATSAPP_API_KEY;

    if (waGatewayUrl && waApiKey) {
      // Background automated dispatch via configured Gateway API (UltraMsg/Evolution/Whapi/Meta)
      const apiRes = await fetch(waGatewayUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${waApiKey}`
        },
        body: JSON.stringify({
          phone: cleanPhone,
          body: text,
          document: pdfDataUri,
          filename: `Factura_${cleanPhone}.pdf`
        })
      });

      if (apiRes.ok) {
        return NextResponse.json({ 
          success: true, 
          message: `Factura y comprobante enviados con éxito en segundo plano a ${cleanPhone}`,
          sentViaGateway: true 
        });
      }
    }

    // Direct universal link fallback for 1-click dispatch
    const encoded = encodeURIComponent(text);
    const directUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    return NextResponse.json({
      success: true,
      sentViaGateway: false,
      phone: cleanPhone,
      whatsappUrl: directUrl,
      message: 'Enlace de envío generado con éxito'
    });
  } catch (err) {
    return NextResponse.json({ error: 'Error procesando envío de WhatsApp: ' + err.message }, { status: 500 });
  }
}
