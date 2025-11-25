// services/passwordResetService.ts
import * as db from "./database";
import CryptoJS from "crypto-js";

// Generate a simple reset token (in a real app, use more secure tokens)
const generateResetToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// For this offline app, we'll store reset tokens in a temporary way
// In production, you'd use a backend
let resetTokens: Map<
  string,
  { userId: number; token: string; expiresAt: number }
> = new Map();

export const requestPasswordReset = async (
  username: string
): Promise<{ success: boolean; message: string; token?: string }> => {
  try {
    // Find user by username
    const user = await db.getUserByUsername(username);

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return {
        success: false,
        message: "If an account exists, you will receive reset instructions",
      };
    }

    // Generate reset token (valid for 1 hour)
    const token = generateResetToken();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store token
    resetTokens.set(token, {
      userId: user.id,
      token,
      expiresAt,
    });

    console.log("Password reset token generated:", token);
    console.log("Token valid until:", new Date(expiresAt).toLocaleString());

    return {
      success: true,
      message: "Reset token generated",
      token, // In real app, send via email instead
    };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return {
      success: false,
      message: "An error occurred. Please try again.",
    };
  }
};

export const validateResetToken = (token: string): boolean => {
  const resetData = resetTokens.get(token);

  if (!resetData) {
    return false;
  }

  // Check if token is expired
  if (Date.now() > resetData.expiresAt) {
    resetTokens.delete(token);
    return false;
  }

  return true;
};

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!validateResetToken(token)) {
      return {
        success: false,
        message: "Reset token is invalid or expired",
      };
    }

    const resetData = resetTokens.get(token);
    if (!resetData) {
      return {
        success: false,
        message: "Reset token not found",
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters",
      };
    }

    // Hash new password
    const passwordHash = CryptoJS.SHA256(newPassword).toString();

    // Update user password in database
    await db.updateUserPassword(resetData.userId, passwordHash);

    // Delete used token
    resetTokens.delete(token);

    console.log("Password reset successful for user:", resetData.userId);

    return {
      success: true,
      message: "Password has been reset successfully",
    };
  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      message: "An error occurred while resetting password",
    };
  }
};

export const clearExpiredTokens = (): void => {
  const now = Date.now();
  let cleared = 0;

  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expiresAt) {
      resetTokens.delete(token);
      cleared++;
    }
  }

  console.log(`Cleared ${cleared} expired reset tokens`);
};
