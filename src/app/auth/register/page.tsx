
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const registerSchema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),

    firstName: z.string().min(1, "First name must be at least 1 character"),
    lastName: z.string().min(1, "Last name must be at least 1 character"),

    age: z.number().min(0, "Age must be at least 0"),
    gender: z.enum(["Male", "Female", "Other"]),

    vehicleInfo: z.object({
        seatsAvailable: z.number().min(1, "Seats must be at least 1").optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.string().optional(),
    }).optional()
});

const genders = [
    "Male",
    "Female",
    "Other"

]

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() { 
      const { status } = useSession();
        const isLoggedIn = status === "authenticated";
        
    const [hasVehicle, setHasVehicle] = useState(false);
    const router = useRouter();

   const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        age: undefined,
        gender: "Other",
        vehicleInfo: {
            seatsAvailable: undefined,
            make: "",
            model: "",
            year: ""
        }
    }
    });

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values)
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Registration failed");
        }

        // Try to sign the user in immediately using the credentials provider
        const signInResult = await signIn("credentials", {
            redirect: false,
            email: values.email,
            password: values.password,
        });

        if (signInResult?.error) {
            // If sign in failed for some reason, send them to the sign-in page
            router.push("/auth/signin");
        } else {
            // On success, send the new user to the schedule maker page
            router.push("/schedule");
        }
        } catch (err: unknown) {
            console.error('Registration error:', err);
        }

    }

    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden">
                      <Navbar isLoggedIn={isLoggedIn}></Navbar>
            

             <main className="flex-grow flex items-center justify-center p-4">
        
        <div className="w-full max-w-sm bg-[#f7f5fc] p-8 rounded-3xl shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#663399]">SIGN UP</h2>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* email; firstname; lastname; gender; age; vehicle */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Email" {...field} />
                                    </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                                       
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="First Name" {...field} />
                                    </FormControl>
                                       
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Last Name" {...field} />
                                    </FormControl>
                                       
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {genders.map((gender)=>(
                                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Age</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0" max="100" placeholder="0" {...field} onChange={(e) => field.onChange(Number(e.target.value))}/>
                                    </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <div className="flex items-center space-x-2">
                    <Checkbox
                        id="vehicle"
                        checked={hasVehicle}
                        onCheckedChange={() => setHasVehicle(!hasVehicle)}
                    />
                    <Label htmlFor="vehicle">Do you have a vehicle?</Label>
                    </div>

                    {hasVehicle ? (
                    <>
                        <FormField
                        control={form.control}
                        name="vehicleInfo.make"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Make</FormLabel>
                            <FormControl>
                                <Input placeholder="Toyota" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="vehicleInfo.model"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                                <Input placeholder="Camry" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="vehicleInfo.year"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                                <Input placeholder="2020" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="vehicleInfo.seatsAvailable"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Seats Available</FormLabel>
                            <FormControl>
                                <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))}/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </>
                    ) : (<div></div>)
                    }



                    <Button type="submit" className="px-4 py-1.5 text-sm md:px-6 md:py-2 md:text-base bg-transparent text-[#663399] font-medium rounded-full border border-[#663399] hover:bg-[#663399]/60  whitespace-nowrap cursor-pointer transition-all duration-300">Submit</Button>
                </form>
            </Form>
                    </div>
    </main>
        </div>

    )

}