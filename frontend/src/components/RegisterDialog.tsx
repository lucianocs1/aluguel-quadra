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
import { useAuth } from "@/contexts/AuthContext";
import type { CriarUsuarioDto, UsuarioDto } from "@/types/api";

interface RegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState = {
  nome: "",
  sobrenome: "",
  email: "",
  senha: "",
};

const RegisterDialog = ({ open, onOpenChange }: RegisterDialogProps) => {
  const [formState, setFormState] = useState(initialState);
  const { toast } = useToast();
  const { login } = useAuth();

  const mutation = useMutation<UsuarioDto, ApiError, CriarUsuarioDto>({
    mutationFn: (payload) => api.registrarUsuario(payload),
    onSuccess: (usuario) => {
      login(usuario);

      toast({
        title: "Usuário registrado com sucesso!",
        description: "Agora você já pode reservar suas quadras preferidas.",
      });

      onOpenChange(false);
      setFormState(initialState);
    },
    onError: (error) => {
      const message =
        error.status === 409
          ? "Já existe um usuário cadastrado com este e-mail. Tente fazer login ou utilize outro endereço."
          : error.message || "Não foi possível concluir o cadastro.";

      toast({
        title: "Erro ao registrar",
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

    const payload = {
      nome: formState.nome.trim(),
      sobrenome: formState.sobrenome.trim(),
      email: formState.email.trim().toLowerCase(),
      senha: formState.senha,
    };

    if (!payload.nome || !payload.sobrenome || !payload.email || !payload.senha) {
      toast({
        title: "Preencha todos os campos",
        description: "É necessário informar nome, sobrenome, e-mail e senha.",
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

    if (payload.senha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve conter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(payload);
  };

  const isSubmitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Crie sua conta</DialogTitle>
          <DialogDescription>
            Informe seus dados para começar a reservar quadras em poucos cliques.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formState.nome}
                onChange={handleChange("nome")}
                placeholder="Maria"
                autoComplete="given-name"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sobrenome">Sobrenome</Label>
              <Input
                id="sobrenome"
                value={formState.sobrenome}
                onChange={handleChange("sobrenome")}
                placeholder="Silva"
                autoComplete="family-name"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formState.email}
              onChange={handleChange("email")}
              placeholder="maria.silva@email.com"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={formState.senha}
              onChange={handleChange("senha")}
              placeholder="********"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterDialog;
