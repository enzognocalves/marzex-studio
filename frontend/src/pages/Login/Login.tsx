import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/card/Card";
import Input from "../../components/input/Input";
import Button from "../../components/Button/Button";
import { supabase } from "../../supabase";

import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function translateAuthError(message: string) {
    const lower = message.toLowerCase();
    if (lower.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }
    if (lower.includes("user already registered")) {
      return "Este e-mail já está cadastrado. Tente entrar na sua conta.";
    }
    if (lower.includes("password should be at least")) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }
    if (lower.includes("email not confirmed")) {
      return "E-mail ainda não confirmado. Verifique sua caixa de entrada ou desative a confirmação no painel.";
    }
    if (lower.includes("invalid email") || lower.includes("unable to validate email")) {
      return "Digite um endereço de e-mail válido.";
    }
    return "Não foi possível concluir a autenticação. Tente novamente.";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setErrorMessage("Preencha o e-mail e a senha.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage("Digite um e-mail válido.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) {
          setErrorMessage(translateAuthError(error.message));
          return;
        }

        if (data.session) {
          navigate("/dashboard", { replace: true });
        } else {
          setSuccessMessage("Conta criada com sucesso! Agora você já pode entrar.");
          setIsSignUp(false);
          setConfirmPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setErrorMessage(translateAuthError(error.message));
          return;
        }

        navigate("/dashboard", { replace: true });
      }
    } catch {
      setErrorMessage("Erro de conexão ao tentar autenticar.");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setIsSignUp((prev) => !prev);
    setErrorMessage("");
    setSuccessMessage("");
    setConfirmPassword("");
  }

  return (
    <main className="login">
      <div className="login-background">
        <div className="login-glow login-glow-one" />
        <div className="login-glow login-glow-two" />
      </div>

      <Card>
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">M</div>

            <h1>Marzex Studio</h1>

            <p>
              {isSignUp
                ? "Crie sua conta para salvar e gerenciar seus projetos."
                : "Entre na sua conta para começar a criar."}
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <Input
              label="E-mail"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo de 6 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {isSignUp && (
              <Input
                label="Confirmar senha"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            )}

            {errorMessage && (
              <p
                role="alert"
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#dc2626",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(34, 197, 94, 0.12)",
                  color: "#15803d",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {successMessage}
              </p>
            )}

            <Button type="submit">
              {loading
                ? isSignUp
                  ? "Criando conta..."
                  : "Entrando..."
                : isSignUp
                ? "Criar conta"
                : "Entrar"}
            </Button>
          </form>

          <div className="login-footer">
            <span>
              {isSignUp ? "Já possui uma conta?" : "Ainda não possui uma conta?"}
            </span>

            <button type="button" onClick={toggleMode}>
              {isSignUp ? "Entrar" : "Criar conta"}
            </button>
          </div>
        </div>
      </Card>
    </main>
  );
}

export default Login;