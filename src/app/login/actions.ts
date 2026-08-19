"use server";

import { redirect } from "next/navigation";

export async function login() {
  redirect("/sign-in");
}

export async function logout() {
  redirect("/sign-in");
}
