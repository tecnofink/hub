import React, { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppStoreProvider } from './store/AppStore';
import Shell, { RequireRole } from './components/Shell';
import Login from './pages/Login';

// páginas carregadas sob demanda (code-splitting por rota) — o chunk de entrada
// deixa de trazer as ~35 telas de uma vez; cada grupo baixa ao ser aberto
const Hub = lazy(() => import('./pages/Hub'));
const Perfil = lazy(() => import('./pages/Perfil'));
const Playbook = lazy(() => import('./pages/Playbook'));
const Ferramenta = lazy(() => import('./pages/Ferramenta'));
const FluxHome = lazy(() => import('./pages/flux/FluxHome'));
const ComoFunciona = lazy(() => import('./pages/flux/ComoFunciona'));
const Inscrever = lazy(() => import('./pages/flux/Inscrever'));
const Confirmar = lazy(() => import('./pages/flux/Confirmar'));
const Projeto = lazy(() => import('./pages/flux/Projeto'));
const Resultado = lazy(() => import('./pages/flux/Resultado'));
const Ranking = lazy(() => import('./pages/flux/Ranking'));
const Categorias = lazy(() => import('./pages/flux/Categorias'));
const Historico = lazy(() => import('./pages/flux/Historico'));
const Gestor = lazy(() => import('./pages/gestor/Gestor'));
const Tarefas = lazy(() => import('./pages/gestor/Tarefas'));
const ProjetoAdmin = lazy(() => import('./pages/gestor/ProjetoAdmin'));
const ComiteLayout = lazy(() => import('./pages/comite/ComiteLayout'));
const Acesso = lazy(() => import('./pages/comite/Acesso'));
const Fila = lazy(() => import('./pages/comite/Fila'));
const Avaliar = lazy(() => import('./pages/comite/Avaliar'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdmPainel = lazy(() => import('./pages/admin/AdmPainel'));
const AdmUsuarios = lazy(() => import('./pages/admin/AdmUsuarios'));
const AdmUsuariosHub = lazy(() => import('./pages/admin/AdmUsuariosHub'));
const AdmCiclos = lazy(() => import('./pages/admin/AdmCiclos'));
const AdmPitches = lazy(() => import('./pages/admin/AdmPitches'));
const AdmAcessos = lazy(() => import('./pages/admin/AdmAcessos'));
const AdmLogs = lazy(() => import('./pages/admin/AdmLogs'));
const AdmDominios = lazy(() => import('./pages/admin/AdmDominios'));
const AdmFerramentas = lazy(() => import('./pages/admin/AdmFerramentas'));

export default function App() {
  return (
    <AppStoreProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Shell />}>
            <Route path="/" element={<Hub />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/playbook" element={<Playbook />} />

            <Route path="/flux" element={<FluxHome />} />
            <Route path="/flux/como-funciona" element={<ComoFunciona />} />
            <Route path="/flux/inscrever" element={<Inscrever />} />
            <Route path="/flux/confirmar" element={<Confirmar />} />
            <Route path="/flux/projeto/:id" element={<Projeto />} />
            <Route path="/flux/projeto/:id/resultado" element={<Resultado />} />
            <Route path="/flux/ranking" element={<Ranking />} />
            <Route path="/flux/ranking/:cicloId" element={<Ranking />} />
            <Route path="/flux/categorias" element={<Categorias />} />
            <Route path="/flux/historico" element={<Historico />} />

            <Route path="/tarefas" element={<Gestor />} />
            <Route path="/tarefas/:id" element={<Tarefas />} />
            <Route path="/tarefas/:id/admin" element={<ProjetoAdmin />} />

            <Route
              path="/comite"
              element={<RequireRole role="avaliador"><ComiteLayout /></RequireRole>}
            >
              <Route index element={<Navigate to="/comite/acesso" replace />} />
              <Route path="acesso" element={<Acesso />} />
              <Route path="fila" element={<Fila />} />
              <Route path="avaliar/:id" element={<Avaliar />} />
            </Route>

            <Route
              path="/admin/flux"
              element={<RequireRole role="fluxAdmin"><AdminLayout /></RequireRole>}
            >
              <Route index element={<AdmPainel />} />
              <Route path="usuarios" element={<AdmUsuarios />} />
              <Route path="ciclos" element={<AdmCiclos />} />
              <Route path="pitches" element={<AdmPitches />} />
              <Route path="acessos" element={<AdmAcessos />} />
              <Route path="logs" element={<AdmLogs />} />
            </Route>
            <Route
              path="/admin/hub"
              element={<RequireRole role="hubAdmin"><AdminLayout /></RequireRole>}
            >
              <Route index element={<Navigate to="/admin/hub/dominios" replace />} />
              <Route path="dominios" element={<AdmDominios />} />
              <Route path="ferramentas" element={<AdmFerramentas />} />
              <Route path="usuarios" element={<AdmUsuariosHub />} />
            </Route>
          </Route>
          <Route element={<Shell />}>
            {/* rota curinga: ferramentas cadastradas no hub (RF-57) */}
            <Route path="*" element={<Ferramenta />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStoreProvider>
  );
}
