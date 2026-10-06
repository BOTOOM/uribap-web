"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/Icon";

type Toast = { id: number; message: string };

let nextId = 1;

export function ToastRegion() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      if (!message) return;
      const id = nextId++;
      setToasts((current) => [...current.slice(-3), { id, message }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4200);
    }
    window.addEventListener("uribap:toast", onToast);
    return () => window.removeEventListener("uribap:toast", onToast);
  }, []);

  return (
    <div aria-live="polite" className="toast-region" role="region">
      {toasts.map((toastItem) => (
        <div className="toast" key={toastItem.id} role="status">
          <span>{toastItem.message}</span>
          <button
            aria-label="Descartar aviso"
            onClick={() =>
              setToasts((current) => current.filter((item) => item.id !== toastItem.id))
            }
            type="button"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
