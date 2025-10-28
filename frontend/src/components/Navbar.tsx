import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import RegisterDialog from "@/components/RegisterDialog";
import LoginDialog from "@/components/LoginDialog";
import type { UsuarioDto } from "@/types/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [usuario, setUsuario] = useState<{ id: string; nome: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const id = window.localStorage.getItem("usuarioId");
    const nome = window.localStorage.getItem("usuarioNome");

    if (id && nome) {
      setUsuario({ id, nome });
    }
  }, []);

  const handleAuthenticated = (dados: UsuarioDto) => {
    const nomeCompleto = `${dados.nome} ${dados.sobrenome}`.trim();
    setUsuario({ id: dados.id, nome: nomeCompleto });
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("usuarioId");
      window.localStorage.removeItem("usuarioNome");
    }

    setUsuario(null);
    toast({ title: "Você saiu da conta." });
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
              NQ
            </div>
            <span className="text-2xl font-bold text-foreground">Nossa Quadra</span>
          </div>

          <div className="flex items-center space-x-3">
            {usuario ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-foreground sm:text-base">{`Olá, ${usuario.nome}!`}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="lg">
                      Sair
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deseja sair da conta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você precisará fazer login novamente para continuar fazendo reservas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>Sair</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <>
                <Button variant="outline" size="lg" onClick={() => setLoginOpen(true)}>
                  Entrar
                </Button>
                <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => setRegisterOpen(true)}>
                  Registrar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <RegisterDialog open={registerOpen} onOpenChange={setRegisterOpen} onRegistered={handleAuthenticated} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} onLoggedIn={handleAuthenticated} />
    </nav>
  );
};

export default Navbar;
