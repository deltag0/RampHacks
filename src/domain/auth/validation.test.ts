import { describe, expect, it } from "vitest";
import {
  safeNextPath,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./validation";

describe("authentication validation", () => {
  it("accepts a valid sign-in", () => {
    expect(
      signInSchema.safeParse({
        email: "member@example.com",
        password: "correct horse battery staple",
      }).success,
    ).toBe(true);
  });

  it("rejects mismatched sign-up passwords", () => {
    const result = signUpSchema.safeParse({
      displayName: "Taylor",
      email: "member@example.com",
      password: "a-secure-password",
      confirmPassword: "a-different-password",
    });

    expect(result.success).toBe(false);
  });

  it("rejects short replacement passwords", () => {
    expect(
      updatePasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows local application paths", () => {
    expect(safeNextPath("/dashboard?welcome=true")).toBe(
      "/dashboard?welcome=true",
    );
  });

  it.each([
    ["https://attacker.example"],
    ["//attacker.example"],
    [""],
    [undefined],
  ])("rejects an unsafe redirect target", (target) => {
    expect(safeNextPath(target)).toBe("/dashboard");
  });
});
