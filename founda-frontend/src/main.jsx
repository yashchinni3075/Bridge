import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FreelancerProvider } from "./context/FreelancerContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FreelancerProvider>
          <App />
        </FreelancerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
