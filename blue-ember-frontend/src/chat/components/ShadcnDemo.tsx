'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, AlertTriangle, Info, Flame } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

export function ShadcnDemo() {
  const [loading, setLoading] = useState(false)

  const triggerToast = (variant: 'default' | 'success' | 'warning' | 'destructive' | 'info') => {
    const configs: Record<string, { title: string; description: string }> = {
      default: {
        title: 'Análise concluída',
        description: 'Seu relatório de risco foi gerado com sucesso.',
      },
      success: {
        title: 'Sucesso',
        description: 'Dados salvos com sucesso no banco.',
      },
      warning: {
        title: 'Atenção',
        description: 'Verifique os parâmetros de atmosfera antes de continuar.',
      },
      destructive: {
        title: 'Erro',
        description: 'Falha ao conectar com a API da NASA.',
      },
      info: {
        title: 'Informação',
        description: 'Nova versão do dashboard disponível.',
      },
    }
    const c = configs[variant]
    toast({ title: c.title, description: c.description, variant })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 p-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border pb-8"
      >
        <div>
          <Card className="p-0 border-none shadow-none bg-transparent hover:shadow-none hover:border-none transition-none">
            <CardContent className="p-0 pt-0">
              <div className="flex items-center gap-3">
                <Flame className="size-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Blue Ember</h1>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  shadcn/ui Components
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => triggerToast('info')}>
            <Info className="size-4 mr-2" />
            Notificação Info
          </Button>
          <Button onClick={() => triggerToast('success')}>
            <CheckCircle className="size-4 mr-2" />
            Sucesso
          </Button>
          <Button variant="destructive" onClick={() => triggerToast('destructive')}>
            <AlertTriangle className="size-4 mr-2" />
            Erro
          </Button>
        </div>
      </motion.div>

      {/* Grid de componentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Card com Animação</CardTitle>
              <CardDescription>
                Passe o mouse para ver o efeito de elevação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este card utiliza framer-motion para animações de hover e tap.
                O efeito eleva levemente o elemento e reduz a escala ao clicar.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Interativo</Badge>
                <Badge variant="outline">Hover</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm" asChild>
                <a href="#" className="flex items-center gap-2">
                  Ver detalhes <ArrowRight className="size-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Investigações</CardTitle>
              <CardDescription>
                Listagem com linhas animadas e hover states.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Ambiente</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Categoria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>SAFFIRE-II</TableCell>
                      <TableCell>Propagação de chama em sólidos</TableCell>
                      <TableCell>Cygnus</TableCell>
                      <TableCell>
                        <Progress value={87} className="w-24" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="critical">Alto</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>FLEX-II</TableCell>
                      <TableCell>Gotas de combustível líquido</TableCell>
                      <TableCell>ISS (CIR)</TableCell>
                      <TableCell>
                        <Progress value={42} variant="success" className="w-24" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning">Médio</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>ACME-III</TableCell>
                      <TableCell>Chamas gasosas não pré-misturadas</TableCell>
                      <TableCell>ISS (CIR)</TableCell>
                      <TableCell>
                        <Progress value={63} variant="warning" className="w-24" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">Baixo</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Barras de Progresso</CardTitle>
              <CardDescription>
                Animação de preenchimento ao carregar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Prevenção</span>
                  <span className="text-muted-foreground">85%</span>
                </div>
                <Progress value={85} className="h-3" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Detecção</span>
                  <span className="text-muted-foreground">62%</span>
                </div>
                <Progress value={62} variant="warning" className="h-3" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Supressão</span>
                  <span className="text-muted-foreground">91%</span>
                </div>
                <Progress value={91} variant="success" className="h-3" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Risco Geral</span>
                  <span className="text-muted-foreground">47%</span>
                </div>
                <Progress value={47} variant="destructive" className="h-3" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Segunda linha: Badge, Spinner, Empty, Toast */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Badge */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Badges por Status</CardTitle>
              <CardDescription>
                Variantes de cor para diferentes contextos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secundário</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Sucesso</Badge>
              <Badge variant="warning">Aviso</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="critical">Crítico</Badge>
              <Badge variant="destructive">Destrutivo</Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spinner */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Spinner de Loading</CardTitle>
              <CardDescription>
                Animação de rotação infinita.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
              <Spinner size="lg" className="text-primary" />
              <div className="flex gap-3">
                <Button size="sm" onClick={() => {
                  setLoading(true)
                  setTimeout(() => setLoading(false), 2000)
                }}>
                  {loading ? <Spinner size="sm" className="mr-2" /> : null}
                  Carregar
                </Button>
                <Button variant="outline" size="sm">
                  <Spinner size="sm" className="mr-2" />
                  Processando
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Empty */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Estado Vazio</CardTitle>
              <CardDescription>
                Exemplo quando não há dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[300px]">
              <Empty
                icon={
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <AlertTriangle className="size-8" />
                  </div>
                }
                title="Nenhuma análise encontrada"
                description={
                  <p className="text-sm">
                    Comece uma nova análise para ver os resultados aqui.
                  </p>
                }
                action={
                  <Button onClick={() => triggerToast('success')}>
                    Nova Análise
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Toast */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Notificações (Toast)</CardTitle>
              <CardDescription>
                Teste os diferentes tipos de alerta.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={() => triggerToast('default')}>
                Default
              </Button>
              <Button variant="success" size="sm" onClick={() => triggerToast('success')}>
                Sucesso
              </Button>
              <Button variant="warning" size="sm" onClick={() => triggerToast('warning')}>
                Aviso
              </Button>
              <Button variant="destructive" size="sm" onClick={() => triggerToast('destructive')}>
                Erro
              </Button>
              <Button variant="info" size="sm" onClick={() => triggerToast('info')}>
                Info
              </Button>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  )
}
