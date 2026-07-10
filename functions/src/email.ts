/**
 * E-mail transacional via Google Workspace (RF-51 / seção 8).
 *
 * Usa o SMTP relay do Workspace (smtp-relay.gmail.com) ou uma conta com senha
 * de app. Configuração por parâmetros do Functions:
 *   firebase functions:secrets:set SMTP_PASS
 *   e defina SMTP_HOST / SMTP_USER / EMAIL_FROM no deploy (ou .env do codebase).
 * Sem configuração, os e-mails são apenas registrados no log (modo emulador).
 */
import * as logger from 'firebase-functions/logger';
import { defineString } from 'firebase-functions/params';
import * as nodemailer from 'nodemailer';

export const SMTP_HOST = defineString('SMTP_HOST', { default: '' });
export const SMTP_USER = defineString('SMTP_USER', { default: '' });
export const EMAIL_FROM = defineString('EMAIL_FROM', { default: 'Portal Flux <portal-flux@tecnofink.com>' });
// Senha SMTP: lida do ambiente. Fica vazia até o e-mail ser configurado
// (quando ativarem, gravar como segredo do Functions e reativar a ligação
// em setGlobalOptions). Sem SMTP_HOST, o envio é apenas registrado no log.
const SMTP_PASS = () => process.env.SMTP_PASS ?? '';

export interface Mensagem {
  para: string | string[];
  assunto: string;
  corpo: string; // texto simples; o rodapé padrão é acrescentado
}

export async function enviar(m: Mensagem): Promise<void> {
  const host = SMTP_HOST.value();
  const texto = m.corpo + '\n\n—\nPortal Flux · Tecnofink\nEsta é uma mensagem automática do hub de ferramentas de IA.';
  if (!host) {
    logger.info('[e-mail não configurado — apenas log]', { para: m.para, assunto: m.assunto });
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      auth: SMTP_USER.value() ? { user: SMTP_USER.value(), pass: SMTP_PASS() } : undefined,
    });
    await transporter.sendMail({
      from: EMAIL_FROM.value(),
      to: Array.isArray(m.para) ? m.para.join(', ') : m.para,
      subject: m.assunto,
      text: texto,
    });
    logger.info('e-mail enviado', { para: m.para, assunto: m.assunto });
  } catch (e) {
    // e-mail nunca derruba o fluxo principal
    logger.error('falha ao enviar e-mail', { erro: String(e), assunto: m.assunto });
  }
}
