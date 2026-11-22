import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../supabase";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Estudio from "../pages/Estudio/estudio";
import { Projetos } from "../pages/Projetos/Projetos";
import { Biblioteca } from "../pages/Biblioteca/Biblioteca";
import MainLayout from "../layout/MainLayout/MainLayout";

function Perfil({ session }: { session: Session | null }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" }}>
      <h1>Perfil</h1>
      <p>Configurações do perfil do produtor.</p>
      {session?.user?.email && (
        <p style={{ fontSize: "14px", opacity: 0.8 }}>
          Conectado como: <strong>{session.user.email}</strong>
        </p>
      )}
      <button
        type="button"
        onClick={handleLogout}
        style={{
          width: "fit-content",
          padding: "10px 18px",
          borderRadius: "8px",
          border: "none",
          background: "#ef4444",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Sair da conta
      </button>
    </div>
  );
}

function Configuracoes() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Configurações</h1>
      <p>Configurações do Marzex Studio.</p>
    </div>
  );
}

function ProtectedRoute({
  session,
  loading,
  children,
}: {
  session: Session | null;
  loading: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Carregando sessão...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function AppRoutes() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            !loading && session ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session} loading={loading}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projetos"
          element={
            <ProtectedRoute session={session} loading={loading}>
              <Projetos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estudio"
          element={
            <ProtectedRoute session={session} loading={loading}>
              <Estudio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/biblioteca"
          element={
            <ProtectedRoute session={session} loading={loading}>
              <Biblioteca />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute session={session} loading={loading}>
              <Perfil session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute session={session} loading={loading}>
              <Configuracoes />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to={session ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;