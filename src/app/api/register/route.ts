import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import User from "@/lib/models/user"; 

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Destructure form data
    const { email, password, firstName, lastName, age, gender, vehicleInfo } = data;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create the user in MongoDB
    const newUser = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      age,
      gender,
      vehicleInfo: {
        seatsAvailable: vehicleInfo?.seatsAvailable,
        make: vehicleInfo?.make,
        model: vehicleInfo?.model,
        year: vehicleInfo?.year,
      },
    });

    return NextResponse.json({ message: "User registered successfully", userId: newUser._id });
 } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}