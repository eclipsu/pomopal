"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** Soft, Duolingo-ish toasts for the whole app. */
export default function AppToasts() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={3200}
      hideProgressBar
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable={false}
      theme="light"
      toastClassName="pomopal-toast"
      bodyClassName="pomopal-toast-body"
      closeButton={false}
      icon={false}
    />
  );
}
