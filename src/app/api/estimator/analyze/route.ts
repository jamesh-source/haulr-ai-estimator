import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { AIEstimate, DetectedItem, ItemCategory } from '@/types';

// ---------------------------------------------------------------------------
// OpenAI client (initialized lazily to avoid build-time errors)
// ---------------------------------------------------------------------------

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert junk removal estimator AI.
Analyze images of junk removal job sites and respond with a detailed JSON estimate.

Respond ONLY with valid JSON in this exact structure (no markdown fences):
{
  "items_detected": [
    {
      "name": "string (item name, lowercase)",
      "quantity": number,
      "estimated_volume_cf": number (cubic feet per unit),
      "estimated_weight_lbs": number (lbs per unit),
      "category": "furniture" | "appliance" | "electronics" | "debris" | "yard" | "metal" | "hazmat" | "other",
      "donation_potential": boolean,
      "recycling_potential": boolean,
      "confidence": number (0.0 to 1.0)
    }
  ],
  "total_cubic_yards": number,
  "truck_percentage": number (0-100, assumes 15yd truck),
  "trailer_percentage": number (0-100),
  "estimated_labor_hours": number,
  "estimated_dump_cost": number (USD),
  "suggested_price": number (USD, retail price including labor/dump/margin),
  "suggested_profit_margin": number (0.0 to 1.0),
  "hazard_warnings": ["string array of any hazardous items"],
  "donation_items": ["item names suitable for donation"],
  "recycling_items": ["item names suitable for recycling"],
  "confidence_score": number (0.0 to 1.0, overall estimate confidence),
  "analysis_notes": "string (brief summary of the load and any special notes)"
}

Pricing guidelines:
- Base: ~$150 minimum
- ~$130-180 per cubic yard for typical residential junk
- Labor: 2 workers at $35/hr each
- Dump fee: $50 base + $20/yd
- Target 35-45% profit margin
- Donation-eligible items reduce dump cost
- Hazmat items add disposal fees`;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();

    // Collect all photo files from the form
    const imageMessages: OpenAI.Chat.ChatCompletionContentPart[] = [];
    let photoCount = 0;

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('photo_') && value instanceof Blob) {
        const file = value as File;
        const isVideo = file.type.startsWith('video/');

        // Skip video files for OpenAI vision (not supported)
        if (isVideo) continue;

        // Convert to base64 — resize large images to reduce payload size
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let finalBuffer = buffer;

        // If file is over 1.5MB, use sharp to resize it (keeps quality good for AI vision)
        if (buffer.byteLength > 1.5 * 1024 * 1024) {
          try {
            const sharp = (await import('sharp')).default;
            finalBuffer = await sharp(buffer)
              .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 85 })
              .toBuffer();
          } catch {
            // If sharp fails, use original
            finalBuffer = buffer;
          }
        }

        const base64 = finalBuffer.toString('base64');
        const mimeType = file.type.includes('heic') ? 'image/jpeg' : file.type || 'image/jpeg';

        imageMessages.push({
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: 'high',
          },
        });
        photoCount++;

        // OpenAI allows up to 20 images per request
        if (photoCount >= 20) break;
      }
    }

    if (photoCount === 0) {
      return NextResponse.json(
        { error: { message: 'No valid image files found in request' } },
        { status: 400 }
      );
    }

    // Call GPT-4o with vision
    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these ${photoCount} photo(s) of a junk removal job site. Identify all items and provide a complete estimate JSON.`,
            },
            ...imageMessages,
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '';

    // Parse JSON response — strip markdown fences if present
    let parsed: AIEstimate;
    try {
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned) as AIEstimate;
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { error: { message: 'AI returned an invalid response. Please try again.' } },
        { status: 500 }
      );
    }

    // Validate and normalize
    const estimate: AIEstimate = {
      items_detected: (parsed.items_detected ?? []).map((item): DetectedItem => ({
        name: String(item.name ?? 'unknown item'),
        quantity: Number(item.quantity ?? 1),
        estimated_volume_cf: Number(item.estimated_volume_cf ?? 5),
        estimated_weight_lbs: Number(item.estimated_weight_lbs ?? 50),
        category: (item.category ?? 'other') as ItemCategory,
        donation_potential: Boolean(item.donation_potential),
        recycling_potential: Boolean(item.recycling_potential),
        confidence: Math.min(1, Math.max(0, Number(item.confidence ?? 0.7))),
      })),
      total_cubic_yards: Number(parsed.total_cubic_yards ?? 5),
      truck_percentage: Number(parsed.truck_percentage ?? 33),
      trailer_percentage: Number(parsed.trailer_percentage ?? 0),
      estimated_labor_hours: Number(parsed.estimated_labor_hours ?? 2),
      estimated_dump_cost: Number(parsed.estimated_dump_cost ?? 100),
      suggested_price: Number(parsed.suggested_price ?? 350),
      suggested_profit_margin: Number(parsed.suggested_profit_margin ?? 0.4),
      hazard_warnings: Array.isArray(parsed.hazard_warnings) ? parsed.hazard_warnings.map(String) : [],
      donation_items: Array.isArray(parsed.donation_items) ? parsed.donation_items.map(String) : [],
      recycling_items: Array.isArray(parsed.recycling_items) ? parsed.recycling_items.map(String) : [],
      confidence_score: Math.min(1, Math.max(0, Number(parsed.confidence_score ?? 0.75))),
      analysis_notes: String(parsed.analysis_notes ?? ''),
    };

    return NextResponse.json({ estimate });
  } catch (err: unknown) {
    console.error('[estimator/analyze] Error:', err);
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    );
  }
}
