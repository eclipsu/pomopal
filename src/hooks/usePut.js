import { useState } from "react";

export function usePut(url) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(data) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong");
        return null;
      }

      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, error };
}
