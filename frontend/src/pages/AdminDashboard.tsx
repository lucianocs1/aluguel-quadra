import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError, QuadraFormPayload, QuadraUpdatePayload } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { resolveQuadraImage } from "@/lib/images";
import type {
  AtualizarQuadraDto,
  CriarQuadraDto,
  CriarUsuarioComPerfilDto,
  PerfilUsuario,
  Quadra,
  ReservaDto,
  UsuarioDto,
} from "@/types/api";
import { PerfilUsuario as PerfilUsuarioEnum, StatusReserva } from "@/types/api";

type QuadraFormState = {
  nome: string;
  modalidadePrincipal: string;
  precoPorHora: string;
  imagemFile: File | null;
  imagemPreview: string | null;
  existingImagemUrl: string | null;
  removerImagem: boolean;
};

const createDefaultQuadraForm = (): QuadraFormState => ({
  nome: "",
  modalidadePrincipal: "",
  precoPorHora: "",
  imagemFile: null,
  imagemPreview: null,
  existingImagemUrl: null,
  removerImagem: false,
});

const defaultUsuarioForm = {
  nome: "",
  sobrenome: "",
  email: "",
  senha: "",
  perfil: String(PerfilUsuarioEnum.Cliente),
};

const AdminDashboard = () => {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [quadraDialogOpen, setQuadraDialogOpen] = useState(false);
  const [usuarioDialogOpen, setUsuarioDialogOpen] = useState(false);
  const [editingQuadra, setEditingQuadra] = useState<Quadra | null>(null);
  const [quadraForm, setQuadraForm] = useState<QuadraFormState>(() => createDefaultQuadraForm());
  const [usuarioForm, setUsuarioForm] = useState(defaultUsuarioForm);

  useEffect(() => {
    const preview = quadraForm.imagemPreview;
    if (!preview || !preview.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [quadraForm.imagemPreview]);

  useEffect(() => {
    if (usuario && usuario.perfil !== PerfilUsuarioEnum.Administrador) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa ser administrador para acessar esta área.",
        variant: "destructive",
      });
    }
  }, [usuario, toast]);

  if (!usuario) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>Faça login como administrador para acessar o painel.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/">Voltar para o início</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isAdmin = usuario.perfil === PerfilUsuarioEnum.Administrador;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Acesso negado</CardTitle>
              <CardDescription>Esta área está disponível apenas para administradores.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/">Voltar para a página inicial</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const adminId = usuario.id;

  const quadrasQuery = useQuery<Quadra[], Error>({
    queryKey: ["quadras"],
    queryFn: () => api.getQuadras(),
    enabled: isAdmin,
  });

  const usuariosQuery = useQuery<UsuarioDto[], Error>({
    queryKey: ["admin-usuarios"],
    queryFn: () => api.listarUsuarios(adminId),
    enabled: isAdmin,
  });

  const reservasQuery = useQuery<ReservaDto[], Error>({
    queryKey: ["admin-reservas"],
    queryFn: () => api.listarReservas(adminId),
    enabled: isAdmin,
  });

  const criarQuadraMutation = useMutation<Quadra, ApiError, QuadraFormPayload>({
    mutationFn: (payload) => api.criarQuadra(adminId, payload),
    onSuccess: () => {
      toast({ title: "Quadra cadastrada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["quadras"] });
      setQuadraDialogOpen(false);
      setQuadraForm(createDefaultQuadraForm());
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar quadra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const atualizarQuadraMutation = useMutation<Quadra, ApiError, { id: string; payload: QuadraUpdatePayload }>({
    mutationFn: ({ id, payload }) => api.atualizarQuadra(adminId, id, payload),
    onSuccess: () => {
      toast({ title: "Quadra atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["quadras"] });
      setQuadraDialogOpen(false);
      setEditingQuadra(null);
      setQuadraForm(createDefaultQuadraForm());
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar quadra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removerQuadraMutation = useMutation<void, ApiError, string>({
    mutationFn: (quadraId) => api.removerQuadra(adminId, quadraId),
    onSuccess: () => {
      toast({ title: "Quadra removida." });
      queryClient.invalidateQueries({ queryKey: ["quadras"] });
    },
    onError: (error) => {
      toast({
        title: "Não foi possível remover a quadra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const criarUsuarioMutation = useMutation<UsuarioDto, ApiError, CriarUsuarioComPerfilDto>({
    mutationFn: (payload) => api.registrarUsuarioComoAdmin(adminId, payload),
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      setUsuarioDialogOpen(false);
      setUsuarioForm(defaultUsuarioForm);
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removerUsuarioMutation = useMutation<void, ApiError, string>({
    mutationFn: (usuarioId) => api.removerUsuario(adminId, usuarioId),
    onSuccess: () => {
      toast({ title: "Usuário removido." });
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
    },
    onError: (error) => {
      toast({
        title: "Não foi possível remover o usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const abrirCriarQuadra = () => {
    setEditingQuadra(null);
    setQuadraForm(createDefaultQuadraForm());
    setQuadraDialogOpen(true);
  };

  const abrirEditarQuadra = (quadra: Quadra) => {
    setEditingQuadra(quadra);
    const existingImage = quadra.imagemUrl ?? null;
    setQuadraForm({
      nome: quadra.nome,
      modalidadePrincipal: quadra.modalidadePrincipal,
      precoPorHora: quadra.precoPorHora.toString(),
      imagemFile: null,
      imagemPreview: resolveQuadraImage(existingImage),
      existingImagemUrl: existingImage,
      removerImagem: false,
    });
    setQuadraDialogOpen(true);
  };

  const abrirCriarUsuario = () => {
    setUsuarioForm(defaultUsuarioForm);
    setUsuarioDialogOpen(true);
  };

  const handleQuadraImagemChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setQuadraForm((prev) => {
      if (file) {
        return {
          ...prev,
          imagemFile: file,
          imagemPreview: URL.createObjectURL(file),
          removerImagem: false,
        };
      }

      return {
        ...prev,
        imagemFile: null,
        imagemPreview: prev.removerImagem
          ? null
          : prev.existingImagemUrl
            ? resolveQuadraImage(prev.existingImagemUrl)
            : null,
      };
    });

    event.target.value = "";
  };

  const toggleRemoverImagemAtual = () => {
    setQuadraForm((prev) => {
      if (prev.removerImagem) {
        return {
          ...prev,
          removerImagem: false,
          imagemPreview: prev.existingImagemUrl ? resolveQuadraImage(prev.existingImagemUrl) : null,
        };
      }

      return {
        ...prev,
        removerImagem: true,
        imagemFile: null,
        imagemPreview: null,
      };
    });
  };

  const limparNovaImagemSelecionada = () => {
    setQuadraForm((prev) => ({
      ...prev,
      imagemFile: null,
      imagemPreview: prev.removerImagem
        ? null
        : prev.existingImagemUrl
          ? resolveQuadraImage(prev.existingImagemUrl)
          : null,
    }));
  };

  const handleSubmitQuadra = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const preco = Number(quadraForm.precoPorHora);
    if (!quadraForm.nome.trim() || !quadraForm.modalidadePrincipal.trim() || Number.isNaN(preco) || preco <= 0) {
      toast({
        title: "Preencha os dados da quadra",
        description: "Informe nome, modalidade e um preço horário válido.",
        variant: "destructive",
      });
      return;
    }

    const basePayload: QuadraFormPayload = {
      nome: quadraForm.nome.trim(),
      modalidadePrincipal: quadraForm.modalidadePrincipal.trim(),
      precoPorHora: Number(preco.toFixed(2)),
      imagem: quadraForm.imagemFile ?? undefined,
    };

    if (editingQuadra) {
      const removerImagem = quadraForm.removerImagem && !quadraForm.imagemFile;
      const payload: QuadraUpdatePayload = removerImagem ? { ...basePayload, removerImagem } : basePayload;

      atualizarQuadraMutation.mutate({ id: editingQuadra.id, payload });
    } else {
      criarQuadraMutation.mutate(basePayload);
    }
  };

  const handleSubmitUsuario = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { nome, sobrenome, email, senha, perfil } = usuarioForm;

    if (!nome.trim() || !sobrenome.trim() || !email.trim() || !senha.trim()) {
      toast({
        title: "Preencha os dados do usuário",
        description: "Nome, sobrenome, e-mail e senha são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "E-mail inválido",
        description: "Informe um endereço de e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    if (senha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const payload: CriarUsuarioComPerfilDto = {
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      perfil: Number(perfil) as PerfilUsuario,
    };

    criarUsuarioMutation.mutate(payload);
  };

  const handleRemoverUsuario = (usuarioId: string) => {
    if (usuarioId === usuario.id) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode remover o próprio usuário administrador logado.",
        variant: "destructive",
      });
      return;
    }

    removerUsuarioMutation.mutate(usuarioId);
  };

  const formatarPerfil = (perfil: PerfilUsuario) =>
    perfil === PerfilUsuarioEnum.Administrador ? "Administrador" : "Cliente";

  const formatarStatus = (status: StatusReserva) => {
    switch (status) {
      case StatusReserva.Confirmada:
        return { texto: "Confirmada", variante: "default" } as const;
      case StatusReserva.Cancelada:
        return { texto: "Cancelada", variante: "destructive" } as const;
      default:
        return { texto: "Pendente", variante: "secondary" } as const;
    }
  };

  const reservasRecentes = reservasQuery.data?.slice(0, 6) ?? [];

  const estaCarregandoQuadra = criarQuadraMutation.isPending || atualizarQuadraMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-10 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Painel do Administrador</h1>
          <p className="text-muted-foreground">
            Acompanhe as reservas, gerencie quadras e mantenha os usuários sempre atualizados.
          </p>
        </header>

        <Tabs defaultValue="reservas" className="space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <TabsList>
              <TabsTrigger value="reservas">Reservas</TabsTrigger>
              <TabsTrigger value="quadras">Quadras</TabsTrigger>
              <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="reservas" className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Reservas recentes</h2>
                  <p className="text-sm text-muted-foreground">Acompanhe as últimas movimentações dos clientes na plataforma.</p>
                </div>
                <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-reservas"] })}>
                  Atualizar lista
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reservasQuery.isLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} className="animate-pulse">
                        <CardContent className="h-32" />
                      </Card>
                    ))
          : reservasRecentes.map((reserva) => {
            const statusInfo = formatarStatus(reserva.status);
            const inicio = new Date(reserva.dataHoraInicio);
            const fim = new Date(reserva.dataHoraFim);
            return (
                        <Card key={reserva.id}>
                          <CardHeader className="space-y-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-semibold">{reserva.quadraNome}</CardTitle>
                              <Badge variant={statusInfo.variante}>{statusInfo.texto}</Badge>
                            </div>
                            <CardDescription>
                              {format(inicio, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-2 text-sm">
                            <p className="font-medium text-foreground">
                              Cliente: {`${reserva.usuarioNome} ${reserva.usuarioSobrenome}`.trim()}
                            </p>
                            <p className="text-muted-foreground">
                              Duração: {format(inicio, "HH:mm", { locale: ptBR })} - {format(fim, "HH:mm", { locale: ptBR })}
                            </p>
                            <p className="text-muted-foreground">Valor total: R$ {reserva.precoTotal.toFixed(2)}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
              </div>
              {!reservasQuery.isLoading && reservasRecentes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma reserva recente por aqui.</p>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Todas as reservas</CardTitle>
                  <CardDescription>Visualize a agenda completa para análises detalhadas.</CardDescription>
                </CardHeader>
                <CardContent>
                  {reservasQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Carregando reservas...</p>
                  ) : reservasQuery.isError ? (
                    <p className="text-sm text-destructive">
                      {reservasQuery.error?.message ?? "Não foi possível carregar as reservas."}
                    </p>
                  ) : reservasQuery.data?.length ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quadra</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Início</TableHead>
                            <TableHead>Fim</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reservasQuery.data.map((reserva) => {
                            const statusInfo = formatarStatus(reserva.status);
                            const inicio = new Date(reserva.dataHoraInicio);
                            const fim = new Date(reserva.dataHoraFim);
                            return (
                              <TableRow key={reserva.id}>
                                <TableCell className="font-medium">{reserva.quadraNome}</TableCell>
                                <TableCell>{`${reserva.usuarioNome} ${reserva.usuarioSobrenome}`.trim()}</TableCell>
                                <TableCell>{format(inicio, "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                                <TableCell>{format(fim, "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                                <TableCell>
                                  <Badge variant={statusInfo.variante}>{statusInfo.texto}</Badge>
                                </TableCell>
                                <TableCell className="text-right">R$ {reserva.precoTotal.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma reserva registrada.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quadras" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Quadras cadastradas</h2>
                <p className="text-sm text-muted-foreground">Gerencie as quadras da plataforma, atualize dados ou remova itens.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={abrirCriarQuadra} disabled={estaCarregandoQuadra}>
                  <Plus className="mr-2 h-4 w-4" /> Nova quadra
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                {quadrasQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando quadras...</p>
                ) : quadrasQuery.isError ? (
                  <p className="text-sm text-destructive">{quadrasQuery.error?.message ?? "Não foi possível carregar."}</p>
                ) : quadrasQuery.data?.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quadra</TableHead>
                          <TableHead>Modalidade</TableHead>
                          <TableHead>Preço/hora</TableHead>
                          <TableHead>Imagem</TableHead>
                          <TableHead className="w-[160px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quadrasQuery.data.map((quadra) => (
                          <TableRow key={quadra.id}>
                            <TableCell className="font-medium">{quadra.nome}</TableCell>
                            <TableCell>{quadra.modalidadePrincipal}</TableCell>
                            <TableCell>R$ {quadra.precoPorHora.toFixed(2)}</TableCell>
                            <TableCell>
                              {resolveQuadraImage(quadra.imagemUrl) ? (
                                <img
                                  src={resolveQuadraImage(quadra.imagemUrl) ?? undefined}
                                  alt={quadra.nome}
                                  className="h-12 w-20 rounded object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">Sem imagem</span>
                              )}
                            </TableCell>
                            <TableCell className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => abrirEditarQuadra(quadra)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removerQuadraMutation.mutate(quadra.id)}
                                disabled={removerQuadraMutation.isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remover
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma quadra cadastrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Usuários</h2>
                <p className="text-sm text-muted-foreground">Cadastre novos usuários ou remova acessos quando necessário.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={abrirCriarUsuario} disabled={criarUsuarioMutation.isPending}>
                  <Plus className="mr-2 h-4 w-4" /> Novo usuário
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                {usuariosQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                ) : usuariosQuery.isError ? (
                  <p className="text-sm text-destructive">
                    {usuariosQuery.error?.message ?? "Não foi possível carregar os usuários."}
                  </p>
                ) : usuariosQuery.data?.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Perfil</TableHead>
                          <TableHead className="w-[140px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usuariosQuery.data.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{`${item.nome} ${item.sobrenome}`.trim()}</TableCell>
                            <TableCell>{item.email}</TableCell>
                            <TableCell>{formatarPerfil(item.perfil)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoverUsuario(item.id)}
                                disabled={removerUsuarioMutation.isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remover
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={quadraDialogOpen} onOpenChange={(open) => {
        setQuadraDialogOpen(open);
        if (!open) {
          setEditingQuadra(null);
          setQuadraForm(createDefaultQuadraForm());
        }
      }}>
  <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingQuadra ? "Editar quadra" : "Nova quadra"}</DialogTitle>
            <DialogDescription>
              {editingQuadra
                ? "Atualize as informações da quadra selecionada."
                : "Preencha os dados abaixo para disponibilizar uma nova quadra."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitQuadra} className="space-y-4 pb-2">
            <div className="space-y-2">
              <Label htmlFor="quadra-nome">Nome</Label>
              <Input
                id="quadra-nome"
                value={quadraForm.nome}
                onChange={(event) => setQuadraForm((prev) => ({ ...prev, nome: event.target.value }))}
                placeholder="Quadra Central"
                disabled={estaCarregandoQuadra}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quadra-modalidade">Modalidade principal</Label>
              <Input
                id="quadra-modalidade"
                value={quadraForm.modalidadePrincipal}
                onChange={(event) => setQuadraForm((prev) => ({ ...prev, modalidadePrincipal: event.target.value }))}
                placeholder="Futevôlei"
                disabled={estaCarregandoQuadra}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quadra-preco">Preço por hora (R$)</Label>
              <Input
                id="quadra-preco"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={quadraForm.precoPorHora}
                onChange={(event) => setQuadraForm((prev) => ({ ...prev, precoPorHora: event.target.value }))}
                placeholder="120"
                disabled={estaCarregandoQuadra}
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label htmlFor="quadra-imagem">Imagem da quadra</Label>
                  <p className="text-xs text-muted-foreground">
                    Envie uma imagem horizontal (JPG, PNG ou WEBP) com até 5 MB para ilustrar a quadra.
                  </p>
                </div>
                {editingQuadra && quadraForm.existingImagemUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleRemoverImagemAtual}
                    disabled={estaCarregandoQuadra}
                    className="rounded-full px-4"
                  >
                    {quadraForm.removerImagem ? "Manter imagem atual" : "Remover imagem atual"}
                  </Button>
                ) : null}
              </div>

              <Input
                id="quadra-imagem"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleQuadraImagemChange}
                disabled={estaCarregandoQuadra}
              />

              {quadraForm.imagemPreview ? (
                <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                  <img
                    src={quadraForm.imagemPreview}
                    alt="Pré-visualização da quadra"
                    className="max-h-48 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  {quadraForm.removerImagem
                    ? "A imagem atual será removida ao salvar."
                    : "Nenhuma imagem selecionada no momento."}
                </p>
              )}

              {quadraForm.imagemFile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={limparNovaImagemSelecionada}
                  disabled={estaCarregandoQuadra}
                  className="w-fit"
                >
                  Cancelar nova imagem
                </Button>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={estaCarregandoQuadra}>
                {estaCarregandoQuadra ? "Salvando..." : editingQuadra ? "Atualizar quadra" : "Cadastrar quadra"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={usuarioDialogOpen} onOpenChange={(open) => {
        setUsuarioDialogOpen(open);
        if (!open) {
          setUsuarioForm(defaultUsuarioForm);
        }
      }}>
  <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>Preencha os dados para criar um novo usuário na plataforma.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitUsuario} className="space-y-4 pb-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usuario-nome">Nome</Label>
                <Input
                  id="usuario-nome"
                  value={usuarioForm.nome}
                  onChange={(event) => setUsuarioForm((prev) => ({ ...prev, nome: event.target.value }))}
                  placeholder="Ana"
                  disabled={criarUsuarioMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usuario-sobrenome">Sobrenome</Label>
                <Input
                  id="usuario-sobrenome"
                  value={usuarioForm.sobrenome}
                  onChange={(event) => setUsuarioForm((prev) => ({ ...prev, sobrenome: event.target.value }))}
                  placeholder="Souza"
                  disabled={criarUsuarioMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuario-email">E-mail</Label>
              <Input
                id="usuario-email"
                type="email"
                value={usuarioForm.email}
                onChange={(event) => setUsuarioForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="ana.souza@email.com"
                disabled={criarUsuarioMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuario-senha">Senha</Label>
              <Input
                id="usuario-senha"
                type="password"
                value={usuarioForm.senha}
                onChange={(event) => setUsuarioForm((prev) => ({ ...prev, senha: event.target.value }))}
                placeholder="********"
                disabled={criarUsuarioMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">A senha deve conter pelo menos 6 caracteres.</p>
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={usuarioForm.perfil}
                onValueChange={(value) => setUsuarioForm((prev) => ({ ...prev, perfil: value }))}
                disabled={criarUsuarioMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(PerfilUsuarioEnum.Cliente)}>Cliente</SelectItem>
                  <SelectItem value={String(PerfilUsuarioEnum.Administrador)}>Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={criarUsuarioMutation.isPending}>
                {criarUsuarioMutation.isPending ? "Criando..." : "Criar usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
