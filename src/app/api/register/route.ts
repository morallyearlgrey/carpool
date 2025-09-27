import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import clientPromise from "@/lib/mongodb";


async function getDB() {
  const client = await clientPromise;
  await client.connect();   
  return client.db("carpool");
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDB();
    const data = await req.json();
    console.log("Received data:", data);

    const { email, password, firstName, lastName, age, gender, vehicleInfo } = data;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await db.collection("users").findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const userDoc = {
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
      age: age || 0,
      gender,
      vehicleInfo: vehicleInfo || { 
        seatsAvailable: vehicleInfo?.seatsAvailable || 0,
        make: vehicleInfo?.make || "",
        model: vehicleInfo?.model || "",
        year: vehicleInfo?.year || "",

      },
      currentRide: null,
      rides: [],
      schedule: [],
      requests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(userDoc);
    console.log("User created successfully:", result.insertedId);

    const { password: _omit, ...userWithoutPassword } = userDoc;

    return NextResponse.json({ 
      user: { 
        _id: result.insertedId, 
        ...userWithoutPassword 
      } 
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST user error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: "Failed to create user", 
      details: error.message 
    }, { status: 500 });
  }
}