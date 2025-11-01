import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import RegisterDialog from "@/components/RegisterDialog";
import LoginDialog from "@/components/LoginDialog";
import { PerfilUsuario } from "@/types/api";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = useMemo(() => {
    const links = [
      {
        label: "Início",
        to: "/",
      },
    ];

    if (usuario?.perfil === PerfilUsuario.Administrador) {
      links.push({ label: "Painel admin", to: "/admin" });
    }

    return links;
  }, [usuario?.perfil]);

  const initials = useMemo(() => {
    if (!usuario?.nome) return "";
    const parts = usuario.nome.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    const combined = `${first}${last}`.toUpperCase();
    if (combined.trim()) {
      return combined;
    }
    return parts[0]?.slice(0, 2).toUpperCase() ?? "";
  }, [usuario?.nome]);

  const perfilLabel = usuario?.perfil === PerfilUsuario.Administrador ? "Administrador" : "Cliente";

  const handleLogout = () => {
    logout();
    navigate("/");
    toast({ title: "Você saiu da conta." });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-gradient-to-r from-background/90 via-background/80 to-background/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-lg font-semibold text-primary-foreground shadow-sm">
                NQ
              </div>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Nossa Quadra</span>
                <span className="text-xs text-muted-foreground sm:text-sm">Reserve quadras de areia com praticidade</span>
              </div>
            </Link>
            <div className="hidden items-center gap-2 md:flex">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={`rounded-full px-4 text-sm font-medium transition ${
                  location.pathname === "/"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link to="/">Início</Link>
              </Button>
              {usuario?.perfil === PerfilUsuario.Administrador ? (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className={`rounded-full px-4 text-sm font-medium transition ${
                    location.pathname.startsWith("/admin")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link to="/admin">Painel admin</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              {usuario ? (
                <div className="flex items-center gap-3">
                  <div className="hidden flex-col text-right sm:flex">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Bem-vindo</span>
                    <span className="text-sm font-semibold text-foreground">{usuario.nome}</span>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card text-sm font-semibold uppercase text-foreground">
                    {initials || usuario.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-full px-4">
                        <LogOut className="mr-2 h-4 w-4" /> Sair
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
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="rounded-full px-4" onClick={() => setLoginOpen(true)}>
                    Entrar
                  </Button>
                  <Button size="sm" className="rounded-full bg-primary px-4 text-sm font-semibold hover:bg-primary/90" onClick={() => setRegisterOpen(true)}>
                    Registrar
                  </Button>
                </div>
              )}
            </div>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-6 bg-background/95">
                <SheetHeader>
                  <SheetTitle className="text-lg font-semibold text-foreground">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1">
                  <Button
                    asChild
                    variant="ghost"
                    className={`justify-start rounded-xl px-4 py-6 text-base ${
                      location.pathname === "/"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link to="/">Início</Link>
                  </Button>
                  {usuario?.perfil === PerfilUsuario.Administrador ? (
                    <Button
                      asChild
                      variant="ghost"
                      className={`justify-start rounded-xl px-4 py-6 text-base ${
                        location.pathname.startsWith("/admin")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/admin">Painel admin</Link>
                    </Button>
                  ) : null}
                </div>
                <Separator />
                <div className="flex flex-col gap-3">
                  {usuario ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 p-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
                          {initials || usuario.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{usuario.nome}</span>
                          <span className="text-xs text-muted-foreground">Perfil: {perfilLabel}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="rounded-xl py-6 text-base">
                            <LogOut className="mr-2 h-5 w-5" /> Sair da conta
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
                            <AlertDialogAction
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                handleLogout();
                              }}
                            >
                              Sair
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        className="rounded-xl py-6 text-base"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setLoginOpen(true);
                        }}
                      >
                        Entrar
                      </Button>
                      <Button
                        className="rounded-xl bg-primary py-6 text-base font-semibold hover:bg-primary/90"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setRegisterOpen(true);
                        }}
                      >
                        Criar conta
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <RegisterDialog open={registerOpen} onOpenChange={setRegisterOpen} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </nav>
  );
};

export default Navbar;
