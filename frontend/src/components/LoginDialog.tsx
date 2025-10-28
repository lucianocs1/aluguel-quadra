import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/services/api";
import type { LoginUsuarioDto, UsuarioDto } from "@/types/api";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoggedIn?: (usuario: UsuarioDto) => void;
}

const initialState = {
  email: "",
  senha: "",
};

const LoginDialog = ({ open, onOpenChange, onLoggedIn }: LoginDialogProps) => {
  const [formState, setFormState] = useState(initialState);
  const { toast } = useToast();

  const mutation = useMutation<UsuarioDto, ApiError, LoginUsuarioDto>({
    mutationFn: (payload) => api.login(payload),
    onSuccess: (usuario) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("usuarioId", usuario.id);
        const nomeCompleto = `${usuario.nome} ${usuario.sobrenome}`.trim();
        window.localStorage.setItem("usuarioNome", nomeCompleto);
      }

      onLoggedIn?.(usuario);

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });

      onOpenChange(false);
      setFormState(initialState);
    },
    onError: (error) => {
      let message = "Não foi possível fazer login agora. Tente novamente em instantes.";

      if (error.status === 401) {
        message = "E-mail ou senha incorretos. Verifique os dados e tente novamente.";
      } else if (error.status === 400) {
        message = error.message || message;
      }

      toast({
        title: "Erro ao entrar",
        description: message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!open) {
      setFormState(initialState);
    }
  }, [open]);

  const handleChange = (key: keyof typeof formState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: LoginUsuarioDto = {
      email: formState.email.trim().toLowerCase(),
      senha: formState.senha,
    };

    if (!payload.email || !payload.senha) {
      toast({
        title: "Informe e-mail e senha",
        description: "Os dois campos são obrigatórios para entrar.",
        variant: "destructive",
      });
      return;
    }

    if (!payload.email.includes("@")) {
      toast({
        title: "E-mail inválido",
        description: "Informe um endereço de e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(payload);
  };

  const isSubmitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Entrar</DialogTitle>
          <DialogDescription>
            Acesse utilizando seu e-mail e senha cadastrados para gerenciar suas reservas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              type="email"
              value={formState.email}
              onChange={handleChange("email")}
              placeholder="seu.email@email.com"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-senha">Senha</Label>
            <Input
              id="login-senha"
              type="password"
              value={formState.senha}
              onChange={handleChange("senha")}
              placeholder="********"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
