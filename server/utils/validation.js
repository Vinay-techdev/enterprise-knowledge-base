import mongoose from "mongoose";

export const cleanText = (value = "") => String(value).trim().replace(/\s+/g, " ");
export const normalizeEmail = (value = "") => String(value).trim().toLowerCase();
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
export const isStrongPassword = (value) => typeof value === "string" && value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
export const isObjectId = (value) => mongoose.isValidObjectId(value);
