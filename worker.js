//This file is currently closed
export default {
  async fetch(request, env) {
    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405 });
    }

    // Parse JSON from request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { token } = body;
    if (!token) {
      return new Response("Missing CAPTCHA token", { status: 400 });
    }

    // Verify token with Google reCAPTCHA
    const formData = new URLSearchParams();
    formData.append("secret", env.RECAPTCHA_SECRET); // your secret key from environment variable
    formData.append("response", token);

    const googleRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      { method: "POST", body: formData }
    );

    const data = await googleRes.json();
    if (!data.success) {
      return new Response(JSON.stringify({ error: "CAPTCHA failed" }), { status: 400 });
    }

    // Increment view counter in KV
    let views = await env.VIEWS.get("count");
    views = views ? parseInt(views) + 1 : 1;
    await env.VIEWS.put("count", views.toString());

    // Return updated views
    return new Response(JSON.stringify({ views }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
