import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;

const getCallbackRegistry = (): Record<string, any> => {
  const g = global as any;
  if (!g.mpesaCallbacks) {
    g.mpesaCallbacks = {};
  }
  return g.mpesaCallbacks;
};

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ checkoutRequestId: string }> }
) {
  try {
    const params = await props.params;
    const checkoutRequestId = params.checkoutRequestId;

    if (!checkoutRequestId) {
      return NextResponse.json({ success: false, error: 'CheckoutRequestID is required' }, { status: 400 });
    }

    const registry = getCallbackRegistry();
    const callbackResult = registry[checkoutRequestId];

    if (!callbackResult) {
      // Check if it is a mock checkout and check for forced simulation parameters
      const url = new URL(req.url);
      const forceSimulate = url.searchParams.get('simulate');

      if (checkoutRequestId.startsWith('ws_CO_MOCK_')) {
        if (forceSimulate === 'success') {
          // Auto-register mock success
          const mockReceipt = 'NLJ' + Math.floor(10000000 + Math.random() * 90000000).toString() + 'SV';
          const mockResult = {
            status: 'success',
            resultCode: 0,
            resultDesc: 'The service request is processed successfully.',
            metadata: {
              amount: 100,
              mpesaReceiptNumber: mockReceipt,
              transactionDate: new Date().toISOString().replace(new RegExp('[-' + ':T]', 'g'), '').substring(0, 14),
              phoneNumber: '254712345678'
            },
            timestamp: Date.now()
          };
          registry[checkoutRequestId] = mockResult;
          return NextResponse.json(mockResult);
        } else if (forceSimulate === 'failed') {
          const mockResult = {
            status: 'failed',
            resultCode: 1032,
            resultDesc: 'Request cancelled by user',
            timestamp: Date.now()
          };
          registry[checkoutRequestId] = mockResult;
          return NextResponse.json(mockResult);
        }
      }

      // Default: still waiting for Safaricom callback
      return NextResponse.json({ status: 'pending' });
    }

    return NextResponse.json(callbackResult);

  } catch (error: any) {
    console.error('[M-Pesa Status Catch Error]:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
