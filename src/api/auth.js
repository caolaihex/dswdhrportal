const API_URL = "http://localhost:5000";

const safeJson = async (response) => {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("SERVER RESPONSE IS NOT JSON:", text);

    return {
      success: false,
      message: text || "Invalid server response",
    };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email?.trim(),
        password,
      }),
    });

    const data = await safeJson(response);

    return {
      ok: response.ok,
      data,
    };
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return {
      ok: false,
      data: {
        success: false,
        message: "Server error",
      },
    };
  }
};

export const sendOtp = async (email) => {
  try {
    const response = await fetch(`${API_URL}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email?.trim(),
      }),
    });

    const data = await safeJson(response);

    return {
      ok: response.ok,
      data,
    };
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return {
      ok: false,
      data: {
        success: false,
        message: "Failed to send OTP",
      },
    };
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const response = await fetch(`${API_URL}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email?.trim(),
        otp: otp?.trim(),
      }),
    });

    const data = await safeJson(response);

    return {
      ok: response.ok,
      data,
    };
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return {
      ok: false,
      data: {
        success: false,
        message: "Failed to verify OTP",
      },
    };
  }
};

export const getProfile = async (id) => {
  try {
    if (!id) {
      return {
        ok: false,
        data: {
          success: false,
          message: "User ID is missing",
        },
      };
    }

    const response = await fetch(`${API_URL}/users/${id}/profile`);
    const data = await safeJson(response);

    return {
      ok: response.ok,
      data,
    };
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return {
      ok: false,
      data: {
        success: false,
        message: "Failed to fetch profile",
      },
    };
  }
};

export const updateProfile = async (id, profileData) => {
  try {
    const response = await fetch(`${API_URL}/update-profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const data = await safeJson(response);

    return {
      ok: response.ok,
      data,
    };
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return {
      ok: false,
      data: {
        success: false,
        message: "Failed to update profile",
      },
    };
  }
};