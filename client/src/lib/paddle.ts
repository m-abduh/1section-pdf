"use client";

const PADDLE_SCRIPT = "https://cdn.paddle.com/paddle/v2/paddle.js";

type PaddleGlobal = {
  Environment: { set: (env: string) => void };
  Initialize: (options: { token: string }) => void;
  Checkout: {
    open: (options: Record<string, unknown>) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

let loader: Promise<PaddleGlobal> | null = null;

export function getPaddle(): Promise<PaddleGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paddle.js is only available in the browser"));
  }
  if (loader) return loader;

  loader = new Promise<PaddleGlobal>((resolve, reject) => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) {
      reject(new Error("Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"));
      return;
    }

    const initialize = () => {
      const paddle = window.Paddle;
      if (!paddle) {
        reject(new Error("Paddle.js failed to load"));
        return;
      }
      const environment = process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox";
      if (environment === "sandbox") {
        paddle.Environment.set("sandbox");
      }
      paddle.Initialize({ token });
      resolve(paddle);
    };

    if (window.Paddle) {
      initialize();
      return;
    }

    const script = document.createElement("script");
    script.src = PADDLE_SCRIPT;
    script.async = true;
    script.onload = initialize;
    script.onerror = () => reject(new Error("Failed to load Paddle.js"));
    document.head.appendChild(script);
  });

  return loader;
}
