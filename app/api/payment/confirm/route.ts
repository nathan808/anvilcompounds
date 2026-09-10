import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // 1. Verify the shared secret
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.MAIN_SITE_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    const url = process.env.WC_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;
    if (!url || !key || !secret) {
        return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
        const res = await fetch(`${url}/wp-json/wc/v3/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({ status: 'processing' }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('WC update failed:', errorText);
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        console.log(`Order ${orderId} updated to processing via Stripe webhook`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
