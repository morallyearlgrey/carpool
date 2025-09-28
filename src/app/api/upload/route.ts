import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');
  return new GoogleGenerativeAI(apiKey);
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session as any)?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
      generationConfig: {
        temperature: 1,
        topK: 64,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    if (!imageFile) return NextResponse.json({ error: 'No image file provided' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type))
      return NextResponse.json({ error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP.' }, { status: 400 });

    if (imageFile.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: 'Image too large. Maximum size is 10MB.' }, { status: 400 });

    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const imagePart = { inlineData: { data: base64Image, mimeType: imageFile.type } };

    const result = await model.generateContent([{ text: prompt }, imagePart]);
    const analysis = await result.response.text();

    // --- CLEAN AND FIX GEMINI JSON ---
    const cleanedResponse = analysis
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const arrayContent = cleanedResponse.match(/\[([\s\S]*?)\]/);

    let parsedSchedule;
    if (arrayContent) {
      const arrayContentString = arrayContent[1].replace(/,\s*{[^}]*$/, ''); // remove incomplete last object
      const fixedJson = `{"availableTimes":[${arrayContentString}]}`;

      try {
        parsedSchedule = JSON.parse(fixedJson);
      } catch {
        parsedSchedule = null;
      }
    }

    // --- FALLBACK: full-day default schedule ---
    if (!parsedSchedule || !Array.isArray(parsedSchedule.availableTimes)) {
      parsedSchedule = {
        availableTimes: [
          { day: "Sunday", startTime: "00:00", endTime: "23:59", beginLocation: { lat: 0, long: 0 }, finalLocation: { lat: 0, long: 0 } },
          { day: "Monday", startTime: "00:00", endTime: "23:59", beginLocation: { lat: 0, long: 0 }, finalLocation: { lat: 0, long: 0 } },
          { day: "Tuesday", startTime: "00:00", endTime: "23:59", beginLocation: { lat: 0, long: 0 }, finalLocation: { lat: 0, long: 0 } },
          { day: "Wednesday", startTime: "00:00", endTime: "23:59", beginLocation: { lat: 0, long: 0 }, finalLocation: { lat: 0, long: 0 } },
          { day: "Thursday", startTime: "00:00", endTime: "23:59", beginLocation: { lat: 0, long: 0 }, finalLocation: { lat: 0, long: 0 } },
          { day: "Friday", startTime: "00:00", endTime: "23:59", beginLocation: { lat: 0, long: 0 }, finalLocation: { lat: 0, long: 0 } },
          { day: "Saturday", startTime: "00:00", endTime: "23:59", beginLocation: { lat: 0, long: 0 }, finalLocation: { lat: 0, long: 0 } },
        ]
      };
    }

    // --- SAVE SCHEDULE ---
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const scheduleUrl = `${baseUrl}/api/schedule`;

    const scheduleResponse = await fetch(scheduleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
      body: JSON.stringify(parsedSchedule),
    });

    const savedSchedule = await scheduleResponse.json();

    if (!scheduleResponse.ok) throw new Error(savedSchedule.error || 'Schedule save failed');

    return NextResponse.json({
      success: true,
      message: 'Image analyzed and schedule saved successfully',
      schedule: savedSchedule.schedule,
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
