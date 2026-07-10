import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppStoreProvider } from './store/AppStore';
import Shell, { RequireRole } from './components/Shell';
import Login from './pages/Login';
import Hub from './pages/Hub';
import Perfil from './pages/Perfil';
import Playbook from './pages/Playbook';
import Ferramenta from './pages/Ferramenta';
import FluxHome from './pages/flux/FluxHome';
import ComoFunciona from './pages/flux/ComoFunciona';
import Inscrever from './pages/flux/Inscrever';
import Confirmar from './pages/flux/Confirmar';
import Projeto from './pages/flux/Projeto';
import Resultado from './pages/flux/Resultado';
import Ranking from './pages/flux/Ranking';
import Categorias from './pages/flux/Categorias';
import Historico from './pages/flux/Historico';
import Gestor from './pages/gestor/Gestor';
import Tarefas from './pages/gestor/Tarefas';
import ProjetoAdmin from './pages/gestor/ProjetoAdmin';
import ComiteLayout from './pages/comite/ComiteLayout';
import Acesso from './pages/comite/Acesso';
import Fila from './pages/comite/Fila';
import Avaliar from './pages/comite/Avaliar';
import AdminLayout from './pages/admin/AdminLayout';
import AdmPainel from './pages/admin/AdmPainel';
import AdmUsuarios from './pages/admin/AdmUsuarios';
import AdmUsuariosHub from './pages/admin/AdmUsuariosHub';
import AdmCiclos from './pages/admin/AdmCiclos';
import AdmPitches from './pages/admin/AdmPitches';
import AdmAcessos from './pages/admin/AdmAcessos';
import AdmLogs from './pages/admin/AdmLogs';
import AdmDominios from './pages/admin/AdmDominios';
import AdmFerramentas from './pages/admin/AdmFerramentas';

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
