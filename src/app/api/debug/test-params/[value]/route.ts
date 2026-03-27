import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ value: string }> }
) {
  const { value } = await params;
  
  return NextResponse.json({
    rawParam: value,
    isEncoded: value.includes('%'),
    decodedValue: decodeURIComponent(value),
    doubleDecode: (() => {
      try {
        return decodeURIComponent(decodeURIComponent(value));
      } catch {
        return 'failed';
      }
    })(),
    requestUrl: request.url,
  });
}
