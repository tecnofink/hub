/**
 * E-mail transacional via Google Workspace (RF-51 / seção 8).
 *
 * Autentica via smtp.gmail.com (conta Workspace + senha de app). Configuração:
 *   - SMTP_HOST / SMTP_USER / EMAIL_FROM: parâmetros (functions/.env.* — SEM segredo).
 *   - SMTP_PASS: SEMPRE segredo do Secret Manager (firebase functions:secrets:set
 *     SMTP_PASS) e ligado via setGlobalOptions({ secrets: ['SMTP_PASS'] }).
 *     NUNCA colocar a senha em .env versionado (o repositório é público).
 * Sem SMTP_HOST, o envio é apenas registrado no log (modo emulador/dev).
 */
import * as logger from 'firebase-functions/logger';
import { defineString } from 'firebase-functions/params';
import * as nodemailer from 'nodemailer';

export const SMTP_HOST = defineString('SMTP_HOST', { default: '' });
export const SMTP_USER = defineString('SMTP_USER', { default: '' });
export const EMAIL_FROM = defineString('EMAIL_FROM', { default: 'Portal Flux <portal-flux@tecnofink.com>' });
// Senha SMTP: injetada como segredo do Secret Manager (setGlobalOptions.secrets),
// disponível em process.env. NUNCA vem de .env versionado.
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
    // multidestinatário vai por BCC (não expõe a lista de e-mails a todos);
    // destinatário único fica no To normalmente
    const lista = Array.isArray(m.para) ? m.para : [m.para];
    const multi = lista.length > 1;
    await transporter.sendMail({
      from: EMAIL_FROM.value(),
      to: multi ? EMAIL_FROM.value() : lista[0],
      bcc: multi ? lista : undefined,
      subject: m.assunto,
      text: texto,
    });
    logger.info('e-mail enviado', { para: m.para, assunto: m.assunto });
  } catch (e) {
    // e-mail nunca derruba o fluxo principal
    logger.error('falha ao enviar e-mail', { erro: String(e), assunto: m.assunto });
  }
}
